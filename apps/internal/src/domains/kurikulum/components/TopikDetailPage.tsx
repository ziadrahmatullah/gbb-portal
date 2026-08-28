import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Youtube } from "lucide-react";
import { Card, CardContent, Skeleton } from "@gbb/ui";
import { useTopikDetail } from "../hooks/useKurikulum";
import { TopikStatusBadge } from "./TopikTab";

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

// Halaman detail topik (GET /internal/kurikulum/topik/:id) — mirror pola
// BeswanDetailPage: header dengan link kembali, kartu info, lalu daftar media
// per event yang tertaut ke topik ini.
export function TopikDetailPage() {
  const params = useParams();
  const topikId = Number(params.id);
  const { data: topik, isLoading } = useTopikDetail(topikId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!topik) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Topik tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/panel/kurikulum"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <h1 className="text-xl font-bold tracking-tight">{topik.judul}</h1>
      </div>

      {/* Info topik */}
      <Card className="py-4">
        <CardContent className="px-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <TopikStatusBadge status={topik.status} />
            <span className="text-sm text-muted-foreground">
              {topik.periode_nama} — topik ke-{topik.urutan}
            </span>
            {topik.tor_url && (
              <a
                href={topik.tor_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <FileText className="h-3.5 w-3.5" />
                Lihat TOR
              </a>
            )}
          </div>
          {topik.detail && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{topik.detail}</p>
          )}
        </CardContent>
      </Card>

      {/* Media per event (urut tanggal ASC dari backend) */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Media Event</h2>
        {topik.media.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center rounded-md border border-dashed">
            Belum ada event untuk topik ini
          </p>
        ) : (
          <ul className="space-y-2">
            {topik.media.map((m) => (
              <li
                key={m.event_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium">{m.nama_event}</div>
                  <div className="text-xs text-muted-foreground">{formatTanggal(m.tanggal)}</div>
                </div>
                {!m.youtube_url && !m.slide_url ? (
                  <span className="text-xs text-muted-foreground">Belum ada rekaman/materi</span>
                ) : (
                  <div className="flex items-center gap-3 text-sm">
                    {m.youtube_url && (
                      <a
                        href={m.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Youtube className="h-4 w-4" />
                        Rekaman
                      </a>
                    )}
                    {m.slide_url && (
                      <a
                        href={m.slide_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Slide
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
