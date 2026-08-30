import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CalendarX2,
  Check,
  FileDown,
  GraduationCap,
  Mic,
  NotebookPen,
  PencilLine,
  Trophy,
  Youtube,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
} from "@gbb/ui";
import { StatCard } from "@/shared/components/StatCard";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import {
  useMarkNotifikasiRead,
  useMyDashboard,
  useMyPenugasan,
  useNotifikasi,
  usePrestasi,
} from "../hooks/useBeranda";
import { assetUrl, PRESTASI_KATEGORI } from "../services";
import type { MyPenugasan } from "../services";
import { ChartIPKSemester, ChartTrenBulanan } from "./BerandaCharts";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
};

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

// Status hasil tugas per wireframe: ⏳ belum · 📤 terkumpul · ⏰ terlambat · ✅ dinilai
function TaskStatusBadge({ t }: { t: MyPenugasan }) {
  if (t.hasil_status === "graded") {
    return (
      <Badge variant="outline" className="text-primary">
        ✅ {t.nilai}/{t.nilai_maks}
      </Badge>
    );
  }
  if (t.hasil_status === "submitted") {
    return t.terlambat ? (
      <Badge variant="outline" className="text-destructive">⏰ terlambat</Badge>
    ) : (
      <Badge variant="outline" className="text-yellow-700 dark:text-yellow-400">📤 terkumpul</Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">⏳ belum</Badge>
  );
}

function NotifikasiPanel({ reminders }: { reminders: string[] }) {
  const { data, isLoading } = useNotifikasi(true);
  const markRead = useMarkNotifikasiRead();
  const items = data?.items ?? [];

  if (isLoading) return <Skeleton className="h-20 w-full rounded-xl" />;
  if (items.length === 0 && reminders.length === 0) return null;

  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <BellRing className="size-4 text-primary" />
          Notifikasi
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <ul className="space-y-1.5">
          {/* Reminder dari dashboard — string bebas backend, render apa adanya */}
          {reminders.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {r}
            </li>
          ))}
          {items.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-2 text-sm">
              <span className="flex-1">• {n.pesan}</span>
              <button
                title="Tandai dibaca"
                onClick={() => markRead.mutate(n.id)}
                disabled={markRead.isPending}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
              >
                <Check className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function BerandaPage() {
  const profile = useAuthStore((s) => s.profile);
  const [periodeId, setPeriodeId] = useState<string | undefined>(undefined);

  const { data: dashboard, isLoading } = useMyDashboard(periodeId);
  const { data: tasks } = useMyPenugasan({ limit: 5 });
  const { data: prestasi } = usePrestasi({ limit: 5 });

  const rapor = dashboard?.rapor ?? null;
  const chartIpk = dashboard?.chart_ipk ?? [];
  const ipkTerbaru = chartIpk.length ? chartIpk[chartIpk.length - 1].ipk : null;
  const periodes = dashboard?.periodes ?? [];
  const selectedPeriode = periodeId ?? (rapor ? String(rapor.periode_id) : "");
  // My Events: tampilkan yang terbaru dulu
  const events = [...(rapor?.absensi ?? [])]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, 6);

  const firstName = (profile?.nama_lengkap ?? dashboard?.nama_lengkap ?? "").split(" ")[0];

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">
          👋 {greeting()}, {firstName || "Beswan"}!
        </h1>
        <p className="text-muted-foreground">
          Hari ini adalah kesempatan baru untuk bertumbuh. Semangat!
        </p>
      </div>

      <NotifikasiPanel reminders={dashboard?.reminders ?? []} />

      {/* ═══ Progress Saya ═══ */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Progress Saya</h2>
          {periodes.length > 1 && (
            <Select value={selectedPeriode} onValueChange={(v: string) => setPeriodeId(v)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                {periodes.map((p) => (
                  <SelectItem key={p.periode_id} value={String(p.periode_id)}>
                    {p.periode_nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : !rapor ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <GraduationCap className="size-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                Kamu belum terdaftar di periode manapun — hubungi tim GBB.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon={BarChart3} label="Kehadiran" value={`${Math.round(rapor.kehadiran_persen)}%`} />
              <StatCard icon={PencilLine} label="Avg Nilai" value={String(Math.round(rapor.tugas_avg_nilai * 10) / 10)} />
              <StatCard icon={NotebookPen} label="Refleksi" value={`${rapor.refleksi_submitted}/${rapor.refleksi_total}`} />
              <StatCard icon={GraduationCap} label="IPK" value={ipkTerbaru != null ? ipkTerbaru.toFixed(2) : "—"} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartTrenBulanan data={rapor.chart_bulanan ?? []} />
              <ChartIPKSemester data={chartIpk} />
            </div>
          </>
        )}
      </section>

      {/* ═══ My Events ═══ */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">My Events</h2>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <CalendarX2 className="size-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">Belum ada event di periode ini.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((ev) => (
              <Card key={ev.event_id} className="gap-2 py-4">
                <CardContent className="space-y-2 px-4">
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 rounded-lg bg-primary/10 p-2">
                      <Mic className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium" title={ev.nama_event}>
                        {ev.nama_event}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatTanggal(ev.tanggal)}</div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={ev.hadir ? "text-primary" : "text-muted-foreground"}
                  >
                    {ev.hadir ? "✅ Hadir" : "✗ Tidak hadir"}
                  </Badge>
                  {/* Tombol hanya muncul bila link tersedia (tidak semua event ada rekaman) */}
                  {(ev.youtube_url || ev.slide_url) && (
                    <div className="flex gap-2">
                      {ev.youtube_url && (
                        <a
                          href={ev.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-accent"
                        >
                          <Youtube className="size-3.5" /> Video
                        </a>
                      )}
                      {ev.slide_url && (
                        <a
                          href={assetUrl(ev.slide_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-accent"
                        >
                          <FileDown className="size-3.5" /> Slide
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ═══ My Tasks ═══ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">My Tasks</h2>
          <span className="text-xs text-muted-foreground">
            {tasks ? `${tasks.items.length} dari ${tasks.totalItems} tugas` : ""}
          </span>
        </div>
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead className="w-36">Deadline</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tasks?.items ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    Belum ada tugas
                  </TableCell>
                </TableRow>
              ) : (
                (tasks?.items ?? []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.judul}</div>
                      <div className="font-mono text-xs text-muted-foreground">{t.kode_penugasan}</div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatDeadline(t.deadline)}</TableCell>
                    <TableCell>
                      <TaskStatusBadge t={t} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/panel/penugasan/${t.id}`}>Buka</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          ⏳ belum · 📤 terkumpul · ⏰ terlambat · ✅ dinilai — buka tugas untuk melihat detail
          &amp; mengumpulkan jawaban.
        </p>
      </section>

      {/* ═══ Prestasiku ═══ */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Trophy className="size-5 text-primary" />
          Prestasiku
        </h2>
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead className="w-36">Kategori</TableHead>
                <TableHead className="w-36">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(prestasi?.items ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                    Belum ada prestasi — tambahkan lewat halaman Refleksi nanti.
                  </TableCell>
                </TableRow>
              ) : (
                (prestasi?.items ?? []).map((p) => {
                  const kat = PRESTASI_KATEGORI[p.kategori];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.judul}</TableCell>
                      <TableCell className="text-sm">
                        {kat ? `${kat.icon} ${kat.label}` : p.kategori}
                      </TableCell>
                      <TableCell className="text-sm">{formatTanggal(p.tanggal)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
