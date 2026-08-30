import { useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Mic,
  Plus,
  Search,
  Youtube,
} from "lucide-react";
import { Badge, Card, CardContent, Skeleton } from "@gbb/ui";
import { cn } from "@/lib/utils";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { hasAnyRole } from "@/shared/constants/roles";
import { useEventList, useEventStats, useUpdateEventStatus } from "../hooks/useEvent";
import { formatEventDate } from "../utils";
import type { EventItem, EventStatus } from "../services";
import { CreateEventWizard } from "./EventFormDialogs";

const ALL = "all";

// Urutan segmen slider status (enum baru backend)
export const EVENT_STATUS_OPTIONS = ["draft", "published", "done", "cancelled"] as const;

// Aturan transisi status (FE-only): done final; cancelled hanya bisa kembali
// ke published (tidak boleh ke done); published boleh mundur ke draft.
const STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  draft: ["published", "cancelled"],
  published: ["draft", "done", "cancelled"],
  done: [],
  cancelled: ["published"],
};

// Warna aksen per status — dipakai trigger pill & dot di item menu
const DOT_CLASS: Record<EventStatus, string> = {
  draft: "bg-muted-foreground/60",
  published: "bg-blue-500",
  done: "bg-primary",
  cancelled: "bg-destructive",
};
const TRIGGER_CLASS: Record<EventStatus, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  published: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  done: "border-primary/30 bg-primary/10 text-primary",
  cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
};

