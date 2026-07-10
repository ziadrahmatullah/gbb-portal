import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileDown,
  Hourglass,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { StatCard } from "@/shared/components/StatCard";
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
import { useEventList } from "@/domains/event/hooks/useEvent";
import { useDeletePenugasan, usePenugasanList, usePenugasanStats } from "../hooks/usePenugasan";
import type { Penugasan } from "../services";
import { CreatePenugasanDialog, EditPenugasanDialog } from "./PenugasanFormDialogs";
import { HasilDetailPanel } from "./HasilDetailPanel";

const ALL = "all";

const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export function PenugasanPage() {
  const role = useAuthStore((s) => s.role);
  // Backend enforce RequireRole("admin","pcm") untuk mutasi & nilai
  const canManage = role === "admin" || role === "pcm";

  const periodeId = usePeriodeFilter((s) => s.periodeId) ?? undefined;
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Penugasan | null>(null);
  const [deleting, setDeleting] = useState<Penugasan | null>(null);

  const { data: stats, isLoading: statsLoading } = usePenugasanStats(periodeId);
  const { data, isLoading } = usePenugasanList({
    page,
    limit,
    periode_id: periodeId,
    event_id: eventFilter === ALL ? undefined : eventFilter,
    search: search || undefined,
  });
  const deleteMutation = useDeletePenugasan();

  // Peta nama event untuk kolom "Event" + filter (dibatasi 100 event terbaru)
  const { data: eventOptions } = useEventList({ limit: 100, periode_id: periodeId });
  const eventMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const ev of eventOptions?.items ?? []) m.set(ev.id, ev.kode_event);
    return m;
  }, [eventOptions]);
  const eventLabel = (p: Penugasan) =>
    p.event_id ? eventMap.get(p.event_id) ?? `EVT #${p.event_id}` : "non-event";

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;
  const selected = items.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Penugasan</h1>
        {canManage && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Penugasan
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={ClipboardList} label="Total Tugas" value={String(stats?.total ?? "—")} loading={statsLoading} />
        <StatCard icon={CheckCircle2} label="Submitted" value={String(stats?.submitted ?? "—")} loading={statsLoading} />
        <StatCard icon={Hourglass} label="Belum Kumpul" value={String(stats?.belumKumpul ?? "—")} loading={statsLoading} />
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
            placeholder="Cari tugas…"
            className="pl-9 w-64"
          />
        </div>
        <Select
          value={eventFilter}
          onValueChange={(v: string) => {
            setEventFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Event</SelectItem>
            {eventOptions?.items.map((ev) => (
              <SelectItem key={ev.id} value={String(ev.id)}>
                {ev.kode_event} · {ev.nama_event}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* MASTER: daftar tugas */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Kode</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead className="w-32">Event</TableHead>
              <TableHead className="w-36">Deadline</TableHead>
              <TableHead className="w-24">Kumpul</TableHead>
              {canManage && <TableHead className="w-24 text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={canManage ? 6 : 5}>
                    <div className="h-6 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada penugasan ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                <TableRow
                  key={p.id}
                  onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                  className={cn("cursor-pointer", p.id === selectedId && "bg-accent/60")}
                >
                  <TableCell className="font-mono text-xs">{p.kode_penugasan}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.judul}</span>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          p.status === "aktif"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {p.status}
                      </span>
                      {p.lampiran_url && (
                        <a
                          href={p.lampiran_url}
                          target="_blank"
                          rel="noreferrer"
                          title="Lampiran soal"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:opacity-75"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{eventLabel(p)}</TableCell>
                  <TableCell className="text-sm">{formatDeadline(p.deadline)}</TableCell>
                  <TableCell className="text-sm">
                    {p.terkumpul_count}/{p.total_beswan}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(p);
                          }}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Hapus"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleting(p);
                          }}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  )}
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

      {/* DETAIL: hasil per beswan untuk tugas terpilih */}
      {selected ? (
        <HasilDetailPanel penugasan={selected} eventLabel={eventLabel(selected)} canManage={canManage} />
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          Klik salah satu tugas untuk melihat hasil per beswan.
        </p>
      )}

      {/* Dialogs (mount kondisional = state selalu segar) */}
      {createOpen && <CreatePenugasanDialog onClose={() => setCreateOpen(false)} />}
      {editing && <EditPenugasanDialog penugasan={editing} onClose={() => setEditing(null)} />}

      <Dialog open={!!deleting} onOpenChange={(o: boolean) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Penugasan</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus <strong>{deleting?.kode_penugasan} — {deleting?.judul}</strong>?
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
                deleting &&
                deleteMutation.mutate(deleting.id, {
                  onSuccess: () => {
                    if (selectedId === deleting.id) setSelectedId(null);
                    setDeleting(null);
                  },
                })
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
