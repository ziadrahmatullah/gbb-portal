import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Construction, FileDown, Pencil } from "lucide-react";
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
import { useBeswanDetail, useBeswanRefleksi } from "../hooks/useBeswan";
import { assetUrl } from "../services";
import type { BeswanDetail, BeswanRapor } from "../services";
import { BeswanAvatar, StatusBadge } from "./BeswanListPage";
import { EditBeswanDialog } from "./BeswanFormDialogs";
import { ChartIPK, ChartKehadiranNilai } from "./RaporCharts";

const TABS = ["Rapor", "Absensi", "Tugas", "Refleksi"] as const;
type Tab = (typeof TABS)[number];

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

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
  if (absensi.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data absensi untuk periode ini.</p>;
  }
  return (
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
          {absensi.map((a) => (
            <TableRow key={a.event_id}>
              <TableCell className="font-medium">{a.nama_event}</TableCell>
              <TableCell>{formatTanggal(a.tanggal)}</TableCell>
              <TableCell>
                <span className={cn("text-sm font-medium", a.hadir ? "text-primary" : "text-destructive")}>
                  {a.hadir ? "✓ Hadir" : "✗ Absen"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TugasTab() {
  // Belum ada endpoint daftar tugas per beswan di backend
  // (yang ada: GET /internal/penugasan/:id/hasil — per penugasan, bukan per beswan)
  return (
    <div className="flex min-h-[30vh] items-center justify-center rounded-md border border-dashed">
      <div className="text-center text-sm text-muted-foreground px-4">
        <Construction className="mx-auto mb-2 size-6 opacity-50" />
        Data belum tersedia dari backend — belum ada endpoint daftar tugas per beswan.
      </div>
    </div>
  );
}

function RefleksiTab({ beswanId, active }: { beswanId: number; active: boolean }) {
  const { data, isLoading } = useBeswanRefleksi(beswanId, active);
  const items = data?.items ?? [];
  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Belum ada refleksi.</p>;
  }
  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bulan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Disubmit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">
                {BULAN[r.bulan - 1]} {r.tahun}
              </TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {r.submitted_at ? formatTanggal(r.submitted_at) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
        {(tab === "Rapor" || tab === "Absensi") && detail.periodes.length > 0 && (
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
          <TugasTab />
        </TabsContent>
        <TabsContent value="Refleksi">
          <RefleksiTab beswanId={beswanId} active={tab === "Refleksi"} />
        </TabsContent>
      </Tabs>

      <EditBeswanDialog beswan={editOpen ? detail : null} onClose={() => setEditOpen(false)} />
    </div>
  );
}
