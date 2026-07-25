import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
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
  cn,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        ✅ {t.nilai}/{t.nilai_maks}
      </span>
    );
  }
  if (t.hasil_status === "submitted") {
    return t.terlambat ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        ⏰ terlambat
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
        📤 terkumpul
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      ⏳ belum
    </span>
  );
}

function NotifikasiPanel({ reminders }: { reminders: string[] }) {
  const { data, isLoading } = useNotifikasi(true);
  const markRead = useMarkNotifikasiRead();
  const items = data?.items ?? [];

  if (isLoading) return <div className="h-20 animate-pulse rounded-xl bg-muted" />;
  if (items.length === 0 && reminders.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-1.5">
        <BellRing className="h-4 w-4 text-primary" />
        Notifikasi
      </h3>
      <ul className="space-y-1.5">
        {/* Reminder dari dashboard — string bebas backend, render apa adanya */}
        {reminders.map((r) => (
          <li key={r} className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
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
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
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
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          👋 {greeting()}, {firstName || "Beswan"}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Hari ini adalah kesempatan baru untuk bertumbuh. Semangat!
        </p>
      </div>

      <NotifikasiPanel reminders={dashboard?.reminders ?? []} />

      {/* ═══ Progress Saya ═══ */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Progress Saya</h2>
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
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        ) : !rapor ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Kamu belum terdaftar di periode manapun — hubungi tim GBB.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={BarChart3} label="Kehadiran" value={`${Math.round(rapor.kehadiran_persen)}%`} />
              <StatCard icon={PencilLine} label="Avg Nilai" value={String(Math.round(rapor.tugas_avg_nilai * 10) / 10)} />
              <StatCard icon={NotebookPen} label="Refleksi" value={`${rapor.refleksi_submitted}/${rapor.refleksi_total}`} />
              <StatCard icon={GraduationCap} label="IPK" value={ipkTerbaru != null ? ipkTerbaru.toFixed(2) : "—"} />
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <ChartTrenBulanan data={rapor.chart_bulanan ?? []} />
              <ChartIPKSemester data={chartIpk} />
            </div>
          </>
        )}
      </section>

      {/* ═══ My Events ═══ */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My Events</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada event di periode ini.</p>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {events.map((ev) => (
              <div key={ev.event_id} className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
                <div className="flex items-start gap-2">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <Mic className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate" title={ev.nama_event}>
                      {ev.nama_event}
                    </div>
                    <div className="text-xs text-muted-foreground">{formatTanggal(ev.tanggal)}</div>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    ev.hadir ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {ev.hadir ? "✅ Hadir" : "✗ Tidak hadir"}
                </span>
                {/* Tombol hanya muncul bila link tersedia (tidak semua event ada rekaman) */}
                {(ev.youtube_url || ev.slide_url) && (
                  <div className="flex gap-2">
                    {ev.youtube_url && (
                      <a
                        href={ev.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                      >
                        <Youtube className="h-3.5 w-3.5" /> Video
                      </a>
                    )}
                    {ev.slide_url && (
                      <a
                        href={assetUrl(ev.slide_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                      >
                        <FileDown className="h-3.5 w-3.5" /> Slide
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ My Tasks ═══ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">My Tasks</h2>
          <span className="text-xs text-muted-foreground">
            {tasks ? `${tasks.items.length} dari ${tasks.totalItems} tugas` : ""}
          </span>
        </div>
        <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
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
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                    Belum ada tugas
                  </TableCell>
                </TableRow>
              ) : (
                (tasks?.items ?? []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.judul}</div>
                      <div className="text-xs text-muted-foreground font-mono">{t.kode_penugasan}</div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatDeadline(t.deadline)}</TableCell>
                    <TableCell>
                      <TaskStatusBadge t={t} />
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Detail & submit (wireframe 1a) menyusul di tahap Penugasan */}
                      <Button variant="outline" size="sm" disabled title="Detail & submit tugas menyusul">
                        Buka
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          ⏳ belum · 📤 terkumpul · ⏰ terlambat · ✅ dinilai — detail &amp; submit tugas menyusul
          di tahap berikutnya.
        </p>
      </section>

      {/* ═══ Prestasiku ═══ */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Prestasiku
        </h2>
        <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
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
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
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
