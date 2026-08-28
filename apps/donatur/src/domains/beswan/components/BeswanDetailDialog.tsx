import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from "@gbb/ui";
import { StatCard } from "@/shared/components/StatCard";
import { BULAN_PENDEK } from "@/shared/lib/format";
import { useBeswanDetail } from "../hooks/useBeswan";
import { CalendarCheck, ClipboardList, GraduationCap, NotebookPen } from "lucide-react";

function ChartTrenBulanan({ data }: { data: { bulan: number; tahun: number; kehadiran_persen: number; avg_nilai: number | null }[] }) {
  const rows = data.map((d) => ({
    label: `${BULAN_PENDEK[d.bulan - 1]} ${String(d.tahun).slice(2)}`,
    kehadiran: Math.round(d.kehadiran_persen * 10) / 10,
    nilai: d.avg_nilai == null ? null : Math.round(d.avg_nilai * 10) / 10,
  }));

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border text-xs text-muted-foreground">
        Belum ada data untuk periode ini
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            fontSize: 12,
            color: "var(--popover-foreground)",
          }}
        />
        <Line
          type="monotone"
          dataKey="kehadiran"
          name="Kehadiran %"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--chart-1)" }}
        />
        <Line
          type="monotone"
          dataKey="nilai"
          name="Avg Nilai"
          stroke="var(--chart-2)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--chart-2)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BeswanDetailDialog({
  beswanId,
  periodeId,
  onClose,
}: {
  beswanId: number;
  periodeId?: number;
  onClose: () => void;
}) {
  const { data, isLoading } = useBeswanDetail(beswanId, periodeId);
  const rapor = data?.rapor;

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.nama_lengkap ?? "Detail Beswan"}</DialogTitle>
          <DialogDescription>{data?.email}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : !rapor ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada data rapor untuk periode ini
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={CalendarCheck} label="Kehadiran" value={`${rapor.kehadiran_hadir}/${rapor.kehadiran_total}`} />
              <StatCard icon={ClipboardList} label="Tugas" value={`${rapor.tugas_submitted}/${rapor.tugas_total}`} />
              <StatCard icon={NotebookPen} label="Refleksi" value={`${rapor.refleksi_submitted}/${rapor.refleksi_total}`} />
              <StatCard icon={GraduationCap} label="Avg Nilai" value={String(Math.round(rapor.tugas_avg_nilai * 10) / 10)} />
            </div>

            <Card className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-sm">Tren Kehadiran &amp; Nilai per Bulan</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <ChartTrenBulanan data={rapor.chart_bulanan} />
              </CardContent>
            </Card>

            {(data?.chart_ipk?.length ?? 0) > 0 && (
              <Card className="gap-3 py-4">
                <CardHeader className="px-4">
                  <CardTitle className="text-sm">IPK per Semester</CardTitle>
                </CardHeader>
                <CardContent className="px-4">
                  <div className="flex flex-wrap gap-3">
                    {data!.chart_ipk.map((c) => (
                      <div key={`${c.periode_id}-${c.semester}`} className="rounded-lg border px-3 py-2 text-sm">
                        <div className="text-xs text-muted-foreground">{c.periode_nama}</div>
                        <div className="font-semibold">{c.ipk}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
