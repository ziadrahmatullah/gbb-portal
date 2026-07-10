import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Mic,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { StatCard } from "@/shared/components/StatCard";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { assetUrl } from "@/domains/beswan/services";
import {
  useCreateLibrary,
  useDeleteLibrary,
  useEventOptions,
  useLibraryList,
  useLibraryStats,
  useUpdateLibrary,
} from "../hooks/useKurikulum";
import type { LibraryItem } from "../services";

const ALL_TIPE = "all";
const NO_EVENT = "none";

function UploadLibraryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMutation = useCreateLibrary();
  const { data: events } = useEventOptions();
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [tags, setTags] = useState("");
  const [eventId, setEventId] = useState(NO_EVENT);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("nama", nama);
    if (deskripsi) form.append("deskripsi", deskripsi);
    if (tags) form.append("tags", tags); // comma-separated, sesuai format data backend
    if (eventId !== NO_EVENT) form.append("event_id", eventId);
    form.append("tipe", "upload"); // form ini hanya untuk upload manual
    form.append("file", file);
    createMutation.mutate(form, {
      onSuccess: () => {
        setNama(""); setDeskripsi(""); setTags(""); setEventId(NO_EVENT); setFile(null);
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Materi</DialogTitle>
          <DialogDescription>
            Upload manual materi library. Materi dari event dibuat otomatis saat event disimpan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="l-nama">Nama materi</Label>
            <Input id="l-nama" value={nama} onChange={(e: ChangeEvent<HTMLInputElement>) => setNama(e.target.value)} required disabled={createMutation.isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="l-desc">Deskripsi (opsional)</Label>
            <Textarea id="l-desc" rows={2} value={deskripsi} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDeskripsi(e.target.value)} disabled={createMutation.isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="l-tags">Tags (opsional, pisahkan dengan koma)</Label>
            <Input id="l-tags" placeholder="mis. cv,karir" value={tags} onChange={(e: ChangeEvent<HTMLInputElement>) => setTags(e.target.value)} disabled={createMutation.isPending} />
          </div>
          <div className="space-y-1.5">
            <Label>Event terkait (opsional)</Label>
            <Select value={eventId} onValueChange={setEventId} disabled={createMutation.isPending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_EVENT}>Tanpa event</SelectItem>
                {events?.items.map((ev) => (
                  <SelectItem key={ev.id} value={String(ev.id)}>
                    {ev.nama_event}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="l-file">File (wajib — pdf/doc/xls/ppt)</Label>
            <Input id="l-file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)} required disabled={createMutation.isPending} />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={createMutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !file}>
              {createMutation.isPending ? "Mengupload…" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditLibraryDialog({ item, onClose }: { item: LibraryItem | null; onClose: () => void }) {
  const updateMutation = useUpdateLibrary();
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [tags, setTags] = useState("");
  const [prevId, setPrevId] = useState<number | null>(null);
  if (item && item.id !== prevId) {
    setPrevId(item.id);
    setNama(item.nama);
    setDeskripsi(item.deskripsi ?? "");
    setTags(item.tags ?? "");
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!item) return;
    updateMutation.mutate(
      { id: item.id, body: { nama, deskripsi, tags } },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={!!item} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Materi{item ? ` — ${item.nama}` : ""}</DialogTitle>
          {/* File & tipe tidak bisa diganti setelah dibuat (kontrak backend) */}
          <DialogDescription>File dan tipe materi tidak dapat diubah.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="le-nama">Nama materi</Label>
            <Input id="le-nama" value={nama} onChange={(e: ChangeEvent<HTMLInputElement>) => setNama(e.target.value)} required disabled={updateMutation.isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="le-desc">Deskripsi</Label>
            <Textarea id="le-desc" rows={2} value={deskripsi} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDeskripsi(e.target.value)} disabled={updateMutation.isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="le-tags">Tags (pisahkan dengan koma)</Label>
            <Input id="le-tags" value={tags} onChange={(e: ChangeEvent<HTMLInputElement>) => setTags(e.target.value)} disabled={updateMutation.isPending} />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LibraryCard({
  item,
  onEdit,
  onDelete,
}: {
  item: LibraryItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const TipeIcon = item.tipe === "event_materi" ? Mic : Upload;
  const tags = (item.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <TipeIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{item.nama}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {item.tipe === "event_materi" ? "Dari event" : "Upload manual"}
            </div>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            title="Edit"
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            title="Hapus"
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {item.deskripsi && <p className="text-sm text-muted-foreground line-clamp-2">{item.deskripsi}</p>}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      )}
      {/* ai_summary = hasil AI backend, read-only */}
      <div className="flex items-start gap-1.5 text-xs">
        <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
        {item.ai_summary ? (
          <span className="italic line-clamp-2">AI: “{item.ai_summary}”</span>
        ) : (
          <span className="text-muted-foreground">Belum ada ringkasan AI</span>
        )}
      </div>
      <a
        href={assetUrl(item.file_url)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-auto"
      >
        <FileDown className="h-4 w-4" />
        Download
      </a>
    </div>
  );
}

export function LibraryTab() {
  const [search, setSearch] = useState("");
  const [tipe, setTipe] = useState(ALL_TIPE);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryItem | null>(null);
  const [deleting, setDeleting] = useState<LibraryItem | null>(null);

  const { data: stats, isLoading: statsLoading } = useLibraryStats();
  const { data, isLoading } = useLibraryList({
    page,
    limit,
    search: search || undefined,
    tipe: tipe === ALL_TIPE ? undefined : tipe,
  });
  const deleteMutation = useDeleteLibrary();

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={BookOpen} label="Total Materi" value={String(stats?.total ?? "—")} loading={statsLoading} />
        <StatCard icon={Mic} label="Dari Event" value={String(stats?.dariEvent ?? "—")} loading={statsLoading} />
        <StatCard icon={Upload} label="Upload Manual" value={String(stats?.uploadManual ?? "—")} loading={statsLoading} />
      </div>

      {/* Filter + upload */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari materi…"
            className="pl-9 w-64"
          />
        </div>
        <Select
          value={tipe}
          onValueChange={(v: string) => {
            setTipe(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TIPE}>Semua Tipe</SelectItem>
            <SelectItem value="event_materi">Dari Event</SelectItem>
            <SelectItem value="upload">Upload Manual</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Tidak ada materi ditemukan</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <LibraryCard
              key={item.id}
              item={item}
              onEdit={() => setEditing(item)}
              onDelete={() => setDeleting(item)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>
              Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, totalItems)} dari {totalItems}
            </span>
            <Select
              value={String(limit)}
              onValueChange={(v: string) => {
                setLimit(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[12, 24, 48].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              Hal {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <UploadLibraryDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <EditLibraryDialog item={editing} onClose={() => setEditing(null)} />

      {/* Dialog konfirmasi hapus */}
      <Dialog open={!!deleting} onOpenChange={(o: boolean) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Materi</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus materi <strong>{deleting?.nama}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
            >
              {deleteMutation.isPending ? "Menghapus…" : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
