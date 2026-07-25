import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GraduationCap, LayoutDashboard, Mic, PieChart, Users, Wallet } from "lucide-react";
import { StatCard } from "@/shared/components/StatCard";
import { formatRupiah, BULAN_PENDEK } from "@/shared/lib/format";
import { useVizColors } from "@/shared/lib/viz";
import { useDashboardGBB } from "../hooks/useDashboard";

function ChartEventPerBulan({ data }: { data: { bulan: number; tahun: number; total: number }[] }) {
  const c = useVizColors();
  // Backend tidak menjamin urutan kronologis — urutkan di FE sebelum di-chart
  const rows = [...data]
    .sort((a, b) => a.tahun - b.tahun || a.bulan - b.bulan)
    .map((d) => ({
      label: `${BULAN_PENDEK[d.bulan - 1]} ${String(d.tahun).slice(2)}`,
      total: d.total,
    }));

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-3">Event per Bulan</h3>
      {rows.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
          Belum ada data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: c.text, fontSize: 11 }} tickLine={false} axisLine={{ stroke: c.grid }} />
            <YAxis allowDecimals={false} tick={{ fill: c.text, fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              cursor={{ fill: c.grid, opacity: 0.4 }}
              contentStyle={{ background: c.surface, border: `1px solid ${c.grid}`, borderRadius: 8, fontSize: 12, color: c.text }}
            />
            <Bar dataKey="total" name="Event" fill={c.series1} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function DashboardGBBPage() {
  const { data, isLoading } = useDashboardGBB();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <LayoutDashboard className="h-6 w-6 text-primary" />
        Dashboard GBB
      </h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Kondisi Keuangan</h2>
        {isLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
        ) : (
          <div className="rounded-xl border bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900 p-4 text-sm text-amber-900 dark:text-amber-200">
            💰 {data?.narasi}
          </div>
        )}
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard icon={Wallet} label="Total Dana Terkumpul" value={data ? formatRupiah(data.total_dana) : "—"} loading={isLoading} />
          <StatCard icon={Users} label="Donatur Aktif" value={String(data?.donatur_aktif ?? "—")} loading={isLoading} />
          <StatCard icon={PieChart} label="Ke Beasiswa" value={data ? `${data.persen_beasiswa}%` : "—"} loading={isLoading} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Beswan Overview</h2>
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
          <StatCard icon={GraduationCap} label="Beswan Aktif" value={String(data?.beswan_aktif ?? "—")} loading={isLoading} />
          <StatCard icon={PieChart} label="Avg Kehadiran" value={data ? `${Math.round(data.avg_kehadiran * 10) / 10}%` : "—"} loading={isLoading} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Event Overview</h2>
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
          <StatCard icon={Mic} label="Event Terlaksana" value={String(data?.jumlah_event ?? "—")} loading={isLoading} />
          <StatCard icon={LayoutDashboard} label="Topik Dibahas" value={String(data?.jumlah_topik ?? "—")} loading={isLoading} />
        </div>
        {isLoading ? (
          <div className="h-56 animate-pulse rounded-xl bg-muted" />
        ) : (
          <ChartEventPerBulan data={data?.event_per_bulan ?? []} />
        )}
      </section>
    </div>
  );
}
