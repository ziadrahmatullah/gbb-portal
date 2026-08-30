import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@gbb/ui";
import { cn } from "@/lib/utils";
import type { ChartCount } from "../services";

// Warna seri mengikuti token chart tema (--chart-1..5) — otomatis ikut light/dark.
// Pasangan dua-seri selalu chart-1 & chart-2 (oranye/biru, separasi CVD terbaik).
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
const NEUTRAL = "var(--muted)";

const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  fontSize: 12,
  color: "var(--popover-foreground)",
} as const;

const truncate = (v: string, max = 16) => (v.length > max ? `${v.slice(0, max - 1)}…` : v);

export function ChartCard({
  title,
  legend,
  className,
  children,
}: {
  title: string;
  legend?: { color: string; label: string }[];
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("gap-3 py-4", className)}>
      <CardHeader className="px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm">{title}</CardTitle>
          {legend && (
            <div className="flex flex-wrap items-center gap-3">
              {legend.map((l) => (
                <span
                  key={l.label}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: l.color }}
                  />
                  {l.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <div className="h-56">{children}</div>
      </CardContent>
    </Card>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
      Belum ada data
    </div>
  );
}

function LoadingChartState() {
  return <Skeleton className="h-full w-full rounded-md" />;
}

// ─── Bar vertikal satu seri ─────────────────────────────────────────────
// Dipakai: event per bulan, tren pendaftaran donatur, distribusi IPK,
// nilai tugas per batch, penugasan overview. Judul kartu menamai serinya.

export function ChartBarSeri({
  title,
  rows,
  name,
  yMax,
  loading,
  className,
}: {
  title: string;
  rows: { label: string; jumlah: number }[];
  name: string; // nama nilai di tooltip, mis. "Event" / "Beswan"
  yMax?: number;
  loading?: boolean;
  className?: string;
}) {
  return (
    <ChartCard title={title} className={className}>
      {loading ? (
        <LoadingChartState />
      ) : rows.length === 0 ? (
        <EmptyChartState />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: TEXT, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              tickFormatter={(v: string) => truncate(v, 12)}
            />
            <YAxis
              domain={yMax ? [0, yMax] : undefined}
              allowDecimals={false}
              tick={{ fill: TEXT, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ fill: GRID, opacity: 0.4 }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [String(value ?? 0), name]}
            />
            <Bar dataKey="jumlah" name={name} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ─── Line persen 0-100 satu seri ────────────────────────────────────────

export function ChartLinePersen({
  title,
  rows,
  name,
  loading,
  className,
}: {
  title: string;
  rows: { label: string; persen: number }[];
  name: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <ChartCard title={title} className={className}>
      {loading ? (
        <LoadingChartState />
      ) : rows.length === 0 ? (
        <EmptyChartState />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: TEXT, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: GRID }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: TEXT, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: GRID, strokeWidth: 1 }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [`${value ?? 0}%`, name]}
            />
            <Line
              type="monotone"
              dataKey="persen"
              name={name}
              stroke={SERIES[0]}
              strokeWidth={2}
              dot={{ r: 3, fill: SERIES[0] }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ─── Bar dua seri (skala sama) ──────────────────────────────────────────
// Dipakai: refleksi selesai vs total per bulan.

// rows memakai kunci tetap a/b — caller memetakan datanya ke bentuk ini
export function ChartBarDuaSeri({
  title,
  rows,
  labelA,
  labelB,
  loading,
  className,
}: {
  title: string;
  rows: { label: string; a: number; b: number }[];
  labelA: string;
  labelB: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <ChartCard
      title={title}
      className={className}
      legend={[
        { color: SERIES[0], label: labelA },
        { color: SERIES[1], label: labelB },
      ]}
    >
      {loading ? (
        <LoadingChartState />
      ) : rows.length === 0 ? (
        <EmptyChartState />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: TEXT, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: GRID }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: TEXT, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ fill: GRID, opacity: 0.4 }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => [String(value ?? 0), name === "a" ? labelA : labelB]}
            />
            <Bar dataKey="a" name="a" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="b" name="b" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ─── Donut ──────────────────────────────────────────────────────────────
// Dipakai: kehadiran (hadir vs tidak, sisa = warna netral) dan skema donasi.
// Gap stroke 2px antar-slice = pemisah non-warna (relief CVD).

export function ChartDonut({
  title,
  slices,
  centerText,
  centerSub,
  loading,
  className,
}: {
  title: string;
  slices: { label: string; value: number; color?: string }[];
  centerText?: string;
  centerSub?: string;
  loading?: boolean;
  className?: string;
}) {
  const shown = slices.filter((s) => s.value > 0);
  const total = shown.reduce((acc, s) => acc + s.value, 0);
  const withColor = shown.map((s, i) => ({
    ...s,
    color: s.color ?? SERIES[i % SERIES.length],
  }));

  return (
    <ChartCard
      title={title}
      className={className}
      legend={withColor.map((s) => ({ color: s.color, label: s.label }))}
    >
      {loading ? (
        <LoadingChartState />
      ) : total === 0 ? (
        <EmptyChartState />
      ) : (
        <div className="relative h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value, name) => [
                  `${value} (${Math.round((Number(value) / total) * 100)}%)`,
                  name,
                ]}
              />
              <Pie
                data={withColor}
                dataKey="value"
                nameKey="label"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
                stroke={SURFACE}
                strokeWidth={2}
              >
                {withColor.map((s) => (
                  <Cell key={s.label} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {centerText && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold">{centerText}</span>
              {centerSub && <span className="text-xs text-muted-foreground">{centerSub}</span>}
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
}

// ─── Bar horizontal kategorikal (top-N + "Lainnya") ─────────────────────
// Dipakai: 7 chart demografi Growth. Label panjang (universitas, profesi)
// lebih terbaca horizontal; ekor panjang dilipat ke "Lainnya".

export function ChartBarKategori({
  title,
  data,
  maxItems = 8,
  loading,
  className,
}: {
  title: string;
  data: ChartCount[];
  maxItems?: number;
  loading?: boolean;
  className?: string;
}) {
  const sorted = [...data].sort((a, b) => b.jumlah - a.jumlah);
  const head = sorted.slice(0, maxItems);
  const rest = sorted.slice(maxItems).reduce((acc, d) => acc + d.jumlah, 0);
  const rows = rest > 0 ? [...head, { label: "Lainnya", jumlah: rest }] : head;

  return (
    <ChartCard title={title} className={className}>
      {loading ? (
        <LoadingChartState />
      ) : rows.length === 0 ? (
        <EmptyChartState />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={rows} margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: TEXT, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: GRID }}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: TEXT, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={104}
              tickFormatter={(v: string) => truncate(v)}
            />
            <Tooltip
              cursor={{ fill: GRID, opacity: 0.4 }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [String(value ?? 0), "Jumlah"]}
            />
            <Bar dataKey="jumlah" name="Jumlah" fill={SERIES[0]} radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export { NEUTRAL as CHART_NEUTRAL, SERIES as CHART_SERIES };
