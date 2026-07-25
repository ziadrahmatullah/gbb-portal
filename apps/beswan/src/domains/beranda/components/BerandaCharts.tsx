import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUIStore } from "@/shared/store/useUIStore";
import type { ChartBulanan, ChartIPK } from "../services";

// Palet tervalidasi dataviz validator terhadap surface card GBB
// (light #f7f7fa: PASS + relief legend/label; dark #1a1c1e: PASS penuh)
const VIZ = {
  light: {
    series1: "#2a78d6", // blue — Kehadiran / IPK
    series2: "#1baf7a", // aqua — Avg Nilai
    grid: "#e4e4ec",
    text: "#52514e",
    surface: "#ffffff",
  },
  dark: {
    series1: "#3987e5",
    series2: "#199e70",
    grid: "#33363a",
    text: "#c3c2b7",
    surface: "#1a1c1e",
  },
};

const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

function useVizColors() {
  const isDark = useUIStore((s: { isDark: boolean }) => s.isDark);
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
      <div className="h-56">{children}</div>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
      Belum ada data untuk periode ini
    </div>
  );
}

// Kehadiran% & rata-rata nilai per bulan — skala sama 0–100, satu sumbu Y
export function ChartTrenBulanan({ data }: { data: ChartBulanan[] }) {
  const c = useVizColors();
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
        { color: c.series1, label: "Kehadiran %" },
        { color: c.series2, label: "Avg Nilai" },
      ]}
    >
      {rows.length === 0 ? (
        <EmptyChartState />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: c.text, fontSize: 11 }} tickLine={false} axisLine={{ stroke: c.grid }} />
            <YAxis domain={[0, 100]} tick={{ fill: c.text, fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              cursor={{ stroke: c.grid, strokeWidth: 1 }}
              contentStyle={{ background: c.surface, border: `1px solid ${c.grid}`, borderRadius: 8, fontSize: 12, color: c.text }}
            />
            <Line type="monotone" dataKey="kehadiran" name="Kehadiran %" stroke={c.series1} strokeWidth={2} dot={{ r: 3, fill: c.series1 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="nilai" name="Avg Nilai" stroke={c.series2} strokeWidth={2} dot={{ r: 3, fill: c.series2 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// IPK kumulatif per semester lintas periode — satu seri
export function ChartIPKSemester({ data }: { data: ChartIPK[] }) {
  const c = useVizColors();
  const rows = data.map((d) => ({ label: d.periode_nama, ipk: d.ipk }));

  return (
    <ChartCard title="IPK per Semester (kumulatif)">
      {rows.length === 0 ? (
        <EmptyChartState />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -24 }}>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: c.text, fontSize: 11 }} tickLine={false} axisLine={{ stroke: c.grid }} />
            <YAxis domain={[0, 4]} tick={{ fill: c.text, fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              cursor={{ stroke: c.grid, strokeWidth: 1 }}
              contentStyle={{ background: c.surface, border: `1px solid ${c.grid}`, borderRadius: 8, fontSize: 12, color: c.text }}
            />
            <Line type="monotone" dataKey="ipk" name="IPK" stroke={c.series1} strokeWidth={2} dot={{ r: 3, fill: c.series1 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
