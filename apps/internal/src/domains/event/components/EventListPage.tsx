import { useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mic,
  Plus,
  Search,
  Youtube,
} from "lucide-react";
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
import { useEventList, useEventStats } from "../hooks/useEvent";
import { formatEventDate } from "../utils";
import type { EventItem } from "../services";
import { CreateEventWizard } from "./EventFormDialogs";

const ALL = "all";

export function EventStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        status === "done" && "bg-primary/10 text-primary",
        status === "upcoming" && "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
        status === "cancelled" && "bg-destructive/10 text-destructive"
      )}
    >
      {status}
    </span>
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

export function EventListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tipe, setTipe] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [wizardOpen, setWizardOpen] = useState(false);

  const periodeId = usePeriodeFilter((s) => s.periodeId) ?? undefined;

  const { data: stats, isLoading: statsLoading } = useEventStats(periodeId);
  const { data, isLoading } = useEventList({
    page,
    limit,
    periode_id: periodeId,
    search: search || undefined,
    tipe: tipe === ALL ? undefined : tipe,
    status: status === ALL ? undefined : status,
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;
  const belumRekaman = stats?.belumRekaman ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Event Talkshow</h1>
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Mic} label="Total Event" value={String(stats?.total ?? "—")} loading={statsLoading} />
        <StatCard icon={CheckCircle2} label="Done" value={String(stats?.done ?? "—")} loading={statsLoading} />
        <StatCard icon={Calendar} label="Upcoming" value={String(stats?.upcoming ?? "—")} loading={statsLoading} />
        <StatCard icon={AlertTriangle} label="Belum Rekaman" value={String(belumRekaman.length)} loading={statsLoading} />
      </div>

      {/* Alert: event done tanpa rekaman/materi */}
      {belumRekaman.length > 0 && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {belumRekaman.length} event selesai belum ada link rekaman/materi
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {belumRekaman.map((e) => (
              <Link
                key={e.id}
                to={`/panel/event/${e.id}`}
                className="rounded-full border bg-card px-2.5 py-0.5 text-xs hover:bg-accent transition-colors"
              >
                {e.kode_event} · {e.nama_event}
              </Link>
            ))}
          </div>
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
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabel */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Kode</TableHead>
              <TableHead>Nama Event</TableHead>
              <TableHead className="w-24">Tanggal</TableHead>
              <TableHead className="w-24">Mentor</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-20">Media</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-6 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada event ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((ev) => (
                <TableRow
                  key={ev.id}
                  onClick={() => navigate(`/panel/event/${ev.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-mono text-xs">{ev.kode_event}</TableCell>
                  <TableCell>
                    <div className="font-medium">{ev.nama_event}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {ev.tipe} · {ev.format}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatEventDate(ev.tanggal)}</TableCell>
                  {/* Daftar mentor per event belum di-embed backend di EventRes */}
                  <TableCell>
                    <span className="text-muted-foreground" title="Menunggu dukungan backend (mentors belum di-embed di EventRes)">
                      —
                    </span>
                  </TableCell>
                  <TableCell>
                    <EventStatusBadge status={ev.status} />
                  </TableCell>
                  <TableCell>
                    <MediaLinks event={ev} />
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

      {/* Render kondisional = mount ulang tiap dibuka, supaya state wizard selalu segar */}
      {wizardOpen && <CreateEventWizard open onClose={() => setWizardOpen(false)} />}
    </div>
  );
}
