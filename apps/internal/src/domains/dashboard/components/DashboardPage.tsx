import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  HandHeart,
  Handshake,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { Button } from "@/shared/components/ui/button";
import { Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from "@gbb/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  DASHBOARD_KEY,
  useDashboardAnalitik,
  useDashboardEvent,
  useDashboardGrowth,
  useDashboardTrendDonatur,
} from "../hooks/useDashboard";
import { StatCard } from "@/shared/components/StatCard";
import {
  CHART_NEUTRAL,
  CHART_SERIES,
  ChartBarDuaSeri,
  ChartBarKategori,
  ChartBarSeri,
  ChartDonut,
  ChartLinePersen,
} from "./DashboardCharts";

const TABS = [
  { key: "event", label: "Event" },
  { key: "analitik", label: "Analitik Beswan" },
  { key: "trend-donatur", label: "Trend Donatur" },
  { key: "growth", label: "Growth" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const formatRupiah = (v?: number) =>
  v == null
    ? "—"
    : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(v);

const formatPercent = (v?: number) => (v == null ? "—" : `${Math.round(v * 10) / 10}%`);

const formatIPK = (v?: number) => (v == null ? "—" : v.toFixed(2));

const formatCount = (v?: number) => (v == null ? "—" : String(v));

function EventTab({ periodeId }: { periodeId?: string }) {
  const { data, isLoading } = useDashboardEvent(periodeId);
  const kehadiran = data?.kehadiran;
  const penugasan = data?.penugasan;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Total Event" value={formatCount(data?.total_event)} loading={isLoading} />
        <StatCard icon={CheckCircle2} label="Event Selesai" value={formatCount(data?.event_selesai)} loading={isLoading} />
        <StatCard icon={Users} label="Beswan Aktif" value={formatCount(data?.beswan_aktif)} loading={isLoading} />
        <StatCard icon={Wallet} label="Donasi Bulan Ini" value={formatRupiah(data?.donasi_bulan_ini)} loading={isLoading} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartBarSeri
          className="lg:col-span-2"
          title="Event per Bulan"
          rows={data?.event_per_bulan ?? []}
          name="Event"
          loading={isLoading}
        />
        <ChartDonut
          title="Kehadiran Beswan"
          loading={isLoading}
          centerText={kehadiran ? formatPercent(kehadiran.persen_hadir) : undefined}
          centerSub="hadir"
          slices={
            kehadiran
              ? [
                  { label: "Hadir", value: kehadiran.hadir, color: CHART_SERIES[0] },
                  { label: "Tidak Hadir", value: kehadiran.tidak_hadir, color: CHART_NEUTRAL },
                ]
              : []
          }
        />
        {/* pending = ekspektasi pengumpulan (penugasan x beswan) yang belum masuk */}
        <ChartBarSeri
          title="Penugasan Overview"
          name="Pengumpulan"
          loading={isLoading}
          rows={
            penugasan
              ? [
                  { label: "Terkumpul", jumlah: penugasan.submitted },
                  { label: "Dinilai", jumlah: penugasan.graded },
                  { label: "Belum Masuk", jumlah: penugasan.pending },
                ]
              : []
          }
        />
      </div>
    </div>
  );
}

function AnalitikTab({ periodeId }: { periodeId?: string }) {
  const { data, isLoading } = useDashboardAnalitik(periodeId);
  const progress = data?.progress_beswan ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Beswan Aktif" value={formatCount(data?.beswan_aktif)} loading={isLoading} />
        <StatCard icon={BarChart3} label="Avg Kehadiran" value={formatPercent(data?.avg_kehadiran)} loading={isLoading} />
        <StatCard icon={GraduationCap} label="Avg IPK" value={formatIPK(data?.avg_ipk)} loading={isLoading} />
        <StatCard icon={ClipboardList} label="Refleksi On-time" value={formatPercent(data?.refleksi_ontime)} loading={isLoading} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartLinePersen
          title="Tren Kehadiran /bulan"
          rows={data?.tren_kehadiran ?? []}
          name="Kehadiran"
          loading={isLoading}
        />
        <ChartBarDuaSeri
          title="Refleksi Completion /bulan"
          rows={(data?.refleksi_per_bulan ?? []).map((d) => ({
            label: d.label,
            a: d.selesai,
            b: d.total,
          }))}
          labelA="Selesai"
          labelB="Total"
          loading={isLoading}
        />
        {/* 4 bucket tetap dari BE — urutan dipertahankan, jangan sort */}
        <ChartBarSeri
          title="Distribusi IPK"
          rows={(data?.distribusi_ipk ?? []).map((d) => ({ label: d.label, jumlah: d.jumlah }))}
          name="Beswan"
          loading={isLoading}
        />
        <ChartBarSeri
          title="Rata-rata Nilai Tugas /batch"
          rows={(data?.nilai_tugas_per_batch ?? []).map((d) => ({
            label: d.batch,
            jumlah: Math.round(d.avg_nilai * 10) / 10,
          }))}
          name="Avg Nilai"
          yMax={100}
          loading={isLoading}
        />
      </div>

      {/* Tabel per-beswan — sekaligus table view (relief aksesibilitas chart) */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Progress per Beswan</h2>
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="w-24 text-right">Hadir</TableHead>
                <TableHead className="w-28 text-right">Avg Nilai</TableHead>
                <TableHead className="w-24 text-right">Refleksi</TableHead>
                <TableHead className="w-20 text-right">IPK</TableHead>
                <TableHead className="w-24 text-right">Prestasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : progress.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                    Belum ada beswan di periode ini
                  </TableCell>
                </TableRow>
              ) : (
                progress.map((b) => (
                  <TableRow key={b.beswan_id}>
                    <TableCell className="font-medium text-sm">{b.nama}</TableCell>
                    <TableCell className="text-right text-sm">{formatPercent(b.hadir_persen)}</TableCell>
                    <TableCell className="text-right text-sm">
                      {Math.round(b.avg_nilai_tugas * 10) / 10}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {b.refleksi_selesai}/{b.refleksi_total}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatIPK(b.ipk)}</TableCell>
                    <TableCell className="text-right text-sm">{b.prestasi}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function TrendDonaturTab() {
  const { data, isLoading } = useDashboardTrendDonatur();
  // Chart jenis_beasiswa/kriteria/pekerjaan/saluran_info/alumni/faktor_ragu
  // dihapus permanen — form donatur tidak pernah mengumpulkan data itu (FEpromt18).
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Est. Komitmen Donasi"
          value={formatRupiah(data?.total_estimasi_komitmen)}
          loading={isLoading}
        />
        <StatCard
          icon={HandHeart}
          label="Calon Donatur"
          value={formatCount(data?.total_calon_donatur)}
          loading={isLoading}
        />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartBarSeri
          title="Tren Pendaftaran Calon Donatur"
          rows={data?.tren_pendaftaran ?? []}
          name="Pendaftar"
          loading={isLoading}
        />
        <ChartDonut
          title="Skema Donasi Dipilih"
          slices={(data?.skema_donasi ?? []).map((s) => ({ label: s.label, value: s.jumlah }))}
          loading={isLoading}
        />
      </div>
    </div>
  );
}

function GrowthTab() {
  const { data, isLoading } = useDashboardGrowth();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Data peserta eksternal event GROWTH — analitik minat kontribusi &amp; demografi.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Peserta" value={formatCount(data?.total_pendaftar)} loading={isLoading} />
        <StatCard icon={Handshake} label="Berminat Kontribusi" value={formatCount(data?.minat_kontribusi)} loading={isLoading} />
        <StatCard icon={GraduationCap} label="Calon Mentor" value={formatCount(data?.calon_mentor)} loading={isLoading} />
        <StatCard icon={HandHeart} label="Calon Donatur" value={formatCount(data?.calon_donatur)} loading={isLoading} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartBarKategori title="Distribusi Profesi" data={data?.distribusi_profesi ?? []} loading={isLoading} />
        <ChartBarKategori title="Minat Kontribusi ke GBB" data={data?.minat_kontribusi_chart ?? []} loading={isLoading} />
        <ChartBarKategori title="Tren Tema Diminati" data={data?.tren_tema ?? []} loading={isLoading} />
        <ChartBarKategori title="Bidang Keahlian Ditawarkan" data={data?.bidang_keahlian ?? []} loading={isLoading} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <ChartBarKategori title="Universitas Asal" data={data?.universitas_asal ?? []} maxItems={6} loading={isLoading} />
        <ChartBarKategori title="Saluran Info" data={data?.saluran_info ?? []} maxItems={6} loading={isLoading} />
        <ChartBarKategori title="Pengenalan GBB" data={data?.pengenalan_gbb ?? []} maxItems={6} loading={isLoading} />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [tab, setTab] = useState<TabKey>("event");
  const queryClient = useQueryClient();

  // Tab Event & Analitik mengikuti filter periode global di sidebar
  const periodeId = usePeriodeFilter((s) => s.periodeId) ?? undefined;

  // Key sub-query = key tab (event | analitik | trend-donatur | growth)
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [DASHBOARD_KEY, tab] });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="size-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v: string) => setTab(v as TabKey)} className="space-y-4">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="event" className="space-y-4">
          <EventTab periodeId={periodeId} />
        </TabsContent>
        <TabsContent value="analitik" className="space-y-4">
          <AnalitikTab periodeId={periodeId} />
        </TabsContent>
        <TabsContent value="trend-donatur" className="space-y-4">
          <TrendDonaturTab />
        </TabsContent>
        <TabsContent value="growth" className="space-y-4">
          <GrowthTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
