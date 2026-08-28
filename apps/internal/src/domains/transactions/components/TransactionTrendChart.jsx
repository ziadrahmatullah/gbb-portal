import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTransactionTrend } from "../hooks/useTransactions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";

const MONTHS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

function formatRupiahShort(value) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
}

function formatRupiah(value) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-card px-3 py-2 text-xs shadow-md space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full inline-block" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{formatRupiah(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function TransactionTrendChart({ categoryId, districtId, mosqueId, trendFilter, trendYear, trendMonth, onFilterChange }) {
  const trendParams = {
    filter: trendFilter,
    year: trendYear,
    month: trendFilter === "mtd" ? trendMonth : undefined,
    category_id: categoryId !== "all" ? categoryId : undefined,
    district_id: districtId !== "all" ? districtId : undefined,
    mosque_id: mosqueId !== "all" ? mosqueId : undefined,
  };

  const { data: trendData, isLoading } = useTransactionTrend(trendParams);
  const chartData = trendData?.data ?? [];

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear].map(String);

  return (
    <div className="rounded-xl bg-card shadow-md p-4 space-y-4">
      {/* Chart header + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm font-semibold">Transaction Trend</p>
        <div className="flex items-center gap-3 flex-wrap">
          {/* YTD / MTD toggle */}
          <div className="flex items-center gap-1 rounded-lg border p-1">
            {["ytd", "mtd"].map((f) => (
              <button
                key={f}
                onClick={() => onFilterChange("trendFilter", f)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  trendFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Year */}
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground">Year</Label>
            <Select value={String(trendYear)} onValueChange={(v) => onFilterChange("trendYear", Number(v))}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month — only for MTD */}
          {trendFilter === "mtd" && (
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Month</Label>
              <Select value={String(trendMonth)} onValueChange={(v) => onFilterChange("trendMonth", Number(v))}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-56 rounded-lg bg-muted animate-pulse" />
      ) : chartData.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
          No trend data available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={224}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatRupiahShort}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value) => (
                <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="total_income"
              name="Pemasukan"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="total_expense"
              name="Pengeluaran"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
