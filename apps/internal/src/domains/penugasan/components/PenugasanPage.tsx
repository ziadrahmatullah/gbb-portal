import { useMemo, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  FileDown,
  Hourglass,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Badge, SearchableSelect, Skeleton } from "@gbb/ui";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { PeriodeFilterSelect } from "@/shared/components/PeriodeFilterSelect";
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
import { useBeswanList, useBeswanPenugasan } from "@/domains/beswan/hooks/useBeswan";
import type { BeswanPenugasanItem } from "@/domains/beswan/services";
import { useDeletePenugasan, usePenugasanList, usePenugasanStats } from "../hooks/usePenugasan";
import type { Penugasan } from "../services";
import { CreatePenugasanDialog, EditPenugasanDialog } from "./PenugasanFormDialogs";

const ALL = "all";

const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

// Kolom "Kumpul" saat filter beswan aktif: status pengumpulan beswan itu untuk
// tugas ini. `hasil_status` null = belum kumpul (state virtual, tidak ada baris).
function HasilBadge({ item }: { item: BeswanPenugasanItem }) {
  if (!item.hasil_status) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Belum kumpul
      </Badge>
    );
  }
  const graded = item.hasil_status === "graded";
  return (
    <div className="flex items-center gap-1.5">
      <Badge
        variant="outline"
        className={cn(
          graded
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-primary/30 bg-primary/10 text-primary"
        )}
      >
        {graded ? `Dinilai · ${item.nilai ?? "—"}` : "Submitted"}
      </Badge>
      {item.terlambat && (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
          Terlambat
        </Badge>
      )}
    </div>
  );
}

export function PenugasanPage() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  // Backend enforce RequireRole("admin","pcm") untuk mutasi & nilai
  const canManage = role === "admin" || role === "pcm";

  const periodeId = usePeriodeFilter((s) => s.periodeId) ?? undefined;
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState(ALL);
  // Filter nama beswan (masukan tim program): saat dipilih, daftar berubah jadi
  // tugas-tugas beswan itu + status pengumpulannya, via endpoint
  // GET /internal/beswan/:id/penugasan yang sudah ada — tanpa perubahan BE.
  const [beswanFilter, setBeswanFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Penugasan | null>(null);
  const [deleting, setDeleting] = useState<Penugasan | null>(null);

  const beswanMode = beswanFilter !== ALL;

  const { data: stats, isLoading: statsLoading } = usePenugasanStats(periodeId);
  const listQuery = usePenugasanList({
    page,
    limit,
    periode_id: periodeId,
    event_id: eventFilter === ALL ? undefined : eventFilter,
    search: search || undefined,
  });
  // NaN saat tidak dipilih → hook-nya disabled (enabled: Number.isFinite)
  const beswanQuery = useBeswanPenugasan(beswanMode ? Number(beswanFilter) : NaN, {
    page,
    limit,
    periode_id: periodeId,
  });
  const { data, isLoading } = beswanMode ? beswanQuery : listQuery;
  const deleteMutation = useDeletePenugasan();

  // Opsi beswan untuk filter — beswan aktif di periode terpilih (maks 100)
  const { data: beswanOptions } = useBeswanList({ limit: 100, periode_id: periodeId, status: "aktif" });
  const beswanChoices = useMemo(
    () => (beswanOptions?.items ?? []).map((b) => ({ id: String(b.id), name: `${b.nama_lengkap} · ${b.nim}` })),
    [beswanOptions]
  );
  const selectedBeswan = beswanChoices.find((b) => b.id === beswanFilter);

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Penugasan</h1>
          <p className="text-muted-foreground">Kelola tugas beswan dan pantau pengumpulan.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Penugasan
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
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
            disabled={beswanMode}
            title={beswanMode ? "Pencarian tidak berlaku saat filter beswan aktif" : undefined}
          />
        </div>
        <PeriodeFilterSelect
          onChange={() => {
            setPage(1);
            // Daftar beswan ikut periode — pilihan lama bisa tidak relevan lagi
            setBeswanFilter(ALL);
          }}
        />
        <Select
          value={eventFilter}
          onValueChange={(v: string) => {
            setEventFilter(v);
            setPage(1);
          }}
          disabled={beswanMode}
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
        <div className="w-64">
          <SearchableSelect
            value={beswanMode ? beswanFilter : ""}
            onChange={(v: string) => {
              setBeswanFilter(v || ALL);
              setPage(1);
            }}
            options={beswanChoices}
            placeholder="Semua Beswan"
            searchPlaceholder="Cari nama/NIM…"
            emptyMessage="Beswan tidak ditemukan"
          />
        </div>
      </div>

      {beswanMode && selectedBeswan && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <ClipboardList className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Menampilkan tugas <strong>{selectedBeswan.name}</strong> beserta status pengumpulannya.
            Filter event &amp; pencarian dinonaktifkan di mode ini.
          </span>
        </div>
      )}

      {/* MASTER: daftar tugas */}
      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Kode</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead className="w-32">Event</TableHead>
              <TableHead className="w-36">Deadline</TableHead>
              <TableHead className={beswanMode ? "w-44" : "w-24"}>
                {beswanMode ? "Status Kumpul" : "Kumpul"}
              </TableHead>
              <TableHead className="w-28 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada penugasan ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                // Row klik-able ke halaman detail (hasil per beswan ada di sana);
                // kontrol di dalam row wajib stopPropagation
                <TableRow
                  key={p.id}
                  onClick={() => navigate(`/panel/penugasan/${p.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-mono text-xs">{p.kode_penugasan}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.judul}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize",
                          p.status === "aktif"
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        {p.status}
                      </Badge>
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
                    {beswanMode ? (
                      <HasilBadge item={p as BeswanPenugasanItem} />
                    ) : (
                      <>
                        {p.terkumpul_count}/{p.total_beswan}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/panel/penugasan/${p.id}`}
                        title="Lihat hasil per beswan"
                        onClick={(e: MouseEvent) => e.stopPropagation()}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {canManage && (
                        <>
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
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleting &&
                deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
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
