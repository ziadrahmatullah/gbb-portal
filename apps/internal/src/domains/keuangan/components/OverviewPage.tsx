import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownCircle, ArrowUpCircle, Hash, Info, Scale } from "lucide-react";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { useUIStore } from "@/shared/store/useUIStore";
import { StatCard } from "@/shared/components/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useOverview, useOverviewBreakdown } from "../hooks/useKeuangan";
import { aggregatePerBulan, aggregatePerKategori } from "../services";
import { formatNominal } from "../utils";

// Palet dari reference dataviz (tervalidasi 6-checks di surface GBB light/dark).
// Kontras WARN beberapa slot light → relief: legend + tabel per kategori di bawah chart.
const VIZ = {
  light: {
    series: ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"],
    grid: "#e4e4ec",
    text: "#52514e",
    surface: "#ffffff",
  },
  dark: {
    series: ["#3987e5", "#199e70", "#c98500", "#008300", "#9085e9", "#e66767", "#d55181", "#d95926"],
    grid: "#33363a",
    text: "#c3c2b7",
    surface: "#1a1c1e",
  },
};

const formatCompact = (v: number) =>
  new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(v);

const formatRupiah = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

function useVizColors() {
  const isDark = useUIStore((s) => s.isDark);
  return isDark ? VIZ.dark : VIZ.light;
}

function ChartCard({
  title,
  legend,
  children,
}: {
  title: string;
  legend?: { color: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {legend && (
          <div className="flex flex-wrap items-center gap-3">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="h-60">{children}</div>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
      Belum ada data transaksi
    </div>
  );
}

export function OverviewPage() {
  const c = useVizColors();
  const periodeId = usePeriodeFilter((s) => s.periodeId) ?? undefined;
  const { data: overview, isLoading } = useOverview(periodeId);
  const { data: breakdown, isLoading: breakdownLoading } = useOverviewBreakdown();

  const items = breakdown?.items ?? [];
  const perBulan = aggregatePerBulan(items);
  const perKategori = aggregatePerKategori(items);
  const komposisiOut = perKategori.filter((k) => k.tipe === "cash_out");

  const tooltipStyle = {
    background: c.surface,
    border: `1px solid ${c.grid}`,
    borderRadius: 8,
    fontSize: 12,
    color: c.text,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Overview Keuangan</h1>

      {/* Ringkasan per range (bukan saldo absolut) — ikut filter periode global */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ArrowDownCircle} label="Total Masuk" value={overview ? formatRupiah(overview.total_masuk) : "—"} loading={isLoading} />
        <StatCard icon={ArrowUpCircle} label="Total Keluar" value={overview ? formatRupiah(overview.total_keluar) : "—"} loading={isLoading} />
        <StatCard icon={Scale} label="Net" value={overview ? formatRupiah(overview.net) : "—"} loading={isLoading} />
        <StatCard icon={Hash} label="Transaksi" value={String(overview?.jumlah_transaksi ?? "—")} loading={isLoading} />
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 shrink-0" />
        Chart & tabel di bawah diagregasi dari seluruh transaksi (maks 500 terbaru) dan belum
        bisa difilter periode — menunggu endpoint agregasi backend.
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Tren per bulan — dua seri satu skala rupiah */}
        <ChartCard
          title="Tren Cashflow /bulan"
          legend={[
            { color: c.series[0], label: "Masuk" },
            { color: c.series[1], label: "Keluar" },
          ]}
        >
          {breakdownLoading || perBulan.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perBulan} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="bulan" tick={{ fill: c.text, fontSize: 11 }} tickLine={false} axisLine={{ stroke: c.grid }} />
                <YAxis tickFormatter={formatCompact} tick={{ fill: c.text, fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
                <Tooltip
                  cursor={{ fill: c.grid, opacity: 0.4 }}
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    formatRupiah(Number(value ?? 0)),
                    name === "masuk" ? "Masuk" : "Keluar",
                  ]}
                />
                <Bar dataKey="masuk" name="masuk" fill={c.series[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="keluar" name="keluar" fill={c.series[1]} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Komposisi pengeluaran per kategori */}
        <ChartCard
          title="Komposisi Pengeluaran per Kategori"
          legend={komposisiOut.slice(0, 8).map((k, i) => ({ color: c.series[i % 8], label: k.nama }))}
        >
          {breakdownLoading || komposisiOut.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatRupiah(Number(value ?? 0))} />
                <Pie
                  data={komposisiOut.slice(0, 8)}
                  dataKey="total"
                  nameKey="nama"
                  innerRadius="45%"
                  outerRadius="80%"
                  paddingAngle={2}
                  stroke={c.surface}
                  strokeWidth={2}
                >
                  {komposisiOut.slice(0, 8).map((k, i) => (
                    <Cell key={k.nama} fill={c.series[i % 8]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Tabel per kategori (sekaligus table view untuk aksesibilitas chart) */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead className="w-24">Tipe</TableHead>
              <TableHead className="w-28 text-right">Transaksi</TableHead>
              <TableHead className="w-40 text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdownLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="h-6 animate-pulse rounded bg-muted" />
                </TableCell>
              </TableRow>
            ) : perKategori.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                  Belum ada transaksi
                </TableCell>
              </TableRow>
            ) : (
              perKategori.map((k) => (
                <TableRow key={`${k.nama}-${k.tipe}`}>
                  <TableCell className="font-medium text-sm">{k.nama}</TableCell>
                  <TableCell className="text-xs font-mono">{k.tipe === "cash_in" ? "In" : "Out"}</TableCell>
                  <TableCell className="text-right text-sm">{k.jumlah}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatNominal(k.total)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
