import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GraduationCap, LayoutDashboard, Mic, PieChart, Users, Wallet } from "lucide-react";
import { Alert, AlertDescription, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@gbb/ui";
import { StatCard } from "@/shared/components/StatCard";
import { formatRupiah, BULAN_PENDEK } from "@/shared/lib/format";
import { useDashboardGBB } from "../hooks/useDashboard";

function ChartEventPerBulan({ data }: { data: { bulan: number; tahun: number; total: number }[] }) {
  // Backend tidak menjamin urutan kronologis — urutkan di FE sebelum di-chart
  const rows = [...data]
    .sort((a, b) => a.tahun - b.tahun || a.bulan - b.bulan)
    .map((d) => ({
      label: `${BULAN_PENDEK[d.bulan - 1]} ${String(d.tahun).slice(2)}`,
      total: d.total,
    }));

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">Event per Bulan</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        {rows.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border text-xs text-muted-foreground">
            Belum ada data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                cursor={{ fill: "var(--border)", opacity: 0.4 }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                  color: "var(--popover-foreground)",
                }}
              />
              <Bar dataKey="total" name="Event" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardGBBPage() {
  const { data, isLoading } = useDashboardGBB();

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <LayoutDashboard className="size-6 text-primary" />
          Dashboard GBB
        </h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Kondisi Keuangan</h2>
        {isLoading ? (
          <Skeleton className="h-16 rounded-xl" />
        ) : (
          <Alert className="border-primary/30 bg-primary/5">
            <AlertDescription className="text-foreground/80">💰 {data?.narasi}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Wallet} label="Total Dana Terkumpul" value={data ? formatRupiah(data.total_dana) : "—"} loading={isLoading} />
          <StatCard icon={Users} label="Donatur Aktif" value={String(data?.donatur_aktif ?? "—")} loading={isLoading} />
          <StatCard icon={PieChart} label="Ke Beasiswa" value={data ? `${data.persen_beasiswa}%` : "—"} loading={isLoading} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Beswan Overview</h2>
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <StatCard icon={GraduationCap} label="Beswan Aktif" value={String(data?.beswan_aktif ?? "—")} loading={isLoading} />
          <StatCard icon={PieChart} label="Avg Kehadiran" value={data ? `${Math.round(data.avg_kehadiran * 10) / 10}%` : "—"} loading={isLoading} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Event Overview</h2>
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <StatCard icon={Mic} label="Event Terlaksana" value={String(data?.jumlah_event ?? "—")} loading={isLoading} />
          <StatCard icon={LayoutDashboard} label="Topik Dibahas" value={String(data?.jumlah_topik ?? "—")} loading={isLoading} />
        </div>
        {isLoading ? (
          <Skeleton className="h-56 rounded-xl" />
        ) : (
          <ChartEventPerBulan data={data?.event_per_bulan ?? []} />
        )}
      </section>
    </div>
  );
}
