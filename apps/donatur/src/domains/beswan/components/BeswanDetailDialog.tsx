import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@gbb/ui";
import { StatCard } from "@/shared/components/StatCard";
import { BULAN_PENDEK } from "@/shared/lib/format";
import { useVizColors } from "@/shared/lib/viz";
import { useBeswanDetail } from "../hooks/useBeswan";
import { CalendarCheck, ClipboardList, GraduationCap, NotebookPen } from "lucide-react";

function ChartTrenBulanan({ data }: { data: { bulan: number; tahun: number; kehadiran_persen: number; avg_nilai: number | null }[] }) {
  const c = useVizColors();
  const rows = data.map((d) => ({
    label: `${BULAN_PENDEK[d.bulan - 1]} ${String(d.tahun).slice(2)}`,
    kehadiran: Math.round(d.kehadiran_persen * 10) / 10,
    nilai: d.avg_nilai == null ? null : Math.round(d.avg_nilai * 10) / 10,
  }));

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
        Belum ada data untuk periode ini
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: c.text, fontSize: 11 }} tickLine={false} axisLine={{ stroke: c.grid }} />
        <YAxis domain={[0, 100]} tick={{ fill: c.text, fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
        <Tooltip
          cursor={{ stroke: c.grid, strokeWidth: 1 }}
          contentStyle={{ background: c.surface, border: `1px solid ${c.grid}`, borderRadius: 8, fontSize: 12, color: c.text }}
        />
        <Line type="monotone" dataKey="kehadiran" name="Kehadiran %" stroke={c.series1} strokeWidth={2} dot={{ r: 3, fill: c.series1 }} />
        <Line type="monotone" dataKey="nilai" name="Avg Nilai" stroke={c.series2} strokeWidth={2} dot={{ r: 3, fill: c.series2 }} />
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
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        ) : !rapor ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Belum ada data rapor untuk periode ini
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={CalendarCheck} label="Kehadiran" value={`${rapor.kehadiran_hadir}/${rapor.kehadiran_total}`} />
              <StatCard icon={ClipboardList} label="Tugas" value={`${rapor.tugas_submitted}/${rapor.tugas_total}`} />
              <StatCard icon={NotebookPen} label="Refleksi" value={`${rapor.refleksi_submitted}/${rapor.refleksi_total}`} />
              <StatCard icon={GraduationCap} label="Avg Nilai" value={String(Math.round(rapor.tugas_avg_nilai * 10) / 10)} />
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">Tren Kehadiran &amp; Nilai per Bulan</h3>
              <ChartTrenBulanan data={rapor.chart_bulanan} />
            </div>

            {(data?.chart_ipk?.length ?? 0) > 0 && (
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h3 className="text-sm font-semibold mb-3">IPK per Semester</h3>
                <div className="flex flex-wrap gap-3">
                  {data!.chart_ipk.map((c) => (
                    <div key={`${c.periode_id}-${c.semester}`} className="rounded-lg border px-3 py-2 text-sm">
                      <div className="text-xs text-muted-foreground">{c.periode_nama}</div>
                      <div className="font-semibold">{c.ipk}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
