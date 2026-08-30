import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info,
  Pencil,
  Save,
  Search as SearchIcon,
} from "lucide-react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from "@gbb/ui";
import { usePeriodeOptions } from "@/domains/periode/hooks/usePeriode";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { hasAnyRole } from "@/shared/constants/roles";
import {
  useEventAbsensi,
  useEventDetail,
  useSaveAbsensi,
  useUpdateEvent,
  useUpdateEventStatus,
} from "../hooks/useEvent";
import type { EventItem } from "../services";
import { EditEventDialog } from "./EventFormDialogs";
import { EventStatusBadge, EventStatusDropdown } from "./EventListPage";
import { formatEventDate } from "../utils";

// Daftar periode yang boleh mengikuti event ini (periode_ids), dengan
// penanda periode utama
function PeriodeInfo({ event }: { event: EventItem }) {
  const { data: periodeOptions } = usePeriodeOptions();
  const ids = event.periode_ids?.length ? event.periode_ids : [event.periode_id];
  const namaById = new Map((periodeOptions?.items ?? []).map((p) => [p.id, p.nama]));
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground">Periode:</span>
      {ids.map((pid) => (
        <Badge key={pid} variant="outline" className="gap-1 font-normal">
          {namaById.get(pid) ?? `#${pid}`}
          {pid === event.periode_id && (
            <span className="text-xs text-muted-foreground">· utama</span>
          )}
        </Badge>
      ))}
    </div>
  );
}

// Ringkasan hadir X/Y untuk kartu info detail. Memakai query yang sama dengan
// AbsensiSection (key identik → react-query dedupe, tidak ada fetch ganda).
function AbsensiSummary({ event }: { event: EventItem }) {
  const { data: roster } = useEventAbsensi(event.id);
  const total = roster?.length ?? 0;
  const hadir = (roster ?? []).filter((a) => a.hadir).length;
  return (
    <span>
      Absensi: {hadir}/{total} hadir
    </span>
  );
}

