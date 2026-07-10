import { useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCw,
  Search,
  Send,
  Users,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { usePeriodeOptions } from "@/domains/periode/hooks/usePeriode";
import { StatCard } from "@/shared/components/StatCard";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  DONATUR_KEY,
  useDonaturList,
  useDonaturStats,
  useMonitoringList,
  usePesanTemplates,
} from "../hooks/useDonatur";
import { DONATUR_TAGS, skemaLabel, tagMeta } from "../services";
import type { DonaturMonitoring, PesanTemplate } from "../services";

const ALL = "all";
const fmt = (v: number) => new Intl.NumberFormat("id-ID").format(v);
const BULAN_NAMA = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${BULAN_NAMA[Number(m) - 1]} ${y.slice(2)}`;
};
const nextMonthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1)); // m (1-based) → next month index
  return `${BULAN_NAMA[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
};

// Normalisasi HP ke format internasional 62xxx untuk wa.me
function normalizeWa(hp: string) {
  let n = (hp || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  else if (!n.startsWith("62")) n = "62" + n;
  return n;
}

// Isi placeholder {{...}} / {...} dari data baris monitoring
function fillTemplate(isi: string, row: DonaturMonitoring) {
  const bulanan = row.bulanan ?? [];
  const lastBulan = bulanan.length ? bulanan[bulanan.length - 1].bulan : "";
  const map: Record<string, string> = {
    nama: row.nama,
    kode: row.kode || "",
    bulan: lastBulan ? monthLabel(lastBulan) : "",
    bulan_berikutnya: lastBulan ? nextMonthLabel(lastBulan) : "",
    nominal: fmt(row.total),
    skema: skemaLabel(row.skema),
    periode: row.periode_akhir ?? "",
  };
  return isi.replace(/\{\{?\s*(\w+)\s*\}?\}/g, (_, key) => map[key] ?? `{{${key}}}`);
}

function KirimDropdown({
  row,
  hp,
  templates,
}: {
  row: DonaturMonitoring;
  hp: string;
  templates: PesanTemplate[];
}) {
  const donaturTemplates = templates.filter((t) => t.aktif && (t.konteks === "donatur" || t.konteks === ""));
  const openWa = (t: PesanTemplate) => {
    const text = encodeURIComponent(fillTemplate(t.isi, row));
    window.open(`https://wa.me/${normalizeWa(hp)}?text=${text}`, "_blank", "noopener");
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7">
          <Send className="h-3.5 w-3.5 mr-1" />
          Kirim
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Pilih template WA</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(donaturTemplates.length ? donaturTemplates : templates.filter((t) => t.aktif)).map((t) => (
          <DropdownMenuItem key={t.id} onClick={() => openWa(t)}>
            {t.nama}
          </DropdownMenuItem>
        ))}
        {templates.length === 0 && (
          <DropdownMenuItem disabled>Belum ada template pesan</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MonitoringPage() {
  const queryClient = useQueryClient();
  const globalPeriode = usePeriodeFilter((s) => s.periodeId) ?? undefined;

  const [search, setSearch] = useState("");
  const [tag, setTag] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  // Checkbox Reset = state UI lokal (tandai baris sudah di-follow-up), tidak dipersist
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());

  const { data: stats, isLoading: statsLoading } = useDonaturStats();
  const { data: periodeData } = usePeriodeOptions();
  const { data: templateData } = usePesanTemplates();
  // Untuk WA butuh nomor HP → ambil dari list donatur (monitoring tak bawa hp)
  const { data: donaturData } = useDonaturList({ limit: 100 });

  const { data, isLoading } = useMonitoringList({
    page,
    limit,
    periode_id: globalPeriode,
    tag: tag === ALL ? undefined : tag,
    search: search || undefined,
  });

  const periodeAktif = (periodeData?.items ?? []).filter((p) => p.status === "aktif");
  const hpByDonatur = new Map((donaturData?.items ?? []).map((d) => [d.id, d.hp]));
  const templates = templateData?.items ?? [];

  const rawItems = data?.items ?? [];
  const items = status === ALL
    ? rawItems
    : rawItems.filter((r) => (status === "aktif" ? r.periode_akhir_aktif : !r.periode_akhir_aktif));
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  // Kolom bulan dinamis: dari baris dengan bulanan terpanjang (semua sama saat periode_id sama).
  // Guard `?? []` — backend mengirim nil slice sebagai null (bukan []) untuk baris tanpa data.
  const monthKeys = rawItems.reduce<string[]>(
    (acc, r) => ((r.bulanan ?? []).length > acc.length ? (r.bulanan ?? []).map((b) => b.bulan) : acc),
    []
  );
  const hasMonths = monthKeys.length > 0;

  const toggleReviewed = (id: number) =>
    setReviewed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const colCount = 5 + (hasMonths ? monthKeys.length : 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Monitoring Donatur</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: [DONATUR_KEY] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Donatur" value={String(stats?.total ?? "—")} loading={statsLoading} />
        <StatCard icon={CheckCircle2} label="Aktif Periode" value={String(stats?.aktif_periode ?? "—")} loading={statsLoading} />
        <StatCard icon={AlertTriangle} label="Belum Diklasif." value={String(stats?.belum_diklasifikasi ?? "—")} loading={statsLoading} />
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <CalendarCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">
                {periodeAktif.length ? periodeAktif.map((p) => p.nama).join(", ") : "—"}
              </div>
              <div className="text-xs text-muted-foreground">Periode Aktif</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info cara pakai */}
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
        <Info className="h-4 w-4 shrink-0 text-primary" />
        Klik <strong>Kirim</strong> → pilih template → WhatsApp terbuka dengan pesan siap kirim
        (placeholder terisi otomatis).
        {!globalPeriode && " Pilih periode di Filter Periode (sidebar) untuk menampilkan kolom donasi per bulan."}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama/kode…"
            className="pl-9 w-64"
          />
        </div>
        <Select value={status} onValueChange={(v: string) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Status</SelectItem>
            <SelectItem value="aktif">Periode Akhir Aktif</SelectItem>
            <SelectItem value="tidak_aktif">Periode Akhir Non-aktif</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tag} onValueChange={(v: string) => { setTag(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Tag</SelectItem>
            {DONATUR_TAGS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.icon} {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabel monitoring */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" title="Reset / sudah di-follow-up (lokal)">Rset</TableHead>
              <TableHead>Nama &amp; Tag</TableHead>
              <TableHead className="w-28">Kirim</TableHead>
              <TableHead className="w-36">Per. Akhir</TableHead>
              {hasMonths &&
                monthKeys.map((m) => (
                  <TableHead key={m} className="w-20 text-right">
                    {monthLabel(m)}
                  </TableHead>
                ))}
              <TableHead className="w-28 text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={colCount}>
                    <div className="h-6 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada donatur ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => {
                const bulananByKey = new Map((r.bulanan ?? []).map((b) => [b.bulan, b.nominal]));
                const done = reviewed.has(r.id);
                return (
                  <TableRow key={r.id} className={cn(done && "opacity-50")}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggleReviewed(r.id)}
                        title="Tandai sudah di-follow-up (lokal, tidak disimpan)"
                        className="h-4 w-4 accent-primary cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium flex items-center gap-1.5">
                        {r.nama}
                        {(r.tags ?? []).map((t) => {
                          const m = tagMeta(t);
                          return m ? <span key={t} title={m.label}>{m.icon}</span> : null;
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.kode || "—"} · {skemaLabel(r.skema)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <KirimDropdown row={r} hp={hpByDonatur.get(r.id) ?? ""} templates={templates} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.periode_akhir ? (
                        <span className="inline-flex items-center gap-1">
                          {r.periode_akhir}
                          {r.periode_akhir_aktif && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" title="Aktif" />
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    {hasMonths &&
                      monthKeys.map((m) => {
                        const n = bulananByKey.get(m) ?? 0;
                        return (
                          <TableCell key={m} className={cn("text-right text-sm", n === 0 && "text-muted-foreground")}>
                            {n ? fmt(n) : "—"}
                          </TableCell>
                        );
                      })}
                    <TableCell className="text-right font-mono text-sm">
                      {r.total ? fmt(r.total) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, totalItems)} dari {totalItems}</span>
              <Select value={String(limit)} onValueChange={(v: string) => { setLimit(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Hal {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
