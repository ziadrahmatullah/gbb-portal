import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Award, CalendarCheck, GraduationCap, Search, Users } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardFooter,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@gbb/ui";
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
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Data &amp; Kegiatan Beswan</h1>
      </div>

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
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Cari beswan…"
            className="w-64 pl-9"
          />
        </div>
      </div>

      {!activePeriodeId ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border py-10 text-center">
          <Users className="size-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Belum ada periode untuk ditampilkan</p>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border py-10 text-center">
          <Search className="size-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Tidak ada beswan ditemukan</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((b) => (
            <Card key={b.id} className="gap-3 py-4">
              <CardContent className="flex flex-1 flex-col gap-2 px-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    {b.foto_url && <AvatarImage src={b.foto_url} alt={b.nama_lengkap} />}
                    <AvatarFallback>
                      <Users className="size-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="truncate font-medium" title={b.nama_lengkap}>
                    {b.nama_lengkap}
                  </div>
                </div>

                <div className="text-xs font-semibold tracking-wide text-muted-foreground">
                  📊 Update Terbaru
                </div>
                <ul className="space-y-0.5 text-sm">
                  <li className="flex items-center gap-1.5">
                    <CalendarCheck className="size-3.5 shrink-0 text-muted-foreground" />
                    Hadir {b.kehadiran_hadir}/{b.kehadiran_total} event
                  </li>
                  {b.prestasi_terbaru && (
                    <li className="flex items-center gap-1.5">
                      <Award className="size-3.5 shrink-0 text-muted-foreground" />
                      {b.prestasi_terbaru}
                    </li>
                  )}
                  {b.ipk_terbaru != null && (
                    <li className="flex items-center gap-1.5">
                      <GraduationCap className="size-3.5 shrink-0 text-muted-foreground" />
                      IPK {b.ipk_terbaru}
                    </li>
                  )}
                </ul>

                {b.ringkasan && (
                  <p className="text-xs italic text-muted-foreground line-clamp-3">“{b.ringkasan}”</p>
                )}

                <div className="mt-auto text-sm text-muted-foreground">
                  Refleksi: {b.refleksi_submitted}/{b.refleksi_total} bulan
                </div>
              </CardContent>
              <CardFooter className="px-4">
                <Button size="sm" variant="outline" className="w-full" onClick={() => setDetailId(b.id)}>
                  Lihat Detail
                </Button>
              </CardFooter>
            </Card>
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
