import { useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  LayoutGrid,
  List,
  MapPin,
  Search,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  cn,
} from "@gbb/ui";
import { useBeswanEventList, useJoinEvent, useLeaveEvent } from "../hooks/useEvent";
import type { EventItem } from "../services";

const ALL = "all";

export const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export function EventStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
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

// Info kuota event berkapasitas: sisa kuota + badge Terdaftar / Kuota penuh.
// Event tanpa kapasitas (terbuka) tidak dirender apa-apa.
export function JoinInfo({ event }: { event: EventItem }) {
  if (event.kapasitas <= 0) return null;
  const sisa = Math.max(0, event.kapasitas - event.jumlah_join);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">
        Sisa kuota {sisa}/{event.kapasitas}
      </span>
      {event.is_joined && (
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          Terdaftar
        </Badge>
      )}
      {!event.is_joined && sisa === 0 && event.status === "published" && (
        <span className="text-xs text-destructive">Kuota penuh</span>
      )}
    </div>
  );
}

// Tombol aksi Join / Batalkan Pendaftaran (kuota siapa cepat)
export function JoinButton({ event }: { event: EventItem }) {
  const joinMutation = useJoinEvent();
  const leaveMutation = useLeaveEvent();
  if (event.kapasitas <= 0) return null;
  const sisa = Math.max(0, event.kapasitas - event.jumlah_join);
  const pending = joinMutation.isPending || leaveMutation.isPending;
  const canJoin = event.status === "published" && !event.is_joined && sisa > 0;
  const canLeave = !!event.is_joined && event.status !== "done";
  if (!canJoin && !canLeave) return null;
  return (
    // stopPropagation: bisa berada di dalam kartu/baris yang klik-able
    <div className="flex flex-wrap gap-2" onClick={(e: MouseEvent) => e.stopPropagation()}>
      {canJoin && (
        <Button size="sm" disabled={pending} onClick={() => joinMutation.mutate(event.id)}>
          {pending ? "Memproses…" : "Join Event"}
        </Button>
      )}
      {canLeave && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => leaveMutation.mutate(event.id)}
        >
          {pending ? "Memproses…" : "Batalkan Pendaftaran"}
        </Button>
      )}
    </div>
  );
}

// Gabungan ringkas (info + tombol) untuk kartu/baris list
export function JoinControl({ event }: { event: EventItem }) {
  if (event.kapasitas <= 0) return null;
  return (
    // stopPropagation: kartu/baris pembungkusnya klik-able ke detail
    <div
      className="flex flex-wrap items-center gap-2"
      onClick={(e: MouseEvent) => e.stopPropagation()}
    >
      <JoinInfo event={event} />
      <JoinButton event={event} />
    </div>
  );
}

function EventCard({ event, onClick }: { event: EventItem; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="h-full cursor-pointer gap-2 py-4 transition-shadow hover:shadow-md"
    >
      <CardContent className="flex flex-1 flex-col gap-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-medium" title={event.nama_event}>
              {event.nama_event}
            </div>
            <div className="font-mono text-xs text-muted-foreground">{event.kode_event}</div>
          </div>
          <EventStatusBadge status={event.status} />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="size-4 shrink-0" />
          {formatTanggal(event.tanggal)}
          {event.jam_mulai && ` · ${event.jam_mulai}–${event.jam_selesai || "…"}`}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" />
          <span className="capitalize">{event.format}</span>
          {event.lokasi && <span className="truncate"> · {event.lokasi}</span>}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <Badge variant="outline" className="font-normal capitalize text-muted-foreground">
            {event.tipe}
          </Badge>
          <JoinControl event={event} />
        </div>
      </CardContent>
    </Card>
  );
}

// Varian tampilan list: satu event per baris, klik-able ke detail
function EventRow({ event, onClick }: { event: EventItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{event.nama_event}</span>
          <span className="font-mono text-xs text-muted-foreground">{event.kode_event}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTanggal(event.tanggal)}
          {event.jam_mulai && ` · ${event.jam_mulai}–${event.jam_selesai || "…"}`}
          {" · "}
          <span className="capitalize">{event.format}</span>
          {event.lokasi && ` · ${event.lokasi}`}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <JoinControl event={event} />
        <Badge variant="outline" className="font-normal capitalize text-muted-foreground">
          {event.tipe}
        </Badge>
        <EventStatusBadge status={event.status} />
      </div>
    </div>
  );
}

export function EventPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [tipe, setTipe] = useState(ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  // null = sort tanggal nonaktif (backend memakai default terbaru-dibuat)
  const [sortTanggal, setSortTanggal] = useState<"asc" | "desc" | null>(null);
  // Tampilan grid (kartu) atau list (baris) — ala Google Drive
  const [view, setView] = useState<"grid" | "list">("grid");

  // Backend otomatis membatasi ke periode enrollment beswan & tanpa draft
  const { data, isLoading } = useBeswanEventList({
    page,
    limit,
    search: search || undefined,
    status: status === ALL ? undefined : status,
    tipe: tipe === ALL ? undefined : tipe,
    sort_by: sortTanggal ? "tanggal" : undefined,
    order: sortTanggal ?? undefined,
  });

  // Siklus klik: nonaktif → asc → desc → nonaktif
  const toggleSortTanggal = () => {
    setSortTanggal((s) => (s === null ? "asc" : s === "asc" ? "desc" : null));
    setPage(1);
  };

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Event</h1>
        <p className="text-muted-foreground">Jadwal dan arsip event di periodemu.</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari event…"
            className="w-64 pl-9"
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
            <SelectItem value={ALL}>Semua Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
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
        {/* List berbentuk kartu (tanpa header tabel) — kontrol sort tanggal
            berupa tombol di baris filter */}
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
        {/* Toggle tampilan grid / list — ala Google Drive */}
        <div className="ms-auto flex items-center rounded-md border p-0.5">
          <button
            title="Tampilan grid"
            onClick={() => setView("grid")}
            className={cn(
              "rounded-sm p-1.5 transition-colors",
              view === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            title="Tampilan list"
            onClick={() => setView("list")}
            className={cn(
              "rounded-sm p-1.5 transition-colors",
              view === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <CalendarDays className="size-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Tidak ada event ditemukan</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((ev) => (
            <EventCard key={ev.id} event={ev} onClick={() => navigate(`/panel/event/${ev.id}`)} />
          ))}
        </div>
      ) : (
        <div className="divide-y rounded-md border bg-card">
          {items.map((ev) => (
            <EventRow key={ev.id} event={ev} onClick={() => navigate(`/panel/event/${ev.id}`)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>
              Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, totalItems)} dari{" "}
              {totalItems}
            </span>
            <Select
              value={String(limit)}
              onValueChange={(v: string) => {
                setLimit(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[9, 18, 36].map((n) => (
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
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
