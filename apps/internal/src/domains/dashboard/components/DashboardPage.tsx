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
import { Card, Tabs, TabsContent, TabsList, TabsTrigger } from "@gbb/ui";
import {
  DASHBOARD_KEY,
  useDashboardAnalitik,
  useDashboardEvent,
  useDashboardGrowth,
} from "../hooks/useDashboard";
import { StatCard } from "@/shared/components/StatCard";
import { EmptyChartCard } from "./EmptyChartCard";

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
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Total Event" value={formatCount(data?.total_event)} loading={isLoading} />
        <StatCard icon={CheckCircle2} label="Event Selesai" value={formatCount(data?.event_selesai)} loading={isLoading} />
        <StatCard icon={Users} label="Beswan Aktif" value={formatCount(data?.beswan_aktif)} loading={isLoading} />
        <StatCard icon={Wallet} label="Donasi Bulan Ini" value={formatRupiah(data?.donasi_bulan_ini)} loading={isLoading} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <EmptyChartCard title="Event per Bulan" />
        <EmptyChartCard title="Kehadiran Beswan" />
        <EmptyChartCard title="Penugasan Overview" />
      </div>
    </div>
  );
}

function AnalitikTab({ periodeId }: { periodeId?: string }) {
  const { data, isLoading } = useDashboardAnalitik(periodeId);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Beswan Aktif" value={formatCount(data?.beswan_aktif)} loading={isLoading} />
        <StatCard icon={BarChart3} label="Avg Kehadiran" value={formatPercent(data?.avg_kehadiran)} loading={isLoading} />
        <StatCard icon={GraduationCap} label="Avg IPK" value={formatIPK(data?.avg_ipk)} loading={isLoading} />
        <StatCard icon={ClipboardList} label="Refleksi On-time" value={formatPercent(data?.refleksi_ontime)} loading={isLoading} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <EmptyChartCard title="Tren Kehadiran /bulan" />
        <EmptyChartCard title="Refleksi Completion /bulan" />
        <EmptyChartCard title="Distribusi IPK" />
        <EmptyChartCard title="Rata-rata Nilai Tugas /batch" />
      </div>
      <EmptyChartCard
        title="Progress per Beswan"
        note="Tabel per-beswan (kehadiran, tugas, refleksi, IPK, prestasi) menunggu endpoint backend"
      />
    </div>
  );
}

function TrendDonaturTab() {
  // Belum ada endpoint backend sama sekali — sumber datanya direncanakan
  // dari Google Sheets pendaftaran donatur.
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Card className="max-w-md p-8 text-center">
        <div>
          <HandHeart className="mx-auto mb-4 size-10 text-muted-foreground/60" />
          <h2 className="text-lg font-semibold">Trend Donatur</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sumber data tab ini adalah Google Sheets pendaftaran donatur dan endpoint
            backend-nya belum tersedia.
          </p>
        </div>
      </Card>
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
        <EmptyChartCard title="Distribusi Profesi" />
        <EmptyChartCard title="Minat Kontribusi ke GBB" />
        <EmptyChartCard title="Tren Tema Diminati" />
        <EmptyChartCard title="Bidang Keahlian Ditawarkan" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <EmptyChartCard title="Universitas Asal" />
        <EmptyChartCard title="Saluran Info" />
        <EmptyChartCard title="Pengenalan GBB" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [tab, setTab] = useState<TabKey>("event");
  const queryClient = useQueryClient();

  // Tab Event & Analitik mengikuti filter periode global di sidebar
  const periodeId = usePeriodeFilter((s) => s.periodeId) ?? undefined;
  const canRefresh = tab !== "trend-donatur";

  const handleRefresh = () => {
    const sub = tab === "event" ? "event" : tab === "analitik" ? "analitik" : "growth";
    queryClient.invalidateQueries({ queryKey: [DASHBOARD_KEY, sub] });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={!canRefresh}>
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
