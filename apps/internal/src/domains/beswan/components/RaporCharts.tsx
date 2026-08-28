import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@gbb/ui";
import type { BeswanChartBulanan, BeswanChartIPK } from "../services";

// Warna seri mengikuti token chart tema (--chart-1..5) — otomatis ikut light/dark.
const SERIES_1 = "var(--chart-1)";
const SERIES_2 = "var(--chart-2)";
const GRID = "var(--border)";
const TEXT = "var(--muted-foreground)";

const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  fontSize: 12,
  color: "var(--popover-foreground)",
} as const;

const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

function ChartCard({
  title,
  children,
  legend,
}: {
  title: string;
  children: React.ReactNode;
  legend?: { color: string; label: string }[];
}) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm">{title}</CardTitle>
          {legend && (
            <div className="flex items-center gap-4">
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
        <div className="h-56">{children}</div>
      </CardContent>
    </Card>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
      Belum ada data untuk periode ini
    </div>
  );
}

// Kehadiran (%) & rata-rata nilai tugas per bulan — keduanya skala 0–100,
// jadi satu sumbu Y dipakai bersama (bukan dual-axis).
export function ChartKehadiranNilai({ data }: { data: BeswanChartBulanan[] }) {
  const legend = [
    { color: SERIES_1, label: "Kehadiran %" },
    { color: SERIES_2, label: "Avg Nilai" },
  ];
  const rows = data.map((d) => ({
    label: `${BULAN_PENDEK[d.bulan - 1]} ${String(d.tahun).slice(2)}`,
    kehadiran: Math.round(d.kehadiran_persen * 10) / 10,
    // null = tidak ada tugas dinilai bulan itu → garis putus (gap), bukan titik 0
    nilai: d.avg_nilai == null ? null : Math.round(d.avg_nilai * 10) / 10,
  }));

  return (
    <ChartCard title="Kehadiran & Nilai /bulan" legend={legend}>
      {rows.length === 0 ? (
        <EmptyChartState />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
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

// IPK kumulatif per semester lintas periode — satu seri, judul sudah menamai seri.
export function ChartIPK({ data }: { data: BeswanChartIPK[] }) {
  const rows = data.map((d) => ({
    label: d.periode_nama,
    ipk: d.ipk,
  }));

  return (
    <ChartCard title="IPK per Semester (kumulatif)">
      {rows.length === 0 ? (
        <EmptyChartState />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -24 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
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
