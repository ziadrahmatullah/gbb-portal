import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  useDashboardMasterData,
  useDashboardTransaction,
  useDashboardQurban,
} from "../hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { Tag, MapPin, Building, Package, Wallet, TrendingUp, TrendingDown, Activity, Calendar, Image as ImageIcon, FileText } from "lucide-react";

// ─── constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  { value: "1", label: "Januari" }, { value: "2", label: "Februari" },
  { value: "3", label: "Maret" }, { value: "4", label: "April" },
  { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
  { value: "7", label: "Juli" }, { value: "8", label: "Agustus" },
  { value: "9", label: "September" }, { value: "10", label: "Oktober" },
  { value: "11", label: "November" }, { value: "12", label: "Desember" },
];

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 2, currentYear - 1, currentYear].map(String);

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatRupiah(v) {
  if (!v) return "Rp 0";
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)}M`;
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)}jt`;
  return `Rp ${Number(v).toLocaleString("id-ID")}`;
}

function formatRupiahFull(v) {
  return `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
}

// ─── shared UI ───────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return <h2 className="text-lg font-bold border-b pb-2">{children}</h2>;
}

function StatCard({ icon: Icon, label, value, color = "bg-primary/10 text-primary" }) {
  return (
    <Card>
      <CardContent className="pt-5 flex items-center gap-4">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PeriodFilter({ filter, year, month, onFilterChange }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1 rounded-lg border p-1">
        {["ytd", "mtd"].map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange("filter", f)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">Year</Label>
        <Select value={String(year)} onValueChange={(v) => onFilterChange("year", Number(v))}>
          <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {filter === "mtd" && (
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Select value={String(month)} onValueChange={(v) => onFilterChange("month", Number(v))}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function DonutChart({ title, data, nameKey, valueKey, formatValue, colors }) {
  const nonZero = data.filter((d) => d[valueKey] > 0);
  const palette = colors ?? PALETTE;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {nonZero.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
            Tidak ada data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={nonZero}
                dataKey={valueKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
              >
                {nonZero.map((_, i) => (
                  <Cell key={i} fill={palette[i % palette.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => formatValue ? formatValue(v) : v}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function SkeletonGrid({ cols = 4, cardH = "h-24" }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-${cols}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className={`${cardH} rounded-xl bg-muted animate-pulse`} />
      ))}
    </div>
  );
}

// ─── sections ─────────────────────────────────────────────────────────────────

function MasterDataSection() {
  const { data, isLoading } = useDashboardMasterData();

  const stats = [
    { icon: Tag,       label: "Categories",   value: data?.total_categories ?? 0,  color: "bg-violet-500/10 text-violet-600" },
    { icon: MapPin,    label: "Districts",    value: data?.total_districts ?? 0,   color: "bg-blue-500/10 text-blue-600" },
    { icon: Building,  label: "Mosques",      value: data?.total_mosques ?? 0,     color: "bg-emerald-500/10 text-emerald-600" },
    { icon: Package,   label: "Animal Types", value: data?.total_animal_types ?? 0, color: "bg-amber-500/10 text-amber-600" },
    { icon: Calendar,  label: "Events",       value: data?.total_events ?? 0,      color: "bg-pink-500/10 text-pink-600" },
    { icon: ImageIcon, label: "Galleries",    value: data?.total_galleries ?? 0,   color: "bg-cyan-500/10 text-cyan-600" },
    { icon: FileText,  label: "Articles",     value: data?.total_articles ?? 0,    color: "bg-indigo-500/10 text-indigo-600" },
  ];

  return (
    <section className="space-y-4">
      <SectionTitle>Master Data</SectionTitle>
      {isLoading ? <SkeletonGrid cols={4} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      )}
    </section>
  );
}

function TransactionSection() {
  const [filter, setFilter] = useState("ytd");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const handleFilterChange = (key, val) => {
    if (key === "filter") setFilter(val);
    if (key === "year") setYear(val);
    if (key === "month") setMonth(val);
  };

  const params = { filter, year, ...(filter === "mtd" && { month }) };
  const { data, isLoading } = useDashboardTransaction(params);

  const totals = [
    { icon: Activity,     label: "Total Transaksi",   value: data?.total_transactions ?? 0,  color: "bg-primary/10 text-primary" },
    { icon: TrendingUp,   label: "Total Pemasukan",   value: formatRupiahFull(data?.total_income),   color: "bg-emerald-500/10 text-emerald-600" },
    { icon: TrendingDown, label: "Total Pengeluaran", value: formatRupiahFull(data?.total_expense),  color: "bg-rose-500/10 text-rose-600" },
    { icon: Wallet,       label: "Net",               value: formatRupiahFull(data?.total_net),      color: "bg-blue-500/10 text-blue-600" },
  ];

  const incomeVsExpense = data?.income_vs_expense ? [
    { name: "Pemasukan",   amount: data.income_vs_expense.total_income },
    { name: "Pengeluaran", amount: data.income_vs_expense.total_expense },
  ] : [];

  const incomeByDistrict = (data?.income_by_district ?? []).map((d) => ({
    name: d.district_name, amount: d.amount,
  }));

  const expenseByDistrict = (data?.expense_by_district ?? []).map((d) => ({
    name: d.district_name, amount: d.amount,
  }));

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SectionTitle>Transaksi</SectionTitle>
        <PeriodFilter filter={filter} year={year} month={month} onFilterChange={handleFilterChange} />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonGrid cols={4} />
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />)}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {totals.map((s) => <StatCard key={s.label} {...s} />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <DonutChart title="Pemasukan vs Pengeluaran" data={incomeVsExpense} nameKey="name" valueKey="amount" formatValue={formatRupiah} colors={["#10b981", "#f43f5e"]} />
            <DonutChart title="Pemasukan per Kecamatan"  data={incomeByDistrict}  nameKey="name" valueKey="amount" formatValue={formatRupiah} />
            <DonutChart title="Pengeluaran per Kecamatan" data={expenseByDistrict} nameKey="name" valueKey="amount" formatValue={formatRupiah} />
          </div>
        </div>
      )}
    </section>
  );
}

function QurbanSection() {
  const [year, setYear] = useState(currentYear);
  const { data, isLoading } = useDashboardQurban({ year });

  const animalTypeData = (data?.qurban_by_animal_type ?? []).map((d) => ({
    name: d.animal_type_name,
    qty: d.total_quantity,
  }));

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SectionTitle>Qurban</SectionTitle>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonGrid cols={2} />
          <div className="h-72 rounded-xl bg-muted animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Package} label="Total Qurban (peserta)" value={data?.total_qurban ?? 0}   color="bg-amber-500/10 text-amber-600" />
            <StatCard icon={Package} label="Total Qty Hewan"        value={data?.total_quantity ?? 0} color="bg-emerald-500/10 text-emerald-600" />
          </div>
          <div className="max-w-sm">
            <DonutChart title="Qurban per Jenis Hewan" data={animalTypeData} nameKey="name" valueKey="qty" />
          </div>
        </div>
      )}
    </section>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export function Dashboard() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Ringkasan data DMI</p>
      </div>
      <MasterDataSection />
      <TransactionSection />
      <QurbanSection />
    </div>
  );
}
