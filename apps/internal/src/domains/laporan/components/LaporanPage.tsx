import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  Pencil,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { usePeriodeOptions } from "@/domains/periode/hooks/usePeriode";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useDeleteLaporan, useLaporanList, useLaporanTipeOptions } from "../hooks/useLaporan";
import type { Laporan } from "../services";
import { EditLaporanDialog, UploadLaporanDialog } from "./LaporanDialogs";

const ALL = "all";

export function LaporanPage() {
  const role = useAuthStore((s) => s.role);
  const canMutate = role === "admin" || role === "pcm";

  const [search, setSearch] = useState("");
  const [tipe, setTipe] = useState(ALL);
  const [periodeId, setPeriodeId] = useState(ALL);
  const [publicOnly, setPublicOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<Laporan | null>(null);
  const [deleting, setDeleting] = useState<Laporan | null>(null);

  const { data: tipeOptions } = useLaporanTipeOptions();
  const { data: periodeOptions } = usePeriodeOptions();
  const { data, isLoading } = useLaporanList({
    page,
    limit,
    search: search || undefined,
    tipe: tipe === ALL ? undefined : tipe,
    periode_id: periodeId === ALL ? undefined : periodeId,
    is_public: publicOnly ? "true" : undefined,
  });
  const deleteMutation = useDeleteLaporan();

  const periodeMap = useMemo(
    () => new Map((periodeOptions?.items ?? []).map((p) => [p.id, p.nama])),
    [periodeOptions]
  );

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Laporan &amp; Booklet</h1>
        {canMutate && (
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari judul…"
            className="pl-9 w-64"
          />
        </div>
        <Select value={tipe} onValueChange={(v: string) => { setTipe(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Tipe</SelectItem>
            {(tipeOptions ?? []).map((t) => (
              <SelectItem key={t} value={t} className="capitalize">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodeId} onValueChange={(v: string) => { setPeriodeId(v); setPage(1); }}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Periode</SelectItem>
            {periodeOptions?.items.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={publicOnly}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setPublicOnly(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 accent-primary"
          />
          Public Only
        </label>
      </div>

      {/* Tabel */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead className="w-32">Tipe</TableHead>
              <TableHead className="w-40">Periode</TableHead>
              <TableHead className="w-20">Public</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-6 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada laporan ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((l, idx) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs">{(page - 1) * limit + idx + 1}</TableCell>
                  <TableCell className="font-medium">{l.judul}</TableCell>
                  <TableCell className="text-sm capitalize">{l.tipe}</TableCell>
                  <TableCell className="text-sm">{l.periode_id ? periodeMap.get(l.periode_id) ?? `#${l.periode_id}` : "—"}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        l.is_public ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {l.is_public ? "✅" : "❌"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <a
                        href={l.file_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Download"
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <FileDown className="h-4 w-4" />
                      </a>
                      {canMutate && (
                        <>
                          <button
                            title="Edit"
                            onClick={() => setEditing(l)}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title="Hapus"
                            onClick={() => setDeleting(l)}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>
                Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, totalItems)} dari {totalItems}
              </span>
              <Select value={String(limit)} onValueChange={(v: string) => { setLimit(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Hal {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {uploadOpen && <UploadLaporanDialog onClose={() => setUploadOpen(false)} />}
      {editing && <EditLaporanDialog laporan={editing} onClose={() => setEditing(null)} />}

      <Dialog open={!!deleting} onOpenChange={(o: boolean) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Laporan</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus <strong>{deleting?.judul}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
              }
            >
              {deleteMutation.isPending ? "Menghapus…" : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
