import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Award, FileText, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FileDropzone,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
  DateInput,
} from "@gbb/ui";
import { assetUrl } from "@/domains/beranda/services";
import type { Prestasi, PrestasiInput } from "../services";
import {
  useAddPrestasiFile,
  useCreatePrestasi,
  useDeletePrestasi,
  useDeletePrestasiFile,
  usePrestasiList,
  useUpdatePrestasi,
} from "../hooks/useRefleksi";

// Wireframe beswan §4: 🏫 studi / 🏢 organisasi / 🌐 luar kampus
const KATEGORI: Record<string, string> = {
  studi: "🏫 Studi",
  organisasi: "🏢 Organisasi",
  luar_kampus: "🌐 Luar Kampus",
};

const EMPTY: PrestasiInput = { judul: "", deskripsi: "", kategori: "studi", tanggal: "" };

function PrestasiDialog({ existing, onClose }: { existing: Prestasi | null; onClose: () => void }) {
  const create = useCreatePrestasi();
  const update = useUpdatePrestasi();
  const addFile = useAddPrestasiFile();
  const [form, setForm] = useState<PrestasiInput>(
    existing
      ? {
          judul: existing.judul,
          deskripsi: existing.deskripsi,
          kategori: existing.kategori,
          tanggal: existing.tanggal?.slice(0, 10) ?? "",
        }
      : EMPTY
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [fileTipe, setFileTipe] = useState<"sertifikat" | "foto">("sertifikat");

  const set = (patch: Partial<PrestasiInput>) => setForm((p) => ({ ...p, ...patch }));
  const busy = create.isPending || update.isPending || addFile.isPending;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (existing) {
        // Update = JSON metadata saja; file baru lewat endpoint /file terpisah
        await update.mutateAsync({ id: existing.id, input: form });
        for (const f of newFiles) {
          await addFile.mutateAsync({ id: existing.id, file: f, tipe: fileTipe });
        }
      } else {
        await create.mutateAsync({ input: form, files: newFiles });
      }
      onClose();
    } catch {
      // Pesan error sudah di-toast oleh interceptor; dialog tetap terbuka
    }
  };

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Prestasi" : "Tambah Prestasi"}</DialogTitle>
          <DialogDescription>
            Catat prestasi akademik, organisasi, maupun luar kampus.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pr-judul">Judul *</Label>
            <Input
              id="pr-judul"
              value={form.judul}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set({ judul: e.target.value })}
              required
              disabled={busy}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Kategori *</Label>
              <Select value={form.kategori} onValueChange={(v: string) => set({ kategori: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(KATEGORI).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pr-tanggal">Tanggal *</Label>
              <DateInput
                id="pr-tanggal"
                value={form.tanggal}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set({ tanggal: e.target.value })}
                required
                disabled={busy}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pr-deskripsi">Deskripsi</Label>
            <Textarea
              id="pr-deskripsi"
              rows={2}
              value={form.deskripsi}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => set({ deskripsi: e.target.value })}
              disabled={busy}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pr-files">{existing ? "Tambah File" : "File (sertifikat/foto)"}</Label>
            <div className="flex items-start gap-2">
              <FileDropzone
                id="pr-files"
                multiple
                accept="image/jpeg,image/png,application/pdf"
                value={newFiles}
                onChange={(files: File[]) => setNewFiles(files)}
                disabled={busy}
                className="flex-1"
              />
              {existing && newFiles.length > 0 && (
                <Select value={fileTipe} onValueChange={(v: string) => setFileTipe(v as "sertifikat" | "foto")}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sertifikat">Sertifikat</SelectItem>
                    <SelectItem value="foto">Foto</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Batal
            </Button>
            <Button type="submit" disabled={busy || !form.judul.trim() || !form.tanggal}>
              {busy ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ prestasi, onClose }: { prestasi: Prestasi; onClose: () => void }) {
  const del = useDeletePrestasi();
  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus Prestasi</DialogTitle>
          <DialogDescription>
            “{prestasi.judul}” beserta {prestasi.files?.length ?? 0} file lampirannya akan dihapus.
            Tindakan ini tidak bisa dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={del.isPending}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => del.mutate(prestasi, { onSuccess: onClose })}
            disabled={del.isPending}
          >
            {del.isPending ? "Menghapus…" : "Ya, Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PrestasiSection() {
  const { data, isLoading } = usePrestasiList();
  const delFile = useDeletePrestasiFile();
  const [dialog, setDialog] = useState<{ mode: "add" } | { mode: "edit"; prestasi: Prestasi } | null>(null);
  const [deleting, setDeleting] = useState<Prestasi | null>(null);

  const items = useMemo(() => data?.items ?? [], [data]);

  // Banner kuartalan diturunkan client-side: belum ada prestasi ber-tanggal di kuartal berjalan
  const showQuarterBanner = useMemo(() => {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3);
    return !items.some((p) => {
      const d = new Date(p.tanggal);
      return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === q;
    });
  }, [items]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Award className="size-5 text-primary" />
          Prestasiku
        </h2>
        <Button size="sm" onClick={() => setDialog({ mode: "add" })}>
          <Plus className="size-4" />
          Tambah Prestasi
        </Button>
      </div>

      {!isLoading && showQuarterBanner && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          🏆 Belum ada prestasi tercatat kuartal ini — sudah update prestasimu?
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Award className="size-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Belum ada prestasi tercatat</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <Card key={p.id} className="gap-2 py-4">
              <CardContent className="px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{p.judul}</span>
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        {KATEGORI[p.kategori] ?? p.kategori}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {p.tanggal
                        ? new Date(p.tanggal).toLocaleDateString("id-ID", { dateStyle: "long" })
                        : ""}
                    </div>
                    {p.deskripsi && (
                      <p className="mt-1 text-sm text-muted-foreground">{p.deskripsi}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${p.judul}`}
                      onClick={() => setDialog({ mode: "edit", prestasi: p })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Hapus ${p.judul}`}
                      onClick={() => setDeleting(p)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {(p.files?.length ?? 0) > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {(p.files ?? []).map((f) => (
                      <li key={f.id} className="flex items-center gap-1.5 text-sm">
                        <FileText className="size-3.5 text-muted-foreground" />
                        <a
                          href={assetUrl(f.file_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {f.tipe} — {f.file_url.split("/").pop()}
                        </a>
                        <button
                          type="button"
                          aria-label="Hapus file"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => delFile.mutate({ id: p.id, fileId: f.id })}
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {dialog && (
        <PrestasiDialog
          existing={dialog.mode === "edit" ? dialog.prestasi : null}
          onClose={() => setDialog(null)}
        />
      )}
      {deleting && <DeleteDialog prestasi={deleting} onClose={() => setDeleting(null)} />}
    </section>
  );
}
