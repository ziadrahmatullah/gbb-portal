import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ChangeEvent } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, FileDown, Search, Users } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@gbb/ui";
import { useBeswanDetail } from "../hooks/useBeswan";
import type { BeswanDetail, Rapor } from "../services";
import { ChartIPK, ChartKehadiranNilai } from "./RaporCharts";

// Halaman detail beswan untuk donatur — layout mengikuti BeswanDetailPage
// portal internal, minus tab Tugas & Refleksi (endpoint-nya internal-only)
// dan tanpa aksi edit.
const TABS = ["Rapor", "Absensi"] as const;
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

function RaporSummary({ rapor }: { rapor: Rapor }) {
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

function AbsensiTab({ rapor }: { rapor?: Rapor | null }) {
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
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Belum ada data absensi untuk periode ini.
      </p>
    );
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

function ProfileCard({ detail }: { detail: BeswanDetail }) {
  return (
    <Card className="py-4">
      <CardContent className="px-4 flex flex-wrap items-start gap-4">
        <Avatar className="h-16 w-16">
          {detail.foto_url && <AvatarImage src={detail.foto_url} alt={detail.nama_lengkap} />}
          <AvatarFallback>
            <Users className="size-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-48 space-y-1">
          <h2 className="text-lg font-semibold">{detail.nama_lengkap}</h2>
          <div className="text-sm text-muted-foreground">
            NIM: <span className="font-mono">{detail.nim}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {detail.email} · {detail.hp}
          </div>
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
          {detail.cv_url && (
            <a
              href={detail.cv_url}
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

  const { data: detail, isLoading } = useBeswanDetail(
    beswanId,
    periodeId ? Number(periodeId) : undefined
  );

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
          to="/data-beswan"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <h1 className="text-xl font-bold tracking-tight">{detail.nama_lengkap}</h1>
      </div>

      <ProfileCard detail={detail} />

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
        {detail.periodes.length > 0 && (
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
            <p className="text-sm text-muted-foreground py-4 text-center">
              Belum ada rapor untuk periode ini.
            </p>
          )}
          <div className="grid lg:grid-cols-2 gap-4">
            <ChartKehadiranNilai data={detail.rapor?.chart_bulanan ?? []} />
            <ChartIPK data={detail.chart_ipk} />
          </div>
        </TabsContent>
        <TabsContent value="Absensi">
          <AbsensiTab rapor={detail.rapor} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
