import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  MapPin,
  PlayCircle,
  Users,
} from "lucide-react";
import { Badge, Button, Card, CardContent, Skeleton } from "@gbb/ui";
import { useBeswanEventDetail } from "../hooks/useEvent";
import { EventStatusBadge, formatTanggal } from "./EventPage";

// Halaman detail event beswan — murni tampilan (read-only): tanpa edit,
// ubah status, ataupun absensi.
export function EventDetailPage() {
  const params = useParams();
  const eventId = Number(params.id);
  const { data: event, isLoading, isError } = useBeswanEventDetail(eventId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  // 404 (event tidak boleh dilihat / tidak ada) atau id tidak valid
  if (isError || !event) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <CalendarDays className="size-10 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">Event tidak ditemukan</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/panel/event">
            <ArrowLeft className="size-4" />
            Kembali ke daftar event
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/panel/event"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
        <h1 className="text-xl font-bold tracking-tight">
          <span className="font-mono text-base text-muted-foreground">{event.kode_event}</span>
          {" · "}
          {event.nama_event}
        </h1>
      </div>

      {/* Info event */}
      <Card className="gap-2 py-4">
        <CardContent className="space-y-3 px-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <EventStatusBadge status={event.status} />
            <Badge variant="outline" className="font-normal capitalize text-muted-foreground">
              {event.tipe}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatTanggal(event.tanggal)}
              {event.jam_mulai && ` · ${event.jam_mulai}–${event.jam_selesai || "…"}`}
            </span>
            <span className="inline-flex items-center gap-1.5 capitalize">
              <MapPin className="size-4" />
              {event.format}
              {event.lokasi && <span className="normal-case"> · {event.lokasi}</span>}
            </span>
            {event.kapasitas > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" />
                Kapasitas {event.kapasitas}
              </span>
            )}
          </div>
          {event.deskripsi && <p className="whitespace-pre-wrap">{event.deskripsi}</p>}
          {(event.youtube_url || event.slide_url) && (
            <div className="flex flex-wrap items-center gap-4 pt-1">
              {event.youtube_url && (
                <a
                  href={event.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <PlayCircle className="size-4" />
                  Rekaman
                </a>
              )}
              {event.slide_url && (
                <a
                  href={event.slide_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <FileText className="size-4" />
                  Materi
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mentor (nama + peran) */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Mentor ({(event.mentors ?? []).length})</h2>
        {(event.mentors ?? []).length === 0 ? (
          <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
            Belum ada mentor untuk event ini
          </p>
        ) : (
          <div className="divide-y rounded-md border bg-card">
            {event.mentors.map((m) => (
              <div
                key={m.mentor_id}
                className="flex items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="font-medium">{m.nama}</span>
                <Badge variant="outline" className="font-normal capitalize text-muted-foreground">
                  {m.peran}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
