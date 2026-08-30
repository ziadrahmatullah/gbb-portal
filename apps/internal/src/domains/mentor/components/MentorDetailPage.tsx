import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileDown, Linkedin, Pencil } from "lucide-react";
import { Card, CardContent, Skeleton } from "@gbb/ui";
import { Button } from "@/shared/components/ui/button";
import { assetUrl } from "@/domains/beswan/services";
import { useMentorDetail } from "../hooks/useMentor";
import { MentorFormDialog, UndipBadge } from "./MentorDialogs";

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

// Halaman detail mentor — mirror pola BeswanDetailPage: header dengan link
// kembali, kartu profil (+ tombol Edit), lalu history event & feedback.
export function MentorDetailPage() {
  const params = useParams();
  const mentorId = Number(params.id);
  const [editOpen, setEditOpen] = useState(false);

  const { data: detail, isLoading } = useMentorDetail(mentorId);
  const cv = assetUrl(detail?.cv_url);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!detail) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Mentor tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/panel/mentor"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <h1 className="text-xl font-bold tracking-tight">{detail.nama}</h1>
      </div>

      {/* Profil */}
      <Card className="py-4">
        <CardContent className="px-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{detail.bidang_keahlian}</span>
            <UndipBadge isInternal={detail.is_internal} />
            {detail.linkedin_url && (
              <a
                href={detail.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Linkedin className="h-3.5 w-3.5" />
                LinkedIn
              </a>
            )}
            <Button variant="outline" size="sm" className="ms-auto" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          </div>
          <div className="text-sm text-muted-foreground space-y-0.5">
            {detail.email && <div>Email: {detail.email}</div>}
            {detail.hp && <div>HP: {detail.hp}</div>}
            <div>Total event dibawakan: {detail.jumlah_event} (sepanjang masa)</div>
            {cv && (
              <a
                href={cv}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <FileDown className="h-4 w-4" />
                Download CV
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History event per mentor */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">History Event ({detail.event_history.length})</h2>
        {detail.event_history.length === 0 ? (
          <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
            Belum ada event yang dibawakan
          </p>
        ) : (
          <div className="rounded-md border bg-card divide-y">
            {detail.event_history.map((h) => (
              <div key={h.event_id} className="px-4 py-3 text-sm">
                <div className="font-medium truncate">{h.nama_event}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {formatTanggal(h.tanggal)} · {h.peran}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MentorFormDialog open={editOpen} editingId={mentorId} onClose={() => setEditOpen(false)} />
    </div>
  );
}