function AbsensiSection({ event }: { event: EventItem }) {
  // GET absensi = roster LENGKAP otomatis dari backend (berkapasitas = hanya
  // yang join; terbuka = semua beswan seluruh periode_ids) + status hadir
  const { data: roster, isLoading } = useEventAbsensi(event.id);
  const saveMutation = useSaveAbsensi();
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  // Seed ulang saat roster termuat/berubah (adjust-during-render)
  const [prevRoster, setPrevRoster] = useState<typeof roster>(undefined);
  if (roster !== prevRoster) {
    setPrevRoster(roster);
    setChecked(Object.fromEntries(roster?.map((a) => [a.beswan_id, a.hadir]) ?? []));
  }

  const items = roster ?? [];
  // Search + pagination client-side — roster sudah ter-load penuh di halaman
  // ini; Simpan tetap mengirim SELURUH roster, bukan hanya halaman tampil
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const filtered = search
    ? items.filter((b) =>
        `${b.nama_lengkap} ${b.nim}`.toLowerCase().includes(search.toLowerCase())
      )
    : items;
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * limit, safePage * limit);
  const hadirCount = items.filter((b) => !!checked[b.beswan_id]).length;
  const toggle = (id: number) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSave = () => {
    // Kirim SELURUH roster (upsert per item di backend, bukan replace-all)
    saveMutation.mutate({
      eventId: event.id,
      absensi: items.map((b) => ({ beswan_id: b.beswan_id, hadir: !!checked[b.beswan_id] })),
    });
  };

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-sm">
          Absensi Beswan ({hadirCount}/{items.length} hadir)
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5 text-xs">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Status hadir tersimpan dimuat otomatis — ubah centang lalu Simpan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative max-w-64">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama/NIM…"
            className="pl-9"
          />
        </div>
        <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beswan</TableHead>
              <TableHead className="w-24 text-center">Hadir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-6">
                  {search
                    ? "Tidak ada beswan cocok"
                    : event.kapasitas > 0
                      ? "Belum ada beswan yang join event ini"
                      : "Tidak ada beswan di periode event ini"}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((b) => (
                <TableRow
                  key={b.beswan_id}
                  onClick={() => toggle(b.beswan_id)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="font-medium">{b.nama_lengkap}</div>
                    <div className="text-xs text-muted-foreground font-mono">{b.nim}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={!!checked[b.beswan_id]}
                      onChange={() => toggle(b.beswan_id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 accent-primary cursor-pointer"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>
                Menampilkan {(safePage - 1) * limit + 1}–
                {Math.min(safePage * limit, filtered.length)} dari {filtered.length}
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
                Hal {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending || items.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Menyimpan…" : "Simpan Absensi"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PascaEventSection({ event }: { event: EventItem }) {
  const updateMutation = useUpdateEvent();
  const [youtube, setYoutube] = useState(event.youtube_url ?? "");
  const [slide, setSlide] = useState(event.slide_url ?? "");

  const missingMedia = event.status === "done" && (!event.youtube_url || !event.slide_url);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Key youtube_url/slide_url hanya disertakan saat terisi — kehadiran key
    // (walau kosong) men-set flag rekaman/materi_tersedia di backend
    updateMutation.mutate({
      id: event.id,
      body: {
        ...(youtube ? { youtube_url: youtube } : {}),
        ...(slide ? { slide_url: slide } : {}),
      },
    });
  };

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-sm">Pasca Event</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
      {missingMedia && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Status event sudah Done tapi link rekaman/slide masih kosong.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="pe-youtube">YouTube URL</Label>
            <Input
              id="pe-youtube"
              type="url"
              placeholder="https://youtube.com/…"
              value={youtube}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setYoutube(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pe-slide">Slide URL</Label>
            <Input
              id="pe-slide"
              type="url"
              placeholder="https://drive.google.com/…"
              value={slide}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSlide(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Materi otomatis masuk Library saat link disimpan.
          </p>
          <Button type="submit" size="sm" disabled={updateMutation.isPending || (!youtube && !slide)}>
            {updateMutation.isPending ? "Menyimpan…" : "Simpan Link"}
          </Button>
        </div>
      </form>
      </CardContent>
    </Card>
  );
}

export function EventDetailPage() {
  const params = useParams();
  const eventId = Number(params.id);
  const { data: event, isLoading } = useEventDetail(eventId);
  const statusMutation = useUpdateEventStatus();
  // Ganti status dibatasi backend ke admin/pcm — role lain hanya melihat badge
  const role = useAuthStore((s) => s.role);
  const canSetStatus = hasAnyRole(role, ["admin", "pcm"]);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!event) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Event tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <Link
            to="/panel/event"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="font-mono text-base text-muted-foreground">{event.kode_event}</span>
            {" · "}
            {event.nama_event}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </div>
      </div>

      {/* Status + info */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status:</span>
          {canSetStatus ? (
            <EventStatusDropdown
              status={event.status}
              disabled={statusMutation.isPending}
              onChange={(status) => statusMutation.mutate({ id: event.id, status })}
            />
          ) : (
            <EventStatusBadge status={event.status} />
          )}
        </div>
        <span className="text-muted-foreground">
          📅 {formatEventDate(event.tanggal)}
          {event.jam_mulai && ` · ${event.jam_mulai}–${event.jam_selesai || "…"}`}
          {" · "}
          <span className="capitalize">{event.format}</span>
          {event.lokasi && ` · ${event.lokasi}`}
        </span>
      </div>

      {/* Info event: deskripsi, kapasitas, mentor (dari EventRes) */}
      <Card className="gap-2 py-4">
        <CardContent className="space-y-2 px-4 text-sm">
          {event.deskripsi && <p>{event.deskripsi}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            {/* Info Peserta sengaja tidak ditampilkan — rancu dengan Join
                (event berkapasitas) dan absensi; cukup Join + Absensi */}
            {event.kapasitas > 0 && (
              <span>
                Join: {event.jumlah_join}/{event.kapasitas}
              </span>
            )}
            <AbsensiSummary event={event} />
          </div>
          <PeriodeInfo event={event} />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground">Mentor:</span>
            {(event.mentors ?? []).length === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              event.mentors.map((m) => (
                <Badge key={m.mentor_id} variant="outline" className="gap-1">
                  <span className="font-medium">{m.nama}</span>
                  <span className="capitalize text-muted-foreground">· {m.peran}</span>
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <PascaEventSection key={`${event.youtube_url ?? ""}|${event.slide_url ?? ""}`} event={event} />
      <AbsensiSection event={event} />

      <EditEventDialog event={editOpen ? event : null} onClose={() => setEditOpen(false)} />
    </div>
  );
}
