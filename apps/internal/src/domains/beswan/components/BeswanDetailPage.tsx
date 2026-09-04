import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ChangeEvent, MouseEvent } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, FileDown, Pencil, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Badge,
  Card,
  CardContent,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@gbb/ui";
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
import { RefleksiTable } from "@/domains/refleksi";
import { useBeswanDetail, useBeswanPenugasan } from "../hooks/useBeswan";
import { assetUrl } from "../services";
import type { BeswanDetail, BeswanPenugasanItem, BeswanRapor } from "../services";
import { BeswanAvatar } from "./BeswanListPage";
import { EditBeswanDialog } from "./BeswanFormDialogs";
import { ChartIPK, ChartKehadiranNilai } from "./RaporCharts";

const TABS = ["Rapor", "Absensi", "Tugas", "Refleksi"] as const;
type Tab = (typeof TABS)[number];


const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "2-digit" });

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function RaporSummary({ rapor }: { rapor: BeswanRapor }) {
  const rows = [
    {
      label: "Kehadiran",
      detail: `${rapor.kehadiran_hadir}/${rapor.kehadiran_total} event (${Math.round(rapor.kehadiran_persen)}%)`,
      persen: rapor.kehadiran_persen,
    },
    {
      label: "Tugas",
      detail: `${rapor.tugas_submitted}/${rapor.tugas_total} submitted, avg nilai ${Math.round(rapor.tugas_avg_nilai * 10) / 10}`,
      persen: rapor.tugas_total ? (rapor.tugas_submitted / rapor.tugas_total) * 100 : 0,
    },
    {
      label: "Refleksi",
      detail: `${rapor.refleksi_submitted}/${rapor.refleksi_total} bulan submitted`,
      persen: rapor.refleksi_total ? (rapor.refleksi_submitted / rapor.refleksi_total) * 100 : 0,
    },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {rows.map((r) => (
        <Card key={r.label} className="gap-2 py-4">
          <CardContent className="px-4 space-y-2">
            <div className="text-xs text-muted-foreground">{r.label}</div>
            <div className="text-sm font-medium">{r.detail}</div>
            <ProgressBar value={r.persen} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AbsensiTab({ rapor }: { rapor?: BeswanRapor | null }) {
  const absensi = rapor?.absensi ?? [];
  // Data absensi sudah ter-load penuh dari rapor — search + pagination
  // cukup client-side
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Ringkasan dihitung dari SELURUH daftar, bukan hasil saringan
  const hadirCount = absensi.filter((a) => a.hadir).length;
  const absenCount = absensi.length - hadirCount;

  const filtered = search
    ? absensi.filter((a) => a.nama_event.toLowerCase().includes(search.toLowerCase()))
    : absensi;
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * limit, safePage * limit);

  if (absensi.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data absensi untuk periode ini.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Search + ringkasan hadir/absen */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama event…"
            className="w-64 pl-9"
          />
        </div>
        <div className="ms-auto flex flex-wrap items-center gap-1.5 text-sm">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            Hadir {hadirCount}
          </Badge>
          <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
            Absen {absenCount}
          </Badge>
          <span className="text-muted-foreground">dari {absensi.length} event</span>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                  Tidak ada event cocok
                </TableCell>
              </TableRow>
            ) : (
              visible.map((a) => (
                <TableRow key={a.event_id}>
                  <TableCell className="font-medium">{a.nama_event}</TableCell>
                  <TableCell>{formatTanggal(a.tanggal)}</TableCell>
                  <TableCell>
                    <span className={cn("text-sm font-medium", a.hadir ? "text-primary" : "text-destructive")}>
                      {a.hadir ? "✓ Hadir" : "✗ Absen"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>
                Menampilkan {(safePage - 1) * limit + 1}–
                {Math.min(safePage * limit, filtered.length)} dari {filtered.length}
              </span>
              <Select
                value={String(limit)}
                onValueChange={(v: string) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                Hal {safePage} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Badge status pengumpulan MILIK beswan ini (bukan status tugas aktif/selesai)
function TugasHasilBadge({ p }: { p: BeswanPenugasanItem }) {
  if (p.hasil_status === "graded") {
    return (
      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
        Dinilai · {p.nilai}/{p.nilai_maks}
      </Badge>
    );
  }
  const terlambatBadge = (
    <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
      Terlambat
    </Badge>
  );
  if (p.hasil_status === "submitted") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <Badge
          variant="outline"
          className="border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400"
        >
          Terkumpul
        </Badge>
        {p.terlambat && terlambatBadge}
      </span>
    );
  }
  const lewatDeadline = new Date(p.deadline).getTime() < Date.now();
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
        Belum
      </Badge>
      {lewatDeadline && terlambatBadge}
    </span>
  );
}

function TugasTab({ beswanId, periodeId }: { beswanId: number; periodeId?: string }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  // Endpoint ini tidak punya param search — ambil sekali (limit 100, tugas
  // per periode realistis kecil) lalu search + pagination client-side
  const { data, isLoading } = useBeswanPenugasan(beswanId, {
    limit: 100,
    periode_id: periodeId || undefined,
  });

  const all = data?.items ?? [];
  const filtered = search
    ? all.filter((p) =>
        `${p.judul} ${p.kode_penugasan}`.toLowerCase().includes(search.toLowerCase())
      )
    : all;
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * limit, safePage * limit);

  return (
    <div className="space-y-3">
      {/* Search judul/kode tugas */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari judul/kode tugas…"
          className="pl-9"
        />
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tugas</TableHead>
              <TableHead className="w-40">Deadline</TableHead>
              <TableHead className="w-40">Status</TableHead>
              <TableHead className="w-24">File</TableHead>
              <TableHead>Feedback</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  {search ? "Tidak ada tugas cocok" : "Tidak ada tugas untuk periode ini"}
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                // Klik baris → detail penugasan internal (hasil semua beswan)
                <TableRow
                  key={p.id}
                  onClick={() => navigate(`/panel/penugasan/${p.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="font-medium">{p.judul}</div>
                    <div className="font-mono text-xs text-muted-foreground">{p.kode_penugasan}</div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDeadline(p.deadline)}</TableCell>
                  <TableCell>
                    <TugasHasilBadge p={p} />
                  </TableCell>
                  <TableCell>
                    {p.file_url ? (
                      <a
                        href={p.file_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e: MouseEvent) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        Jawaban
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="max-w-64 truncate text-sm text-muted-foreground" title={p.feedback ?? undefined}>
                      {p.feedback || "—"}
                    </p>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>
                Menampilkan {(safePage - 1) * limit + 1}–
                {Math.min(safePage * limit, filtered.length)} dari {filtered.length}
              </span>
              <Select
                value={String(limit)}
                onValueChange={(v: string) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                Hal {safePage} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ detail, onEdit }: { detail: BeswanDetail; onEdit: () => void }) {
  const cv = assetUrl(detail.cv_url);
  return (
    <Card className="py-4">
      <CardContent className="px-4 flex flex-wrap items-start gap-4">
        <BeswanAvatar beswan={detail} className="h-16 w-16 text-base" />
        <div className="flex-1 min-w-48 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{detail.nama_lengkap}</h2>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            NIM: <span className="font-mono">{detail.nim}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {detail.email} · {detail.hp}
          </div>
          {(detail.jurusan || detail.semester) && (
            <div className="text-sm text-muted-foreground">
              {detail.jurusan || "Jurusan —"}
              {detail.semester ? ` · Semester ${detail.semester}` : ""}
              {detail.tahun_masuk ? ` (masuk ${detail.tahun_masuk})` : ""}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {detail.periodes.map((p) => (
              <Badge key={p.periode_id} variant="outline" className="gap-1 font-normal">
                {p.periode_nama}
                <span className={cn("capitalize", p.status === "aktif" ? "text-primary" : "text-muted-foreground")}>
                  · {p.status}
                </span>
              </Badge>
            ))}
          </div>
          {cv && (
            <a
              href={cv}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 pt-1 text-sm text-primary hover:underline"
            >
              <FileDown className="h-4 w-4" />
              Download CV
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function BeswanDetailPage() {
  const params = useParams();
  const beswanId = Number(params.id);
  const [tab, setTab] = useState<Tab>("Rapor");
  const [periodeId, setPeriodeId] = useState<string | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);

  const { data: detail, isLoading } = useBeswanDetail(beswanId, periodeId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!detail) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Beswan tidak ditemukan.</p>;
  }

  const raporPeriodeId = periodeId ?? String(detail.rapor?.periode_id ?? "");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/panel/beswan"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <h1 className="text-xl font-bold tracking-tight">{detail.nama_lengkap}</h1>
      </div>

      <ProfileCard detail={detail} onEdit={() => setEditOpen(true)} />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v: string) => setTab(v as Tab)} className="space-y-4">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t} value={t}>
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Pemilih periode untuk Rapor & Absensi (multi-batch) */}
        {(tab === "Rapor" || tab === "Absensi" || tab === "Tugas") && detail.periodes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Periode:</span>
            <Select value={raporPeriodeId} onValueChange={(v: string) => setPeriodeId(v)}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {detail.periodes.map((p) => (
                  <SelectItem key={p.periode_id} value={String(p.periode_id)}>
                    {p.periode_nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <TabsContent value="Rapor" className="space-y-4">
          {detail.rapor ? (
            <RaporSummary rapor={detail.rapor} />
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Belum ada rapor untuk periode ini.</p>
          )}
          <div className="grid lg:grid-cols-2 gap-4">
            <ChartKehadiranNilai data={detail.rapor?.chart_bulanan ?? []} />
            <ChartIPK data={detail.chart_ipk} />
          </div>
        </TabsContent>
        <TabsContent value="Absensi">
          <AbsensiTab rapor={detail.rapor} />
        </TabsContent>
        <TabsContent value="Tugas">
          {/* periode mengikuti selector periode yang sama dengan Rapor/Absensi */}
          <TugasTab beswanId={beswanId} periodeId={raporPeriodeId} />
        </TabsContent>
        <TabsContent value="Refleksi">
          {/* Tabel bersama dari domain refleksi — klik baris membuka detail
              jawaban refleksi */}
          <RefleksiTable beswanId={beswanId} />
        </TabsContent>
      </Tabs>

      <EditBeswanDialog beswan={editOpen ? detail : null} onClose={() => setEditOpen(false)} />
    </div>
  );
}
