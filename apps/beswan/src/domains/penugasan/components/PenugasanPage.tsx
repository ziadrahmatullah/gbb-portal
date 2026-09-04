import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, ClipboardList, FileDown } from "lucide-react";
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  cn,
} from "@gbb/ui";
import { googleCalendarDeadlineUrl } from "@/shared/lib/googleCalendar";
import { useMyPenugasanList } from "../hooks/usePenugasan";
import type { MyPenugasan } from "../services";

const ALL = "all";

export const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Deadline lewat & beswan belum mengumpulkan → tandai merah
export const isOverdue = (p: MyPenugasan) =>
  !p.hasil_status && new Date(p.deadline).getTime() < Date.now();

// Badge status TUGAS (aktif/selesai) — beda dari status pengumpulan beswan
export function TugasStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        status === "aktif" ? "border-primary/30 bg-primary/10 text-primary" : "text-muted-foreground"
      )}
    >
      {status}
    </Badge>
  );
}

// Badge status pengumpulan MILIK beswan login
export function HasilBadge({ p }: { p: MyPenugasan }) {
  if (p.hasil_status === "graded") {
    return (
      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
        Dinilai · {p.nilai}/{p.nilai_maks}
      </Badge>
    );
  }
  if (p.hasil_status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1">
        <Badge
          variant="outline"
          className="border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400"
        >
          Terkumpul
        </Badge>
        {p.terlambat && (
          <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
            Terlambat
          </Badge>
        )}
      </span>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
    >
      Belum dikumpulkan
    </Badge>
  );
}

// Pengingat masih relevan: tugas aktif, belum dikumpulkan, deadline belum lewat
// (helper modul seperti isOverdue — bukan di badan komponen)
const needsReminder = (p: MyPenugasan) =>
  p.status === "aktif" && !p.hasil_status && new Date(p.deadline).getTime() > Date.now();

// Pengingat deadline ke Google Calendar (masukan PCM Sep 2026) — hanya untuk
// tugas yang masih relevan diingatkan (lihat needsReminder).
export function DeadlineCalendarLink({ p, compact }: { p: MyPenugasan; compact?: boolean }) {
  if (!needsReminder(p)) return null;
  const href = googleCalendarDeadlineUrl({
    title: `Deadline: ${p.judul} (GBB)`,
    deadline: p.deadline,
    details: `${p.kode_penugasan}\n${window.location.origin}/panel/penugasan/${p.id}`,
  });
  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title="Ingatkan di Google Calendar"
        aria-label="Ingatkan di Google Calendar"
        // stopPropagation: baris pembungkusnya klik-able ke detail
        onClick={(e: MouseEvent) => e.stopPropagation()}
        className="text-muted-foreground transition-colors hover:text-primary"
      >
        <CalendarPlus className="size-3.5" />
      </a>
    );
  }
  return (
    <Button variant="outline" size="sm" asChild>
      <a href={href} target="_blank" rel="noreferrer">
        <CalendarPlus className="size-4" />
        Ingatkan di Google Calendar
      </a>
    </Button>
  );
}

export function PenugasanPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Backend sudah mengurutkan terbaru-dulu & membatasi ke periode enrollment
  const { data, isLoading } = useMyPenugasanList({
    page,
    limit,
    status: status === ALL ? undefined : (status as "aktif" | "selesai"),
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Penugasan</h1>
        <p className="text-muted-foreground">Lihat tugasmu dan kumpulkan sebelum deadline.</p>
      </div>

      {/* Filter status tugas */}
      <div className="flex flex-wrap items-center gap-2">
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
            <SelectItem value={ALL}>Semua Tugas</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="selesai">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <ClipboardList className="size-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Tidak ada tugas ditemukan</p>
        </div>
      ) : (
        <div className="divide-y rounded-md border bg-card">
          {items.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/panel/penugasan/${p.id}`)}
              className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium">{p.judul}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.kode_penugasan}
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
                      <FileDown className="size-3.5" />
                    </a>
                  )}
                  <DeadlineCalendarLink p={p} compact />
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className={cn(isOverdue(p) && "font-medium text-destructive")}>
                    Deadline {formatDeadline(p.deadline)}
                  </span>
                  {/* Statistik kelas (rilis FEpromt15); guard 0 = jaga-jaga
                      periode tanpa beswan */}
                  {p.total_beswan > 0 && (
                    <> · {p.terkumpul_count}/{p.total_beswan} sudah mengumpulkan</>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <TugasStatusBadge status={p.status} />
                <HasilBadge p={p} />
              </div>
            </div>
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
