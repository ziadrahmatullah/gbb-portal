import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { usePeriodeOptions } from "@/domains/periode/hooks/usePeriode";
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
import {
  useCreateTopik,
  useDeleteTopik,
  useTopikList,
  useTopikUsulanList,
  useUpdateTopik,
  useUpdateTopikUsulanStatus,
} from "../hooks/useKurikulum";
import type { Topik } from "../services";

const ALL_STATUS = "all";

const STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  ongoing: "Ongoing",
  done: "Done",
};

function TopikStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "done" && "bg-primary/10 text-primary",
        status === "ongoing" && "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
        status === "planned" && "bg-muted text-muted-foreground"
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

interface TopikFormState {
  periode_id: string;
  urutan: string;
  judul: string;
  detail: string;
  tor_url: string;
  status: "planned" | "ongoing" | "done";
}

function TopikFormDialog({
  open,
  editing,
  defaultPeriodeId,
  onClose,
}: {
  open: boolean;
  editing: Topik | null;
  defaultPeriodeId?: string;
  onClose: () => void;
}) {
  const { data: periodeOptions } = usePeriodeOptions();
  const createMutation = useCreateTopik();
  const updateMutation = useUpdateTopik();
  const saving = createMutation.isPending || updateMutation.isPending;

  const emptyForm: TopikFormState = {
    periode_id: defaultPeriodeId ?? "",
    urutan: "",
    judul: "",
    detail: "",
    tor_url: "",
    status: "planned",
  };
  const [form, setForm] = useState<TopikFormState>(emptyForm);
  // Prefill saat target edit / default periode berubah (adjust-during-render)
  const [prevKey, setPrevKey] = useState("");
  const key = editing ? `edit-${editing.id}` : `create-${open}-${defaultPeriodeId ?? ""}`;
  if (open && key !== prevKey) {
    setPrevKey(key);
    setForm(
      editing
        ? {
            periode_id: String(editing.periode_id),
            urutan: String(editing.urutan),
            judul: editing.judul,
            detail: editing.detail ?? "",
            tor_url: editing.tor_url ?? "",
            status: (editing.status as TopikFormState["status"]) ?? "planned",
          }
        : emptyForm
    );
  }

  const set = <K extends keyof TopikFormState>(k: K, v: TopikFormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate(
        {
          id: editing.id,
          body: {
            urutan: Number(form.urutan),
            judul: form.judul,
            detail: form.detail,
            tor_url: form.tor_url,
            status: form.status,
          },
        },
        { onSuccess: onClose }
      );
    } else {
      if (!form.periode_id) return;
      createMutation.mutate(
        {
          periode_id: Number(form.periode_id),
          urutan: Number(form.urutan),
          judul: form.judul,
          detail: form.detail || undefined,
          tor_url: form.tor_url || undefined,
        },
        { onSuccess: onClose }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit Topik — ${editing.judul}` : "Tambah Topik"}</DialogTitle>
          <DialogDescription>
            {editing ? "Ubah topik kurikulum." : "Tambahkan topik kurikulum ke sebuah periode."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!editing && (
            <div className="space-y-1.5">
              <Label>Periode</Label>
              <Select
                value={form.periode_id}
                onValueChange={(v: string) => set("periode_id", v)}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  {periodeOptions?.items.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="t-urutan">Urutan</Label>
            <Input
              id="t-urutan"
              type="number"
              min={1}
              value={form.urutan}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set("urutan", e.target.value)}
              required
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-judul">Judul topik</Label>
            <Input
              id="t-judul"
              value={form.judul}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set("judul", e.target.value)}
              required
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-detail">Detail (opsional)</Label>
            <Textarea
              id="t-detail"
              value={form.detail}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => set("detail", e.target.value)}
              rows={2}
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            {/* Backend tidak punya endpoint upload file TOR — field ini string URL biasa */}
            <Label htmlFor="t-tor">URL TOR (link dokumen, opsional)</Label>
            <Input
              id="t-tor"
              type="url"
              placeholder="https://…"
              value={form.tor_url}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set("tor_url", e.target.value)}
              disabled={saving}
            />
          </div>
          {editing && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v: TopikFormState["status"]) => set("status", v)}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving || (!editing && !form.periode_id)}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TopikUsulanSection() {
  const { data, isLoading } = useTopikUsulanList({ limit: 20 });
  const updateStatus = useUpdateTopikUsulanStatus();
  const items = data?.items ?? [];
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Usulan Topik dari Beswan</h3>
      <p className="text-xs text-muted-foreground">
        Usulan dikirim beswan dari portalnya — tandai sudah ditinjau setelah dipertimbangkan.
      </p>
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usulan</TableHead>
              <TableHead className="w-40">Beswan</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="h-5 animate-pulse rounded bg-muted" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                  Belum ada usulan topik
                </TableCell>
              </TableRow>
            ) : (
              items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.topik_usulan}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.nama_beswan}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        u.status === "reviewed"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {u.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.status === "pending" && (
                      <button
                        title="Tandai sudah ditinjau"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: u.id, status: "reviewed" })}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function TopikTab() {
  const periodeId = usePeriodeFilter((s) => s.periodeId) ?? undefined;
  const { data: periodeOptions } = usePeriodeOptions();
  const selectedPeriode = periodeId
    ? periodeOptions?.items.find((p) => String(p.id) === periodeId)
    : undefined;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL_STATUS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Topik | null>(null);
  const [deleting, setDeleting] = useState<Topik | null>(null);

  const { data, isLoading } = useTopikList({
    page,
    limit,
    periode_id: periodeId,
    search: search || undefined,
    status: status === ALL_STATUS ? undefined : status,
  });
  const deleteMutation = useDeleteTopik();

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="space-y-4">
      {/* Info periode terpilih (filter global sidebar) + tombol tambah */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {selectedPeriode ? (
            <>
              Periode: <span className="font-medium text-foreground">{selectedPeriode.nama}</span>
              {selectedPeriode.goal && <> — Goal: “{selectedPeriode.goal}”</>}
            </>
          ) : (
            "Semua Periode (atur lewat Filter Periode di sidebar)"
          )}
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Topik
        </Button>
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
            placeholder="Cari topik…"
            className="pl-9 w-64"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v: string) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS}>Semua Status</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabel */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Topik</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead className="w-20">TOR</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-20">Media</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <div className="h-5 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada topik ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.urutan}</TableCell>
                  <TableCell className="font-medium">{t.judul}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-72 truncate">
                    {t.detail || "—"}
                  </TableCell>
                  <TableCell>
                    {t.tor_url ? (
                      <a
                        href={t.tor_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        TOR
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <TopikStatusBadge status={t.status} />
                  </TableCell>
                  {/* Media (YouTube/Slide) dari event ber-topik_id, di-embed backend */}
                  <TableCell>
                    {!t.youtube_url && !t.slide_url ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {t.youtube_url && (
                          <a
                            href={t.youtube_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Rekaman YouTube"
                            className="text-primary hover:opacity-75"
                          >
                            <Youtube className="h-4 w-4" />
                          </a>
                        )}
                        {t.slide_url && (
                          <a
                            href={t.slide_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Slide/materi"
                            className="text-primary hover:opacity-75"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        title="Edit"
                        onClick={() => { setEditing(t); setFormOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        title="Hapus"
                        onClick={() => setDeleting(t)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                  {[10, 25, 50].map((n) => (
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
      </div>

      <TopikUsulanSection />

      <TopikFormDialog
        open={formOpen}
        editing={editing}
        defaultPeriodeId={periodeId}
        onClose={() => { setFormOpen(false); setEditing(null); }}
      />

      {/* Dialog konfirmasi hapus */}
      <Dialog open={!!deleting} onOpenChange={(o: boolean) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Topik</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus topik <strong>{deleting?.judul}</strong>?
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
