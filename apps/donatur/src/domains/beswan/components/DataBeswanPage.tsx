import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Award,
  CalendarCheck,
  GraduationCap,
  LayoutGrid,
  List,
  Search,
  Users,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardFooter,
  cn,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gbb/ui";
import { Link } from "react-router-dom";
import { useMyDashboard } from "@/domains/beranda/hooks/useBeranda";
import { useBeswanList } from "../hooks/useBeswan";

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
  const [view, setView] = useState<"grid" | "list">("grid");

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
        {/* Toggle tampilan grid / list — pola sama dgn list Event internal */}
        <div className="ms-auto flex items-center rounded-md border p-0.5">
          <button
            title="Tampilan grid"
            onClick={() => setView("grid")}
            className={cn(
              "rounded-sm p-1.5 transition-colors",
              view === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            title="Tampilan list"
            onClick={() => setView("list")}
            className={cn(
              "rounded-sm p-1.5 transition-colors",
              view === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </button>
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
      ) : view === "list" ? (
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="w-32">Kehadiran</TableHead>
                <TableHead className="w-20 text-right">IPK</TableHead>
                <TableHead className="w-28 text-right">Refleksi</TableHead>
                <TableHead>Prestasi Terbaru</TableHead>
                <TableHead className="w-28 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        {b.foto_url && <AvatarImage src={b.foto_url} alt={b.nama_lengkap} />}
                        <AvatarFallback>
                          <Users className="size-3.5 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{b.nama_lengkap}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {b.kehadiran_hadir}/{b.kehadiran_total} event
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {b.ipk_terbaru != null ? b.ipk_terbaru : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm whitespace-nowrap">
                    {b.refleksi_submitted}/{b.refleksi_total} bulan
                  </TableCell>
                  <TableCell className="max-w-56">
                    <div className="truncate text-sm" title={b.prestasi_terbaru ?? undefined}>
                      {b.prestasi_terbaru || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/data-beswan/${b.id}`}>Lihat Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link to={`/data-beswan/${b.id}`}>Lihat Detail</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
