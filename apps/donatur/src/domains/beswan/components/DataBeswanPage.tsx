import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Award, CalendarCheck, GraduationCap, Search, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, Input } from "@gbb/ui";
import { useMyDashboard } from "@/domains/beranda/hooks/useBeranda";
import { useBeswanList } from "../hooks/useBeswan";
import { BeswanDetailDialog } from "./BeswanDetailDialog";

export function DataBeswanPage() {
  // Tidak ada endpoint periode untuk portal donatur — daftar periode diturunkan
  // dari history_konsistensi yang sudah dimuat di Beranda (query key sama, dedup).
  const { data: dashboard } = useMyDashboard();
  const periodeOptions = useMemo(
    () =>
      (dashboard?.history_konsistensi ?? []).map((h) => ({
        periode_id: h.periode_id,
        periode_nama: h.periode_nama,
        aktif: h.aktif,
      })),
    [dashboard]
  );
  const defaultPeriode = periodeOptions.find((p) => p.aktif) ?? periodeOptions[0];
  const [periodeId, setPeriodeId] = useState<number | undefined>();
  const activePeriodeId = periodeId ?? defaultPeriode?.periode_id;

  const [search, setSearch] = useState("");
  const { data, isLoading } = useBeswanList(activePeriodeId, { search: search || undefined });
  const [detailId, setDetailId] = useState<number | null>(null);

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Data &amp; Kegiatan Beswan</h1>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={activePeriodeId ? String(activePeriodeId) : ""}
          onValueChange={(v: string) => setPeriodeId(Number(v))}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Pilih periode…" />
          </SelectTrigger>
          <SelectContent>
            {periodeOptions.map((p) => (
              <SelectItem key={p.periode_id} value={String(p.periode_id)}>
                {p.periode_nama}
                {p.aktif ? " (aktif)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Cari beswan…"
            className="pl-9 w-64"
          />
        </div>
      </div>

      {!activePeriodeId ? (
        <p className="text-sm text-muted-foreground py-8 text-center rounded-xl border border-dashed">
          Belum ada periode untuk ditampilkan
        </p>
      ) : isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center rounded-xl border border-dashed">
          Tidak ada beswan ditemukan
        </p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((b) => (
            <div key={b.id} className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {b.foto_url ? (
                  <img src={b.foto_url} alt={b.nama_lengkap} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="font-medium truncate" title={b.nama_lengkap}>
                  {b.nama_lengkap}
                </div>
              </div>

              <div className="text-xs font-semibold text-muted-foreground tracking-wide">
                📊 Update Terbaru
              </div>
              <ul className="text-sm space-y-0.5">
                <li className="flex items-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  Hadir {b.kehadiran_hadir}/{b.kehadiran_total} event
                </li>
                {b.prestasi_terbaru && (
                  <li className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {b.prestasi_terbaru}
                  </li>
                )}
                {b.ipk_terbaru != null && (
                  <li className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    IPK {b.ipk_terbaru}
                  </li>
                )}
              </ul>

              {b.ringkasan && (
                <p className="text-xs text-muted-foreground italic line-clamp-3">“{b.ringkasan}”</p>
              )}

              <div className="text-sm text-muted-foreground mt-auto">
                Refleksi: {b.refleksi_submitted}/{b.refleksi_total} bulan
              </div>
              <Button size="sm" variant="outline" onClick={() => setDetailId(b.id)}>
                Lihat Detail
              </Button>
            </div>
          ))}
        </div>
      )}

      {detailId != null && (
        <BeswanDetailDialog
          beswanId={detailId}
          periodeId={activePeriodeId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
