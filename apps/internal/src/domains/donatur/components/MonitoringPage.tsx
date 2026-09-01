import { useState } from "react";
import type { ChangeEvent } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Users,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, Skeleton } from "@gbb/ui";
import { cn } from "@/lib/utils";
import { formatNominal as fmt, singkatNominal } from "@/shared/lib/nominal";
import { useColumnWindow } from "@/shared/hooks/useColumnWindow";
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
  DONATUR_KEY,
  useDonaturStats,
  useMonitoringList,
  usePesanTemplates,
} from "../hooks/useDonatur";
import { DONATUR_TAGS, WA_KONTEKS, rowColorClass, skemaLabel, tagMeta } from "../services";
import type { DonaturMonitoring, PesanTemplate } from "../services";
import { CatatanTagDialog } from "./CatatanTagDialog";

const ALL = "all";
// Tanpa filter periode, backend mengirim semua bulan yang ada transaksinya —
// bisa puluhan setelah beberapa tahun. Tampilkan sepotong lalu geser dengan
// panah; panahnya baru muncul kalau bulannya memang lebih banyak dari ini.
const MONTH_WINDOW = 10;

const BULAN_NAMA = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
const BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${BULAN_NAMA[Number(m) - 1]} ${y.slice(2)}`;
};
const nextMonthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1)); // m (1-based) → indeks bulan berikutnya
  return `${BULAN_NAMA[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
};

// Bulan yang disasar tiap tombol kirim, dihitung dari tanggal hari ini:
//   Tgl 25 = reminder yang dikirim tgl 25 untuk bulan BERIKUTNYA — jadi sebelum
//            tanggal 25 yang relevan masih bulan berjalan
//   Tgl 7  = follow-up tgl 7 untuk bulan berjalan — sebelum tanggal 7 masih
//            menyasar bulan lalu
function kirimTargets(now = new Date()) {
  const tanggal = now.getDate();
  const at = (offset: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return `${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`;
  };
  return { tgl7: at(tanggal < 7 ? -1 : 0), tgl25: at(tanggal >= 25 ? 1 : 0) };
}

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

function KirimButton({
  row,
  template,
  tone,
}: {
  row: DonaturMonitoring;
  template?: PesanTemplate;
  tone: "tgl7" | "tgl25";
}) {
  const disabled = !template || !row.hp;
  const openWa = () => {
    if (!template) return;
    const text = encodeURIComponent(fillTemplate(template.isi, row));
    window.open(`https://wa.me/${normalizeWa(row.hp)}?text=${text}`, "_blank", "noopener");
  };
  return (
    <Button
      size="sm"
      onClick={openWa}
      disabled={disabled}
      title={
        !row.hp
          ? "Donatur belum punya nomor HP"
          : !template
            ? "Belum ada template pesan — buat dulu di Settings › Template Pesan"
            : `Kirim "${template.nama}" via WhatsApp`
      }
      className={cn(
        "h-7 px-2.5 text-xs text-white",
        tone === "tgl7"
          ? "bg-orange-500 hover:bg-orange-600"
          : "bg-emerald-600 hover:bg-emerald-700"
      )}
    >
      <Send className="h-3 w-3 mr-1" />
      Kirim
    </Button>
  );
}

export function MonitoringPage() {
  const queryClient = useQueryClient();
  const globalPeriode = usePeriodeFilter((s) => s.periodeId) ?? undefined;

  const [search, setSearch] = useState("");
  const [tag, setTag] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [periodeFilter, setPeriodeFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  // "Tandai" = state UI lokal (baris sudah disisir), sengaja tidak dipersist
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());
  const [noteRow, setNoteRow] = useState<DonaturMonitoring | null>(null);

  const { data: stats, isLoading: statsLoading } = useDonaturStats();
  const { data: periodeData } = usePeriodeOptions();
  const { data: templateData } = usePesanTemplates();

  const { data, isLoading } = useMonitoringList({
    page,
    limit,
    periode_id: periodeFilter === ALL ? globalPeriode : periodeFilter,
    tag: tag === ALL ? undefined : tag,
    search: search || undefined,
  });

  const periodes = periodeData?.items ?? [];
  const periodeAktif = periodes.filter((p) => p.status === "aktif");
  const templates = templateData?.items ?? [];

  // Dua tombol kirim dipilih lewat konteks template; kalau konvensi itu belum
  // dipakai, jatuh ke template donatur aktif mana pun supaya tombol tetap jalan
  const fallbackTemplate = templates.find(
    (t) => t.aktif && (t.konteks === "donatur" || t.konteks === "")
  );
  const templateByKonteks = (konteks: string) =>
    templates.find((t) => t.aktif && t.konteks === konteks) ?? fallbackTemplate;
  const tpl7 = templateByKonteks(WA_KONTEKS.tgl7);
  const tpl25 = templateByKonteks(WA_KONTEKS.tgl25);
  const targets = kirimTargets();

  const rawItems = data?.items ?? [];
  const items =
    status === ALL
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
  const win = useColumnWindow(monthKeys.length, MONTH_WINDOW);
  const visibleMonths = win.slice(monthKeys);

  const toggleReviewed = (id: number) =>
    setReviewed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Tandai · Nama · Tgl 7 · Tgl 25 · Periode Terakhir · [bulan…] · Total · Catatan
  const colCount = 7 + visibleMonths.length + (win.showArrows ? 2 : 0);
  const belumPeriodeIni =
    stats ? Math.max(0, stats.total - stats.aktif_periode) : undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoring Donatur</h1>
          <p className="text-muted-foreground">
            Matriks keikutsertaan patungan + link pesan WhatsApp siap kirim
          </p>
        </div>
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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Donatur" value={String(stats?.total ?? "—")} loading={statsLoading} />
        <StatCard
          icon={CheckCircle2}
          label="Aktif Periode Ini"
          value={String(stats?.aktif_periode ?? "—")}
          loading={statsLoading}
        />
        <StatCard
          icon={Clock}
          label="Belum Periode Ini"
          value={String(belumPeriodeIni ?? "—")}
          loading={statsLoading}
        />
        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                <CalendarCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Periode Aktif</div>
                <div className="text-sm font-semibold truncate">
                  {periodeAktif.length ? periodeAktif.map((p) => p.nama).join(", ") : "—"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info cara pakai link WA */}
      <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p>
          <strong className="text-emerald-700 dark:text-emerald-400">Cara pakai link WA:</strong>{" "}
          Klik tombol <strong>Tgl 25</strong> untuk reminder awal bulan, atau <strong>Tgl 7</strong>{" "}
          untuk follow-up. Link akan membuka WhatsApp dengan pesan yang sudah terisi otomatis sesuai
          nama donatur dan bulan berjalan.
          {/* Sejak FEpromt24, kolom bulan muncul juga tanpa filter periode — diambil
              dari bulan yang ada donasinya. Jadi kolom kosong hanya berarti belum
              ada cash_in ber-donatur sama sekali, bukan "belum pilih periode". */}
          {monthKeys.length === 0 &&
            " Kolom donasi per bulan belum ada karena belum ada mutasi cash_in yang terhubung ke donatur."}
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama atau kode…"
            className="pl-9 w-64"
          />
        </div>
        <Select value={periodeFilter} onValueChange={(v: string) => { setPeriodeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Periode</SelectItem>
            {periodes.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <SelectTrigger className="w-44">
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
      {win.showArrows && (
        <div className="flex justify-end text-xs text-muted-foreground">
          Bulan {win.offset + 1}–{win.offset + visibleMonths.length} dari {monthKeys.length}
          {periodeFilter === ALL && !globalPeriode
            ? " (hanya bulan yang ada donasinya, lintas periode)"
            : ""}{" "}
          — geser dengan panah di kepala tabel
        </div>
      )}
      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">
                <div className="flex flex-col items-start gap-1">
                  <span>Tandai</span>
                  <button
                    type="button"
                    onClick={() => setReviewed(new Set())}
                    disabled={reviewed.size === 0}
                    title="Bersihkan semua tanda (lokal)"
                    className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-normal transition-colors hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    Reset
                  </button>
                </div>
              </TableHead>
              <TableHead className="min-w-56">Nama &amp; Tag</TableHead>
              <TableHead className="w-24 bg-orange-500/10">
                <div className="flex flex-col">
                  <span className="whitespace-nowrap">📱 Tgl 7</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {targets.tgl7}
                  </span>
                </div>
              </TableHead>
              <TableHead className="w-24 bg-emerald-500/10">
                <div className="flex flex-col">
                  <span className="whitespace-nowrap">📱 Tgl 25</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {targets.tgl25}
                  </span>
                </div>
              </TableHead>
              <TableHead className="w-40">Periode Terakhir</TableHead>
              {win.showArrows && (
                <TableHead className="w-8 px-0 text-center">
                  <button
                    type="button"
                    onClick={win.prev}
                    disabled={!win.canPrev}
                    title="Bulan sebelumnya"
                    aria-label="Geser ke bulan sebelumnya"
                    className="rounded p-1 transition-colors hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </TableHead>
              )}
              {visibleMonths.map((m) => (
                <TableHead key={m} className="w-20 text-center">
                  {monthLabel(m)}
                </TableHead>
              ))}
              {win.showArrows && (
                <TableHead className="w-8 px-0 text-center">
                  <button
                    type="button"
                    onClick={win.next}
                    disabled={!win.canNext}
                    title="Bulan berikutnya"
                    aria-label="Geser ke bulan berikutnya"
                    className="rounded p-1 transition-colors hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </TableHead>
              )}
              <TableHead className="w-28 text-right">Total</TableHead>
              <TableHead className="w-20 text-center">Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={colCount}>
                    <Skeleton className="h-6 w-full" />
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
                const tags = r.tags ?? [];
                return (
                  <TableRow
                    key={r.id}
                    className={cn(rowColorClass(r.warna, tags), done && "opacity-40")}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggleReviewed(r.id)}
                        title="Tandai baris sudah disisir (lokal, tidak disimpan)"
                        className="h-4 w-4 cursor-pointer accent-primary"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.nama}</div>
                      <div className="font-mono text-xs text-primary">{r.kode || "—"}</div>
                      <div className="text-xs text-muted-foreground">{skemaLabel(r.skema)}</div>
                      {tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {tags.map((t) => {
                            const m = tagMeta(t);
                            return m ? (
                              <span
                                key={t}
                                className="inline-flex items-center gap-1 rounded-full border bg-muted/60 px-1.5 py-0.5 text-[10px]"
                              >
                                {m.icon} {m.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="bg-orange-500/5">
                      <KirimButton row={r} template={tpl7} tone="tgl7" />
                    </TableCell>
                    <TableCell className="bg-emerald-500/5">
                      <KirimButton row={r} template={tpl25} tone="tgl25" />
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.periode_akhir ? (
                        <span className="inline-flex items-center gap-1 text-primary">
                          {r.periode_akhir}
                          {r.periode_akhir_aktif && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" title="Aktif" />
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {win.showArrows && <TableCell className="px-0" />}
                    {visibleMonths.map((m) => {
                      const n = bulananByKey.get(m) ?? 0;
                      return (
                        <TableCell
                          key={m}
                          title={n ? `Rp ${fmt(n)}` : undefined}
                          className={cn(
                            "text-center text-sm",
                            n > 0
                              ? "bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-400"
                              : "text-muted-foreground"
                          )}
                        >
                          {n ? singkatNominal(n) : "—"}
                        </TableCell>
                      );
                    })}
                    {win.showArrows && <TableCell className="px-0" />}
                    <TableCell
                      className="text-right text-sm font-semibold whitespace-nowrap"
                      title={r.total ? `Rp ${fmt(r.total)}` : undefined}
                    >
                      {r.total ? (
                        `Rp ${singkatNominal(r.total)}`
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => setNoteRow(r)}
                        title={r.catatan || "Catatan & tag"}
                        className={cn(
                          "rounded-lg p-1.5 transition-colors hover:bg-accent",
                          r.catatan ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <MessageSquareText className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>
              Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, totalItems)} dari {totalItems}
            </span>
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

      {noteRow && <CatatanTagDialog row={noteRow} onClose={() => setNoteRow(null)} />}
    </div>
  );
}