// Dropdown status bergaya: trigger berupa pill berwarna sesuai status (dot +
// label + chevron), item menu ber-dot warna dengan aturan transisi — target
// di luar aturan disabled. Status done terkunci total (pill statis).
export function EventStatusDropdown({
  status,
  disabled,
  onChange,
}: {
  status: string;
  disabled?: boolean;
  onChange: (status: EventStatus) => void;
}) {
  const current = (
    EVENT_STATUS_OPTIONS.includes(status as EventStatus) ? status : "draft"
  ) as EventStatus;
  const allowed = STATUS_TRANSITIONS[current];
  const locked = allowed.length === 0; // done = final
  const hint =
    current === "done"
      ? "Status Done bersifat final — tidak bisa diubah lagi"
      : current === "cancelled"
        ? "Event cancelled hanya bisa dikembalikan ke Published"
        : undefined;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || locked}>
        <button
          type="button"
          title={hint}
          // Jaga-jaga bila dipakai di dalam konteks klik-able (row/kartu)
          onClick={(e: MouseEvent) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize transition-opacity",
            TRIGGER_CLASS[current],
            disabled || locked ? "cursor-not-allowed" : "cursor-pointer hover:opacity-80"
          )}
        >
          <span className={cn("size-2 rounded-full", DOT_CLASS[current])} />
          {current}
          {!locked && <ChevronDown className="size-3 opacity-70" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {EVENT_STATUS_OPTIONS.map((s) => {
          const isCurrent = s === current;
          const canGo = allowed.includes(s);
          return (
            <DropdownMenuItem
              key={s}
              disabled={!canGo}
              onClick={() => canGo && onChange(s)}
              className="gap-2 capitalize"
            >
              <span className={cn("size-2 rounded-full", DOT_CLASS[s])} />
              {s}
              {isCurrent && <Check className="ml-auto size-3.5" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function EventStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        status === "draft" && "text-muted-foreground",
        status === "published" &&
          "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
        status === "done" && "border-primary/30 bg-primary/10 text-primary",
        status === "cancelled" && "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      {status}
    </Badge>
  );
}

export function MediaLinks({ event }: { event: EventItem }) {
  if (!event.youtube_url && !event.slide_url) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="flex items-center gap-2">
      {event.youtube_url && (
        <a
          href={event.youtube_url}
          target="_blank"
          rel="noreferrer"
          title="Rekaman YouTube"
          onClick={(e) => e.stopPropagation()}
          className="text-primary hover:opacity-75"
        >
          <Youtube className="h-4 w-4" />
        </a>
      )}
      {event.slide_url && (
        <a
          href={event.slide_url}
          target="_blank"
          rel="noreferrer"
          title="Slide/materi"
          onClick={(e) => e.stopPropagation()}
          className="text-primary hover:opacity-75"
        >
          <FileText className="h-4 w-4" />
        </a>
      )}
    </span>
  );
}

// Kartu untuk tampilan grid — memuat kontrol yang sama dengan baris tabel
// (status dropdown/badge, media, ikon mata ke detail)
function EventGridCard({
  event: ev,
  canSetStatus,
  statusPending,
  onStatusChange,
}: {
  event: EventItem;
  canSetStatus: boolean;
  statusPending: boolean;
  onStatusChange: (status: EventStatus) => void;
}) {
  return (
    <Card className="h-full gap-2 py-4">
      <CardContent className="flex flex-1 flex-col gap-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium truncate" title={ev.nama_event}>
              {ev.nama_event}
            </div>
            <div className="font-mono text-xs text-muted-foreground">{ev.kode_event}</div>
          </div>
          <Link
            to={`/panel/event/${ev.id}`}
            title="Lihat detail"
            className="shrink-0 p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatEventDate(ev.tanggal)} ·{" "}
          <span className="capitalize">
            {ev.tipe} · {ev.format}
          </span>
          {ev.kapasitas > 0 && ` · Join ${ev.jumlah_join}/${ev.kapasitas}`}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {(ev.mentors ?? []).length === 0 ? (
            "Belum ada mentor"
          ) : (
            <span title={ev.mentors.map((m) => `${m.nama} (${m.peran})`).join(", ")}>
              {ev.mentors[0].nama}
              {ev.mentors.length > 1 && ` +${ev.mentors.length - 1}`}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {canSetStatus ? (
            <EventStatusDropdown
              status={ev.status}
              disabled={statusPending}
              onChange={onStatusChange}
            />
          ) : (
            <EventStatusBadge status={ev.status} />
          )}
          <MediaLinks event={ev} />
        </div>
      </CardContent>
    </Card>
  );
}

export function EventListPage() {
  const [search, setSearch] = useState("");
  const [tipe, setTipe] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  // null = sort tanggal nonaktif (jangan kirim sort_by/order — backend memakai
  // default urut terbaru-dibuat)
  const [sortTanggal, setSortTanggal] = useState<"asc" | "desc" | null>(null);
  // Tampilan list (tabel) atau grid (kartu) — ala Google Drive
  const [view, setView] = useState<"list" | "grid">("list");
  const [wizardOpen, setWizardOpen] = useState(false);
  // Daftar event tanpa rekaman default terlipat — jumlahnya bisa banyak
  const [belumRekamanOpen, setBelumRekamanOpen] = useState(false);

  const periodeId = usePeriodeFilter((s) => s.periodeId) ?? undefined;
  // Endpoint ganti status dibatasi backend ke admin/pcm
  const role = useAuthStore((s) => s.role);
  const canSetStatus = hasAnyRole(role, ["admin", "pcm"]);
  const statusMutation = useUpdateEventStatus();

  const { data: stats, isLoading: statsLoading } = useEventStats(periodeId);
  const { data, isLoading } = useEventList({
    page,
    limit,
    periode_id: periodeId,
    search: search || undefined,
    tipe: tipe === ALL ? undefined : tipe,
    status: status === ALL ? undefined : status,
    sort_by: sortTanggal ? "tanggal" : undefined,
    order: sortTanggal ?? undefined,
  });

  // Siklus klik header Tanggal: nonaktif → asc → desc → nonaktif
  const toggleSortTanggal = () => {
    setSortTanggal((s) => (s === null ? "asc" : s === "asc" ? "desc" : null));
    setPage(1);
  };

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;
  const belumRekaman = stats?.belumRekaman ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Event Talkshow</h1>
          <p className="text-muted-foreground">Kelola jadwal, absensi, dan materi event.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Event
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Mic} label="Total Event" value={String(stats?.total ?? "—")} loading={statsLoading} />
        <StatCard icon={CheckCircle2} label="Done" value={String(stats?.done ?? "—")} loading={statsLoading} />
        <StatCard icon={Calendar} label="Published" value={String(stats?.published ?? "—")} loading={statsLoading} />
        <StatCard icon={AlertTriangle} label="Belum Rekaman" value={String(belumRekaman.length)} loading={statsLoading} />
      </div>

      {/* Alert: event done tanpa rekaman/materi — daftar terlipat, klik untuk buka */}
      {belumRekaman.length > 0 && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
          <button
            type="button"
            onClick={() => setBelumRekamanOpen((o) => !o)}
            aria-expanded={belumRekamanOpen}
            className="flex w-full items-center gap-2 font-medium text-yellow-700 dark:text-yellow-400"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-left">
              {belumRekaman.length} event selesai belum ada link rekaman/materi
            </span>
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 shrink-0 transition-transform",
                belumRekamanOpen && "rotate-180"
              )}
            />
          </button>
          {belumRekamanOpen && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {belumRekaman.map((e) => (
                <Link
                  key={e.id}
                  to={`/panel/event/${e.id}`}
                  className="rounded-full border bg-card px-2.5 py-0.5 text-xs shadow-sm hover:bg-accent transition-colors"
                >
                  {e.kode_event} · {e.nama_event}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

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
            placeholder="Cari event…"
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
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Tipe</SelectItem>
            <SelectItem value="talkshow">Talkshow</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
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
            <SelectItem value={ALL}>Semua Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        {/* Mode grid tidak punya header tabel — kontrol sort tanggal pindah ke sini */}
        {view === "grid" && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortTanggal}
            className={cn(!sortTanggal && "text-muted-foreground")}
          >
            Tanggal
            {sortTanggal === "asc" ? (
              <ArrowUp className="size-3.5" />
            ) : sortTanggal === "desc" ? (
              <ArrowDown className="size-3.5" />
            ) : (
              <ChevronsUpDown className="size-3.5 opacity-60" />
            )}
          </Button>
        )}
        {/* Toggle tampilan list / grid — ala Google Drive */}
        <div className="ms-auto flex items-center rounded-md border p-0.5">
          <button
            title="Tampilan list"
            onClick={() => setView("list")}
            className={cn(
              "p-1.5 rounded-sm transition-colors",
              view === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            title="Tampilan grid"
            onClick={() => setView("grid")}
            className={cn(
              "p-1.5 rounded-sm transition-colors",
              view === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid (kartu) */}
      {view === "grid" &&
        (isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Calendar className="size-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">Tidak ada event ditemukan</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((ev) => (
              <EventGridCard
                key={ev.id}
                event={ev}
                canSetStatus={canSetStatus}
                statusPending={statusMutation.isPending}
                onStatusChange={(status) => statusMutation.mutate({ id: ev.id, status })}
              />
            ))}
          </div>
        ))}

      {/* Tabel (list) */}
      {view === "list" && (
      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Kode</TableHead>
              <TableHead>Nama Event</TableHead>
              <TableHead className="w-28">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSortTanggal}
                  className={cn("-ms-3 h-8", sortTanggal && "text-foreground")}
                >
                  Tanggal
                  {sortTanggal === "asc" ? (
                    <ArrowUp className="size-3.5" />
                  ) : sortTanggal === "desc" ? (
                    <ArrowDown className="size-3.5" />
                  ) : (
                    <ChevronsUpDown className="size-3.5 text-muted-foreground/60" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="w-24">Mentor</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-20">Media</TableHead>
              <TableHead className="w-16 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada event ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((ev) => (
                // Row sengaja TIDAK klik-able: dropdown status di dalamnya rawan
                // salah klik ke row — navigasi detail lewat ikon mata di kolom Aksi
                <TableRow key={ev.id}>
                  <TableCell className="font-mono text-xs">{ev.kode_event}</TableCell>
                  <TableCell>
                    <div className="font-medium">{ev.nama_event}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {ev.tipe} · {ev.format}
                      {/* Event berkapasitas = beswan harus join (kuota siapa cepat) */}
                      {ev.kapasitas > 0 && (
                        <span className="normal-case">
                          {" "}
                          · Join {ev.jumlah_join}/{ev.kapasitas}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatEventDate(ev.tanggal)}</TableCell>
                  <TableCell>
                    {(ev.mentors ?? []).length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span
                        className="text-sm"
                        title={ev.mentors.map((m) => `${m.nama} (${m.peran})`).join(", ")}
                      >
                        {ev.mentors[0].nama}
                        {ev.mentors.length > 1 && (
                          <span className="text-muted-foreground"> +{ev.mentors.length - 1}</span>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {canSetStatus ? (
                      <EventStatusDropdown
                        status={ev.status}
                        disabled={statusMutation.isPending}
                        onChange={(status) => statusMutation.mutate({ id: ev.id, status })}
                      />
                    ) : (
                      <EventStatusBadge status={ev.status} />
                    )}
                  </TableCell>
                  <TableCell>
                    <MediaLinks event={ev} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={`/panel/event/${ev.id}`}
                      title="Lihat detail"
                      className="inline-flex p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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

      {/* Render kondisional = mount ulang tiap dibuka, supaya state wizard selalu segar */}
      {wizardOpen && <CreateEventWizard open onClose={() => setWizardOpen(false)} />}
    </div>
  );
}
