import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@gbb/ui";
import type { ChartBulanan, ChartIPK } from "../services";

// Warna chart ikut token tema (theme.css) — otomatis menyesuaikan light/dark
const SERIES_1 = "var(--chart-1)"; // Kehadiran / IPK
const SERIES_2 = "var(--chart-2)"; // Avg Nilai
const GRID = "var(--border)";
const TEXT = "var(--muted-foreground)";

const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--popover-foreground)",
  fontSize: 12,
} as const;

const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

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
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {legend && (
          <CardAction>
            <div className="flex items-center gap-4">
              {legend.map((l) => (
                <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="px-4">
        <div className="h-56">{children}</div>
      </CardContent>
    </Card>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border text-xs text-muted-foreground">
      Belum ada data untuk periode ini
    </div>
  );
}

// Kehadiran% & rata-rata nilai per bulan — skala sama 0–100, satu sumbu Y
export function ChartTrenBulanan({ data }: { data: ChartBulanan[] }) {
  const rows = data.map((d) => ({
    label: `${BULAN_PENDEK[d.bulan - 1]} ${String(d.tahun).slice(2)}`,
    kehadiran: Math.round(d.kehadiran_persen * 10) / 10,
    // null = tidak ada tugas dinilai bulan itu → garis putus (gap), bukan titik 0
    nilai: d.avg_nilai == null ? null : Math.round(d.avg_nilai * 10) / 10,
  }));

  return (
    <ChartCard
      title="Tren Kehadiran & Nilai /bulan"
      legend={[
        { color: SERIES_1, label: "Kehadiran %" },
        { color: SERIES_2, label: "Avg Nilai" },
      ]}
    >
      {rows.length === 0 ? (
        <EmptyChartState />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: TEXT, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis domain={[0, 100]} tick={{ fill: TEXT, fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
            <Tooltip cursor={{ stroke: GRID, strokeWidth: 1 }} contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="kehadiran" name="Kehadiran %" stroke={SERIES_1} strokeWidth={2} dot={{ r: 3, fill: SERIES_1 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="nilai" name="Avg Nilai" stroke={SERIES_2} strokeWidth={2} dot={{ r: 3, fill: SERIES_2 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// IPK kumulatif per semester lintas periode — satu seri
export function ChartIPKSemester({ data }: { data: ChartIPK[] }) {
  const rows = data.map((d) => ({ label: d.periode_nama, ipk: d.ipk }));

  return (
    <ChartCard title="IPK per Semester (kumulatif)">
      {rows.length === 0 ? (
        <EmptyChartState />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -24 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: TEXT, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis domain={[0, 4]} tick={{ fill: TEXT, fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
            <Tooltip cursor={{ stroke: GRID, strokeWidth: 1 }} contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="ipk" name="IPK" stroke={SERIES_1} strokeWidth={2} dot={{ r: 3, fill: SERIES_1 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
