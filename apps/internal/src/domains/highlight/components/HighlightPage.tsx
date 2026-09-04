import { useState } from "react";
import { ExternalLink, ImageOff, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Badge, Skeleton } from "@gbb/ui";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { hasAnyRole } from "@/shared/constants/roles";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useDeleteHighlight, useHighlightList, useUpdateHighlight } from "../hooks/useHighlight";
import { highlightImageUrl, kategoriLabel, tanggalLabel } from "../services";
import type { HighlightPost } from "../services";
import { HighlightFormDialog } from "./HighlightDialogs";

function HighlightCard({
  post,
  canMutate,
  onEdit,
  onDelete,
}: {
  post: HighlightPost;
  canMutate: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const updateMutation = useUpdateHighlight();
  const img = highlightImageUrl(post.gambar_url);

  // Toggle aktif langsung dari kartu — cukup kirim field aktif (PUT partial)
  const toggleAktif = (v: boolean) => {
    const form = new FormData();
    form.append("aktif", String(v));
    updateMutation.mutate({ id: post.id, form });
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-card transition-opacity",
        !post.aktif && "opacity-60"
      )}
    >
      {img ? (
        <img src={img} alt={post.judul} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-muted text-muted-foreground">
          <ImageOff className="h-8 w-8" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            {(post.kategori || post.tanggal) && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {post.kategori && (
                  <Badge variant="secondary" className="font-normal">
                    {kategoriLabel(post.kategori)}
                  </Badge>
                )}
                {post.tanggal && <span className="text-muted-foreground">{tanggalLabel(post.tanggal)}</span>}
              </div>
            )}
            <div className="font-medium leading-tight line-clamp-2">{post.judul}</div>
            {post.link_ig ? (
              <a
                href={post.link_ig}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Lihat di IG
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">Tanpa tautan IG</span>
            )}
          </div>
          <Badge variant="outline" className="shrink-0 font-mono text-xs">
            #{post.urutan}
          </Badge>
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Switch
              checked={post.aktif}
              onCheckedChange={toggleAktif}
              disabled={!canMutate || updateMutation.isPending}
            />
            {post.aktif ? "Tampil" : "Disembunyikan"}
          </label>
          {canMutate && (
            <div className="flex gap-1">
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
          )}
        </div>
      </div>
    </div>
  );
}

export function HighlightPage() {
  const role = useAuthStore((s) => s.role);
  // Backend: POST/PUT/DELETE /internal/highlight → RequireRole("admin","pcm")
  const canMutate = hasAnyRole(role, ["admin", "pcm"]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HighlightPost | null>(null);
  const [deleting, setDeleting] = useState<HighlightPost | null>(null);

  const { data, isLoading } = useHighlightList({ limit: 50 });
  const deleteMutation = useDeleteHighlight();

  // Backend mengurutkan by urutan; sort ulang di sini hanya jaga-jaga
  const items = [...(data?.items ?? [])].sort((a, b) => a.urutan - b.urutan);
  const aktifCount = items.filter((p) => p.aktif).length;
  const nextUrutan = items.reduce((m, p) => Math.max(m, p.urutan), 0) + 1;

  return (
    <div className="space-y-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Highlight GBB</h1>
          <p className="text-muted-foreground">
            Poster/infografis publikasi terbaru (Recap, Kisah Inspiratif, Oprec) yang tampil di
            Beranda Portal Donatur.
          </p>
        </div>
        {canMutate && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Highlight
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        {isLoading ? (
          <Skeleton className="h-4 w-48" />
        ) : (
          <span>
            {aktifCount} dari {items.length} highlight tampil di portal donatur — urut sesuai
            nomor, yang disembunyikan tetap tersimpan.
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Belum ada highlight</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Bagian &quot;Highlight GBB&quot; di beranda donatur masih kosong. Upload poster yang
            sama dengan post Instagram terbaru untuk mengisinya.
          </p>
          {canMutate && (
            <Button size="sm" className="mt-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Highlight pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <HighlightCard
              key={p.id}
              post={p}
              canMutate={canMutate}
              onEdit={() => {
                setEditing(p);
                setFormOpen(true);
              }}
              onDelete={() => setDeleting(p)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <HighlightFormDialog
          editing={editing}
          nextUrutan={nextUrutan}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}

      <Dialog open={!!deleting} onOpenChange={(o: boolean) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Highlight</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus <strong>{deleting?.judul}</strong>? Kartu ini akan hilang
              dari beranda donatur. Kalau hanya ingin menyembunyikan sementara, matikan switch
              &quot;Tampil&quot; saja.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
