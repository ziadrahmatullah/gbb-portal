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
import { ArrowDownCircle, ArrowUpCircle, Hash, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@gbb/ui";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
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
import { formatNominal } from "../utils";

// Palet chart mengikuti token tema (--chart-1..5); kategori lebih dari 5 mengulang warna.
// Relief kontras: legend + tabel per kategori di bawah chart.
const SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const GRID = "var(--border)";
const TEXT = "var(--muted-foreground)";
const SURFACE = "var(--card)";

const formatCompact = (v: number) =>
  new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(v);

const formatRupiah = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

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
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm">{title}</CardTitle>
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
      </CardHeader>
      <CardContent className="px-4">
        <div className="h-60">{children}</div>
      </CardContent>
    </Card>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border text-xs text-muted-foreground">
      Belum ada data transaksi
    </div>
  );
}

export function OverviewPage() {
  const periodeId = usePeriodeFilter((s) => s.periodeId) ?? undefined;
  const { data: overview, isLoading } = useOverview(periodeId);
  const { data: breakdown, isLoading: breakdownLoading } = useOverviewBreakdown(periodeId);

  const perBulan = breakdown?.per_bulan ?? [];
  const perKategori = breakdown?.per_kategori ?? [];
  const komposisiOut = perKategori.filter((k) => k.tipe === "cash_out");

  const tooltipStyle = {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    fontSize: 12,
    color: "var(--popover-foreground)",
  };

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Overview Keuangan</h1>
        <p className="text-muted-foreground">Ringkasan cashflow mengikuti filter periode global.</p>
      </div>

      {/* Ringkasan per range (bukan saldo absolut) — ikut filter periode global */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ArrowDownCircle} label="Total Masuk" value={overview ? formatRupiah(overview.total_masuk) : "—"} loading={isLoading} />
        <StatCard icon={ArrowUpCircle} label="Total Keluar" value={overview ? formatRupiah(overview.total_keluar) : "—"} loading={isLoading} />
        <StatCard icon={Scale} label="Net" value={overview ? formatRupiah(overview.net) : "—"} loading={isLoading} />
        <StatCard icon={Hash} label="Transaksi" value={String(overview?.jumlah_transaksi ?? "—")} loading={isLoading} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Tren per bulan — dua seri satu skala rupiah */}
        <ChartCard
          title="Tren Cashflow /bulan"
          legend={[
            { color: SERIES[0], label: "Masuk" },
            { color: SERIES[1], label: "Keluar" },
          ]}
        >
          {breakdownLoading || perBulan.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perBulan} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="bulan" tick={{ fill: TEXT, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} />
                <YAxis tickFormatter={formatCompact} tick={{ fill: TEXT, fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
                <Tooltip
                  cursor={{ fill: GRID, opacity: 0.4 }}
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    formatRupiah(Number(value ?? 0)),
                    name === "masuk" ? "Masuk" : "Keluar",
                  ]}
                />
                <Bar dataKey="masuk" name="masuk" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="keluar" name="keluar" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Komposisi pengeluaran per kategori */}
        <ChartCard
          title="Komposisi Pengeluaran per Kategori"
          legend={komposisiOut.slice(0, 8).map((k, i) => ({ color: SERIES[i % SERIES.length], label: k.nama }))}
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
                  stroke={SURFACE}
                  strokeWidth={2}
                >
                  {komposisiOut.slice(0, 8).map((k, i) => (
                    <Cell key={k.nama} fill={SERIES[i % SERIES.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Tabel per kategori (sekaligus table view untuk aksesibilitas chart) */}
      <div className="overflow-x-auto rounded-md border bg-card">
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
                  <Skeleton className="h-6 w-full" />
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
                <TableRow key={`${k.kategori_id ?? "none"}-${k.tipe}`}>
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
