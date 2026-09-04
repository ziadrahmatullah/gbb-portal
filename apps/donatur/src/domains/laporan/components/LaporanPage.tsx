import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Download, FileText, Search } from "lucide-react";
import {
  Badge,
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
import { useMyDashboard } from "@/domains/beranda/hooks/useBeranda";
import { useLaporanList } from "../hooks/useLaporan";
import { LAPORAN_TIPE_OPTIONS, isImageFile } from "../services";

const ALL = "all";
const TIPE_LABEL: Record<string, string> = {
  booklet: "Booklet",
  keuangan: "Keuangan",
  publikasi: "Publikasi",
  internal: "Internal",
};

export function LaporanPage() {
  const [search, setSearch] = useState("");
  const [tipe, setTipe] = useState<string>(ALL);
  const [periodeId, setPeriodeId] = useState<string>(ALL);

  // Tidak ada endpoint periode untuk portal donatur — fetch daftar laporan tanpa
  // filter dulu untuk menurunkan periode_id unik yang benar-benar dipakai.
  const { data: unfiltered } = useLaporanList();
  const { data: dashboard } = useMyDashboard();

  const periodeNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const h of dashboard?.history_konsistensi ?? []) m.set(h.periode_id, h.periode_nama);
    return m;
  }, [dashboard]);

  const periodeOptions = useMemo(() => {
    const ids = new Set<number>();
    for (const l of unfiltered?.items ?? []) if (l.periode_id) ids.add(l.periode_id);
    return [...ids].sort((a, b) => a - b);
  }, [unfiltered]);

  const { data, isLoading } = useLaporanList({
    search: search || undefined,
    tipe: tipe === ALL ? undefined : tipe,
    periode_id: periodeId === ALL ? undefined : Number(periodeId),
  });
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Laporan &amp; Publikasi GBB</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Cari laporan…"
            className="w-56 pl-9"
          />
        </div>
        <Select value={tipe} onValueChange={setTipe}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Tipe</SelectItem>
            {LAPORAN_TIPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {TIPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodeId} onValueChange={setPeriodeId}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Periode</SelectItem>
            {periodeOptions.map((id) => (
              <SelectItem key={id} value={String(id)}>
                {periodeNameById.get(id) ?? `Periode #${id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border py-10 text-center">
          <FileText className="size-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Tidak ada laporan ditemukan</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-10 px-3">#</TableHead>
                <TableHead className="px-3">Judul</TableHead>
                <TableHead className="px-3">Tipe</TableHead>
                <TableHead className="px-3">Periode</TableHead>
                <TableHead className="px-3">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((l, i) => (
                <TableRow key={l.id}>
                  <TableCell className="px-3 text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="px-3 font-medium">
                    <span className="flex items-center gap-2">
                      {isImageFile(l.file_url) ? (
                        <img src={l.file_url} alt="" className="size-8 shrink-0 rounded border object-cover" />
                      ) : (
                        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      {l.judul}
                    </span>
                  </TableCell>
                  <TableCell className="px-3">
                    <Badge variant="outline">{TIPE_LABEL[l.tipe] ?? l.tipe}</Badge>
                  </TableCell>
                  <TableCell className="px-3 text-muted-foreground">
                    {l.periode_id ? periodeNameById.get(l.periode_id) ?? `#${l.periode_id}` : "—"}
                  </TableCell>
                  <TableCell className="px-3">
                    <a
                      href={l.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <Download className="size-3.5" />
                      Download
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
