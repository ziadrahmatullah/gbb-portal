import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Download, FileText, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input } from "@gbb/ui";
import { useMyDashboard } from "@/domains/beranda/hooks/useBeranda";
import { useLaporanList } from "../hooks/useLaporan";
import { LAPORAN_TIPE_OPTIONS } from "../services";

const ALL = "all";
const TIPE_LABEL: Record<string, string> = {
  booklet: "Booklet",
  keuangan: "Keuangan",
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
      <h1 className="text-2xl font-bold">Laporan GBB</h1>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Cari laporan…"
            className="pl-9 w-56"
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
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center rounded-xl border border-dashed">
          Tidak ada laporan ditemukan
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-2 px-3 text-left font-medium w-10">#</th>
                <th className="py-2 px-3 text-left font-medium">Judul</th>
                <th className="py-2 px-3 text-left font-medium">Tipe</th>
                <th className="py-2 px-3 text-left font-medium">Periode</th>
                <th className="py-2 px-3 text-left font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l, i) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 px-3 font-medium flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {l.judul}
                  </td>
                  <td className="py-2 px-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {TIPE_LABEL[l.tipe] ?? l.tipe}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {l.periode_id ? periodeNameById.get(l.periode_id) ?? `#${l.periode_id}` : "—"}
                  </td>
                  <td className="py-2 px-3">
                    <a
                      href={l.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
