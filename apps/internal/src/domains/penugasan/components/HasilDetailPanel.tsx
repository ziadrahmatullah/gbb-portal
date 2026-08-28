import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  AlarmClock,
  CheckCircle2,
  FileDown,
  Hourglass,
  Pencil,
  Upload,
} from "lucide-react";
import { Badge, Card, Skeleton } from "@gbb/ui";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useHasilList, useNilaiHasil } from "../hooks/usePenugasan";
import type { HasilPenugasan, Penugasan } from "../services";

const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function HasilStatusBadge({ hasil }: { hasil: HasilPenugasan }) {
  if (hasil.status === "graded") {
    return (
      <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary">
        <CheckCircle2 className="h-3 w-3" /> graded
      </Badge>
    );
  }
  if (hasil.status === "submitted") {
    return hasil.terlambat ? (
      <Badge variant="outline" className="gap-1 border-destructive/30 bg-destructive/10 text-destructive">
        <AlarmClock className="h-3 w-3" /> terlambat
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="gap-1 border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      >
        <Upload className="h-3 w-3" /> submitted
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Hourglass className="h-3 w-3" /> belum kumpul
    </Badge>
  );
}

function NilaiDialog({
  hasil,
  penugasan,
  onClose,
}: {
  hasil: HasilPenugasan;
  penugasan: Penugasan;
  onClose: () => void;
}) {
  const nilaiMutation = useNilaiHasil();
  const [nilai, setNilai] = useState(hasil.nilai != null ? String(hasil.nilai) : "");
  const [feedback, setFeedback] = useState(hasil.feedback ?? "");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    nilaiMutation.mutate(
      { hasilId: hasil.id, nilai: Number(nilai), feedback: feedback || undefined },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Nilai — {hasil.nama_beswan} · {penugasan.kode_penugasan}
          </DialogTitle>
          <DialogDescription>
            Status jadi graded setelah disimpan; nilai bisa direvisi kapan saja.
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-muted-foreground space-y-1">
          <div>
            Submit:{" "}
            {hasil.submitted_at
              ? `${formatDeadline(hasil.submitted_at)} (${hasil.terlambat ? "terlambat" : "tepat waktu"})`
              : "—"}
          </div>
          {hasil.file_url && (
            <a
              href={hasil.file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <FileDown className="h-4 w-4" />
              Lihat file jawaban
            </a>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="n-nilai">Nilai (0–{penugasan.nilai_maks})</Label>
            <Input
              id="n-nilai"
              type="number"
              min={0}
              max={penugasan.nilai_maks}
              value={nilai}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNilai(e.target.value)}
              required
              disabled={nilaiMutation.isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="n-feedback">Feedback (opsional)</Label>
            <Textarea
              id="n-feedback"
              rows={3}
              value={feedback}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)}
              disabled={nilaiMutation.isPending}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={nilaiMutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={nilaiMutation.isPending || nilai === ""}>
              {nilaiMutation.isPending ? "Menyimpan…" : "Simpan & Beri Nilai"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const FILTERS = [
  { key: "semua", label: "Semua" },
  // "Belum dinilai" = status != graded (mencakup submitted DAN belum_kumpul)
  { key: "belum-dinilai", label: "Belum dinilai" },
] as const;

export function HasilDetailPanel({
  penugasan,
  eventLabel,
  canManage,
}: {
  penugasan: Penugasan;
  eventLabel: string;
  canManage: boolean;
}) {
  const { data, isLoading } = useHasilList(penugasan.id);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("semua");
  const [grading, setGrading] = useState<HasilPenugasan | null>(null);

  const all = data?.items ?? [];
  const items = filter === "semua" ? all : all.filter((h) => h.status !== "graded");

  return (
    <Card className="gap-0 overflow-hidden py-0">
      {/* Header detail */}
      <div className="border-b px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm">
            <span className="font-semibold">{penugasan.judul}</span>
            <span className="text-muted-foreground">
              {" "}· Deadline {formatDeadline(penugasan.deadline)} · Maks {penugasan.nilai_maks} · {eventLabel}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            Terkumpul {penugasan.terkumpul_count}/{penugasan.total_beswan}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {FILTERS.map((f) => (
            <label key={f.key} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                name="hasil-filter"
                checked={filter === f.key}
                onChange={() => setFilter(f.key)}
                className="accent-primary"
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead className="w-20">File</TableHead>
              <TableHead className="w-24">Nilai</TableHead>
              {canManage && <TableHead className="w-28 text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={canManage ? 5 : 4}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="text-center text-sm text-muted-foreground py-6">
                  Tidak ada data hasil
                </TableCell>
              </TableRow>
            ) : (
              items.map((h) => (
                <TableRow key={`${h.beswan_id}`}>
                  <TableCell className="font-medium">{h.nama_beswan}</TableCell>
                  <TableCell>
                    <HasilStatusBadge hasil={h} />
                  </TableCell>
                  <TableCell>
                    {h.file_url ? (
                      <a
                        href={h.file_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Download jawaban"
                        className="text-primary hover:opacity-75"
                      >
                        <FileDown className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className={cn("text-sm", h.nilai == null && "text-muted-foreground")}>
                    {h.nilai != null ? `${h.nilai}/${penugasan.nilai_maks}` : "—"}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {h.status === "submitted" ? (
                        <Button size="sm" onClick={() => setGrading(h)}>
                          Nilai
                        </Button>
                      ) : h.status === "graded" ? (
                        <Button size="sm" variant="outline" onClick={() => setGrading(h)}>
                          <Pencil className="h-3 w-3 mr-1.5" />
                          Revisi
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {grading && (
        <NilaiDialog hasil={grading} penugasan={penugasan} onClose={() => setGrading(null)} />
      )}
    </Card>
  );
}
