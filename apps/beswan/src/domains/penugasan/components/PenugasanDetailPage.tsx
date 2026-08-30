import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, ClipboardList, FileDown, Upload } from "lucide-react";
import { Badge, Button, Card, CardContent, Input, Label, Skeleton, cn } from "@gbb/ui";
import { useKumpulPenugasan, useMyPenugasanDetail } from "../hooks/usePenugasan";
import { HasilBadge, TugasStatusBadge, formatDeadline, isOverdue } from "./PenugasanPage";

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function PenugasanDetailPage() {
  const params = useParams();
  const penugasanId = Number(params.id);
  const { data: p, isLoading, isError } = useMyPenugasanDetail(penugasanId);
  const kumpulMutation = useKumpulPenugasan();
  const [file, setFile] = useState<File | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  // 404 (bukan hak beswan ini / tidak ada) atau id tidak valid
  if (isError || !p) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <ClipboardList className="size-10 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">Penugasan tidak ditemukan</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/panel/penugasan">
            <ArrowLeft className="size-4" />
            Kembali ke daftar tugas
          </Link>
        </Button>
      </div>
    );
  }

  const lewatDeadline = new Date(p.deadline).getTime() < Date.now();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    kumpulMutation.mutate(
      { id: p.id, file },
      { onSuccess: () => setFile(null) }
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/panel/penugasan"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
        <h1 className="text-xl font-bold tracking-tight">
          <span className="font-mono text-base text-muted-foreground">{p.kode_penugasan}</span>
          {" · "}
          {p.judul}
        </h1>
      </div>

      {/* Info tugas */}
      <Card className="gap-2 py-4">
        <CardContent className="space-y-3 px-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <TugasStatusBadge status={p.status} />
            <HasilBadge p={p} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                isOverdue(p) && "font-medium text-destructive"
              )}
            >
              <CalendarClock className="size-4" />
              Deadline {formatDeadline(p.deadline)}
            </span>
            <span>Nilai maks {p.nilai_maks}</span>
            {/* Statistik kelas (rilis FEpromt15); guard 0 = jaga-jaga periode
                tanpa beswan */}
            {p.total_beswan > 0 && (
              <span>
                {p.terkumpul_count}/{p.total_beswan} sudah mengumpulkan
              </span>
            )}
          </div>
          {p.deskripsi && <p className="whitespace-pre-wrap">{p.deskripsi}</p>}
          {p.lampiran_url && (
            <a
              href={p.lampiran_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <FileDown className="size-4" />
              Lampiran soal
            </a>
          )}
        </CardContent>
      </Card>

      {/* Pengumpulanmu */}
      <Card className="gap-2 py-4">
        <CardContent className="space-y-3 px-4 text-sm">
          <h2 className="font-semibold">Pengumpulanmu</h2>

          {p.hasil_status ? (
            <div className="space-y-1.5 rounded-md border bg-muted/30 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                {p.file_url && (
                  <a
                    href={p.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <FileDown className="size-4" />
                    File pengumpulanmu
                  </a>
                )}
                {p.submitted_at && (
                  <span className="text-xs text-muted-foreground">
                    dikumpulkan {formatTanggal(p.submitted_at)}
                  </span>
                )}
                {p.terlambat && (
                  <Badge
                    variant="outline"
                    className="border-destructive/30 bg-destructive/10 text-destructive"
                  >
                    Terlambat
                  </Badge>
                )}
              </div>
              {p.hasil_status === "graded" && (
                <div className="space-y-1">
                  <div>
                    Nilai:{" "}
                    <span className="font-semibold">
                      {p.nilai}/{p.nilai_maks}
                    </span>
                  </div>
                  {p.feedback && (
                    <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs italic">
                      “{p.feedback}”
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Kamu belum mengumpulkan tugas ini.</p>
          )}

          {/* Form upload / kumpulkan ulang */}
          <form onSubmit={handleSubmit} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="pg-file">File jawaban (.pdf, .doc, .docx, .zip)</Label>
              <Input
                id="pg-file"
                type="file"
                accept=".pdf,.doc,.docx,.zip"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
                disabled={kumpulMutation.isPending}
              />
            </div>
            {lewatDeadline && (
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Deadline sudah lewat — pengumpulan akan ditandai terlambat.
              </p>
            )}
            <div>
              <Button type="submit" size="sm" disabled={kumpulMutation.isPending || !file}>
                <Upload className="size-4" />
                {kumpulMutation.isPending
                  ? "Mengunggah…"
                  : p.hasil_status
                    ? "Kumpulkan Ulang"
                    : "Kumpulkan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
