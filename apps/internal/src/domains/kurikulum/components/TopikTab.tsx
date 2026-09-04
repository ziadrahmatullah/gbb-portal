import { useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FileDropzone,
  Skeleton,
} from "@gbb/ui";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { hasAnyRole } from "@/shared/constants/roles";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { PeriodeFilterSelect } from "@/shared/components/PeriodeFilterSelect";
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
  useCopyTopik,
  useCreateTopik,
  useDeleteTopik,
  useTopikList,
  useUpdateTopik,
} from "../hooks/useKurikulum";
import type { Topik } from "../services";

const ALL_STATUS = "all";

const STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  ongoing: "Ongoing",
  done: "Done",
};

export function TopikStatusBadge({ status }: { status: string }) {
  if (status === "done") {
    return <Badge>{STATUS_LABEL[status]}</Badge>;
  }
  if (status === "ongoing") {
    return (
      <Badge variant="outline" className="border-yellow-500/40 text-yellow-700 dark:text-yellow-400">
        {STATUS_LABEL[status]}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

const STATUS_ORDER = ["planned", "ongoing", "done"] as const;
type TopikStatus = (typeof STATUS_ORDER)[number];

// Kontrol status: badge status AKTIF + menu pilihan. Menggantikan slider 3
// segmen yang labelnya tumpang-tindih di kolom sempit (masukan PCM Sep 2026,
// sama seperti Request Mentor). Pilih status lain → langsung PUT.
function TopikStatusMenu({
  status,
  disabled,
  onChange,
}: {
  status: string;
  disabled?: boolean;
  onChange: (status: TopikStatus) => void;
}) {
  return (
    // Row-nya klik-able ke halaman detail — klik pada trigger maupun item menu
    // (portal Radix tetap bubbling di pohon React) jangan ikut membuka detail
    <div className="inline-flex" onClick={(e: MouseEvent) => e.stopPropagation()}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            title="Ubah status topik"
            className="inline-flex items-center gap-1 rounded-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            <TopikStatusBadge status={status} />
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-36">
          {STATUS_ORDER.map((s) => (
            <DropdownMenuItem
              key={s}
              onSelect={() => s !== status && onChange(s)}
              className="justify-between"
            >
              {STATUS_LABEL[s]}
              {s === status && <Check className="size-3.5" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface TopikFormState {
  periode_id: string;
  urutan: string;
  judul: string;
  detail: string;
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
    status: "planned",
  };
  const [form, setForm] = useState<TopikFormState>(emptyForm);
  // File TOR dipilih user (null = tidak mengganti TOR yang ada)
  const [tor, setTor] = useState<File | null>(null);
  // Prefill saat target edit / default periode berubah (adjust-during-render)
  const [prevKey, setPrevKey] = useState("");
  const key = editing ? `edit-${editing.id}` : `create-${open}-${defaultPeriodeId ?? ""}`;
  if (open && key !== prevKey) {
    setPrevKey(key);
    setTor(null);
    setForm(
      editing
        ? {
            periode_id: String(editing.periode_id),
            urutan: String(editing.urutan),
            judul: editing.judul,
            detail: editing.detail ?? "",
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
            status: form.status,
            tor: tor ?? undefined,
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
          tor: tor ?? undefined,
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
        <form onSubmit={handleSubmit} className="grid gap-4">
          {!editing && (
            <div className="grid gap-2">
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
          <div className="grid gap-2">
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
          <div className="grid gap-2">
            <Label htmlFor="t-judul">Judul topik</Label>
            <Input
              id="t-judul"
              value={form.judul}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set("judul", e.target.value)}
              required
              disabled={saving}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-detail">Detail (opsional)</Label>
            <Textarea
              id="t-detail"
              value={form.detail}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => set("detail", e.target.value)}
              rows={2}
              disabled={saving}
            />
          </div>
          <div className="grid gap-2">
            {/* TOR di-upload ke storage backend (field multipart "tor");
                kosong = TOR yang ada tidak berubah */}
            <Label htmlFor="t-tor">TOR (Terms of Reference)</Label>
            <FileDropzone
              id="t-tor"
              accept=".pdf,.doc,.docx"
              value={tor}
              onChange={(f: File | null) => setTor(f)}
              disabled={saving}
            />
            {editing?.tor_url && (
              <p className="text-xs text-muted-foreground">
                <a
                  href={editing.tor_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  Lihat TOR saat ini
                </a>{" "}
                — memilih file baru akan menggantikannya.
              </p>
            )}
          </div>
          {editing && (
            <div className="grid gap-2">
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
          <DialogFooter className="pt-2">
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

function CopyTopikDialog({
  open,
  defaultSourceId,
  onClose,
}: {
  open: boolean;
  defaultSourceId?: string;
  onClose: () => void;
}) {
  const { data: periodeOptions } = usePeriodeOptions();
  const copyMutation = useCopyTopik();
  const saving = copyMutation.isPending;

  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  // Prefill source dari filter periode aktif saat dialog dibuka (adjust-during-render)
  const [prevKey, setPrevKey] = useState("");
  const key = `${open}-${defaultSourceId ?? ""}`;
  if (open && key !== prevKey) {
    setPrevKey(key);
    setSourceId(defaultSourceId ?? "");
    setTargetId("");
  }

  // reset() membersihkan pesan error inline supaya tidak nyangkut
  // di percobaan berikutnya / saat dialog dibuka ulang
  const handleClose = () => {
    copyMutation.reset();
    onClose();
  };
  const pick = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    copyMutation.reset();
  };

  const samePeriode = Boolean(sourceId) && sourceId === targetId;
  const canSubmit = Boolean(sourceId) && Boolean(targetId) && !samePeriode;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    copyMutation.mutate(
      { sourcePeriodeId: Number(sourceId), targetPeriodeId: Number(targetId) },
      { onSuccess: handleClose }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Copy Topik Antar Periode</DialogTitle>
          <DialogDescription>
            Semua topik periode sumber disalin ke periode tujuan — urutan dipertahankan,
            status di-reset ke Planned, dan ditempatkan setelah topik yang sudah ada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Salin dari periode</Label>
            <Select value={sourceId} onValueChange={pick(setSourceId)} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih periode sumber" />
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
          <div className="grid gap-2">
            <Label>Ke periode</Label>
            <Select value={targetId} onValueChange={pick(setTargetId)} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih periode tujuan" />
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
          {samePeriode && (
            <p className="text-sm text-destructive">Periode sumber dan tujuan tidak boleh sama.</p>
          )}
          {/* Pesan 400/404 backend (mis. "periode sumber tidak memiliki topik") */}
          {copyMutation.error && (
            <p className="text-sm text-destructive">{copyMutation.error.message}</p>
          )}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving || !canSubmit}>
              {saving ? "Menyalin…" : "Salin Topik"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TopikTab() {
  const navigate = useNavigate();
  const periodeId = usePeriodeFilter((s) => s.periodeId) ?? undefined;
  // Endpoint copy dibatasi backend ke admin/pcm — sembunyikan tombolnya untuk role lain
  const role = useAuthStore((s) => s.role);
  const canCopy = hasAnyRole(role, ["admin", "pcm"]);
  const { data: periodeOptions } = usePeriodeOptions();
  const selectedPeriode = periodeId
    ? periodeOptions?.items.find((p) => String(p.id) === periodeId)
    : undefined;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL_STATUS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
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
  // Untuk slider status di tabel — kirim hanya field status (multipart),
  // field lain tidak berubah di backend
  const statusMutation = useUpdateTopik();

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="space-y-4">
      {/* Goal periode terpilih (kalau ada) + tombol tambah. Filter batch-nya
          sendiri ada di toolbar bawah — dulu cuma teks "atur lewat sidebar" dan
          tim tidak menemukannya. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground min-h-5">
          {selectedPeriode?.goal && (
            <>
              Goal <span className="font-medium text-foreground">{selectedPeriode.nama}</span>:{" "}
              “{selectedPeriode.goal}”
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canCopy && (
            <Button size="sm" variant="outline" onClick={() => setCopyOpen(true)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Topik
            </Button>
          )}
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Topik
          </Button>
        </div>
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
        <PeriodeFilterSelect onChange={() => setPage(1)} />
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
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Periode</TableHead>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Topik</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead className="w-20">TOR</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-5 w-full" />
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
                // Row klik-able ke halaman detail (media per event ada di sana);
                // kontrol di dalam row wajib stopPropagation
                <TableRow
                  key={t.id}
                  onClick={() => navigate(`/panel/kurikulum/topik/${t.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell className="text-sm text-muted-foreground">{t.periode_nama}</TableCell>
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
                        onClick={(e: MouseEvent) => e.stopPropagation()}
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
                    <TopikStatusMenu
                      status={t.status}
                      disabled={statusMutation.isPending}
                      onChange={(status) => statusMutation.mutate({ id: t.id, body: { status } })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        title="Edit"
                        onClick={(e: MouseEvent) => {
                          e.stopPropagation();
                          setEditing(t);
                          setFormOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        title="Hapus"
                        onClick={(e: MouseEvent) => {
                          e.stopPropagation();
                          setDeleting(t);
                        }}
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

      <TopikFormDialog
        open={formOpen}
        editing={editing}
        defaultPeriodeId={periodeId}
        onClose={() => { setFormOpen(false); setEditing(null); }}
      />

      <CopyTopikDialog
        open={copyOpen}
        defaultSourceId={periodeId}
        onClose={() => setCopyOpen(false)}
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
          <DialogFooter>
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
