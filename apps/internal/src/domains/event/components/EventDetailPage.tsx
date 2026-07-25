import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Info, Pencil, Save } from "lucide-react";
import { useBeswanList } from "@/domains/beswan/hooks/useBeswan";
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
import { useEventAbsensi, useEventDetail, useSaveAbsensi, useUpdateEvent } from "../hooks/useEvent";
import type { EventItem } from "../services";
import { EditEventDialog } from "./EventFormDialogs";
import { EventStatusBadge } from "./EventListPage";
import { formatEventDate } from "../utils";

function AbsensiSection({ event }: { event: EventItem }) {
  // Roster = seluruh beswan periode terkait event
  const { data: roster, isLoading: rosterLoading } = useBeswanList({
    periode_id: String(event.periode_id),
    limit: 100,
  });
  // Prefill dari status hadir tersimpan (GET absensi)
  const { data: saved, isLoading: savedLoading } = useEventAbsensi(event.id);
  const saveMutation = useSaveAbsensi();
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  // Seed ulang saat data tersimpan termuat/berubah (adjust-during-render)
  const [prevSaved, setPrevSaved] = useState<typeof saved>(undefined);
  if (saved !== prevSaved) {
    setPrevSaved(saved);
    setChecked(Object.fromEntries(saved?.map((a) => [a.beswan_id, a.hadir]) ?? []));
  }

  const isLoading = rosterLoading || savedLoading;
  const items = roster?.items ?? [];
  const toggle = (id: number) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSave = () => {
    // Kirim SELURUH roster (upsert per item di backend, bukan replace-all)
    saveMutation.mutate({
      eventId: event.id,
      absensi: items.map((b) => ({ beswan_id: b.id, hadir: !!checked[b.id] })),
    });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Absensi Beswan</h3>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 shrink-0" />
        Status hadir tersimpan dimuat otomatis — ubah centang lalu Simpan.
      </p>
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
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
                  <div className="h-6 animate-pulse rounded bg-muted" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-6">
                  Tidak ada beswan di periode event ini
                </TableCell>
              </TableRow>
            ) : (
              items.map((b) => (
                <TableRow key={b.id} onClick={() => toggle(b.id)} className="cursor-pointer">
                  <TableCell>
                    <div className="font-medium">{b.nama_lengkap}</div>
                    <div className="text-xs text-muted-foreground font-mono">{b.nim}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={!!checked[b.id]}
                      onChange={() => toggle(b.id)}
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
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending || items.length === 0}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Menyimpan…" : "Simpan Absensi"}
        </Button>
      </div>
    </div>
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
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Pasca Event</h3>
      {missingMedia && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Status event sudah Done tapi link rekaman/slide masih kosong.
        </div>
      )}
      <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
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
    </div>
  );
}

export function EventDetailPage() {
  const params = useParams();
  const eventId = Number(params.id);
  const { data: event, isLoading } = useEventDetail(eventId);
  const updateMutation = useUpdateEvent();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!event) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Event tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/panel/event"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <h1 className="text-xl font-bold">
          <span className="font-mono text-base text-muted-foreground">{event.kode_event}</span>
          {" · "}
          {event.nama_event}
        </h1>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
      </div>

      {/* Status + info */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status:</span>
          <Select
            value={event.status}
            onValueChange={(v: "upcoming" | "done" | "cancelled") =>
              updateMutation.mutate({ id: event.id, body: { status: v } })
            }
            disabled={updateMutation.isPending}
          >
            <SelectTrigger className="w-36 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <EventStatusBadge status={event.status} />
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
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2 text-sm">
        {event.deskripsi && <p>{event.deskripsi}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
          <span>
            Peserta: {event.jumlah_peserta}
            {event.kapasitas > 0 && ` / ${event.kapasitas}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground">Mentor:</span>
          {(event.mentors ?? []).length === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            event.mentors.map((m) => (
              <span
                key={m.mentor_id}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs"
              >
                <span className="font-medium">{m.nama}</span>
                <span className="capitalize text-muted-foreground">· {m.peran}</span>
              </span>
            ))
          )}
        </div>
      </div>

      <AbsensiSection event={event} />
      <PascaEventSection key={`${event.youtube_url ?? ""}|${event.slide_url ?? ""}`} event={event} />

      <EditEventDialog event={editOpen ? event : null} onClose={() => setEditOpen(false)} />
    </div>
  );
}
