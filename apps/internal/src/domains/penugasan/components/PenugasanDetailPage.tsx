import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileDown } from "lucide-react";
import { Badge, Card, CardContent, Skeleton } from "@gbb/ui";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { useEventDetail } from "@/domains/event/hooks/useEvent";
import { usePenugasanDetail } from "../hooks/usePenugasan";
import { HasilDetailPanel } from "./HasilDetailPanel";

// Halaman detail penugasan — mirror pola BeswanDetailPage/EventDetailPage:
// header dengan link kembali, info tugas, lalu panel hasil per beswan.
export function PenugasanDetailPage() {
  const params = useParams();
  const penugasanId = Number(params.id);
  const role = useAuthStore((s) => s.role);
  const canManage = role === "admin" || role === "pcm";

  const { data: penugasan, isLoading } = usePenugasanDetail(penugasanId);
  // Label event sumber — fetch detail event hanya bila tugas ber-event
  const { data: event } = useEventDetail(penugasan?.event_id ?? NaN);
  const eventLabel = penugasan?.event_id
    ? event?.kode_event ?? `EVT #${penugasan.event_id}`
    : "non-event";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!penugasan) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">Penugasan tidak ditemukan.</p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/panel/penugasan"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <h1 className="text-xl font-bold tracking-tight">
          <span className="font-mono text-base text-muted-foreground">{penugasan.kode_penugasan}</span>
          {" · "}
          {penugasan.judul}
        </h1>
      </div>

      {/* Info tugas (deadline/maks/event/terkumpul ada di header panel hasil) */}
      <Card className="gap-2 py-4">
        <CardContent className="space-y-2 px-4 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                penugasan.status === "aktif"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "text-muted-foreground"
              )}
            >
              {penugasan.status}
            </Badge>
            {penugasan.lampiran_url && (
              <a
                href={penugasan.lampiran_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <FileDown className="h-4 w-4" />
                Lampiran soal
              </a>
            )}
          </div>
          {penugasan.deskripsi && (
            <p className="whitespace-pre-wrap text-muted-foreground">{penugasan.deskripsi}</p>
          )}
        </CardContent>
      </Card>

      {/* Hasil per beswan */}
      <HasilDetailPanel penugasan={penugasan} eventLabel={eventLabel} canManage={canManage} />
    </div>
  );
}
