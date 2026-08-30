import { Link, useParams } from "react-router-dom";
import { ArrowLeft, NotebookPen } from "lucide-react";
import { Badge, Card, CardContent, Skeleton } from "@gbb/ui";
import { Button } from "@/shared/components/ui/button";
import { useRefleksiDetail } from "../hooks/useRefleksi";
import type { JawabanRes } from "../services";
import { BULAN, RefleksiStatusBadge } from "./RefleksiPage";

// Kelompokkan jawaban per seksi dengan mempertahankan urutan dari backend
function groupBySeksi(jawaban: JawabanRes[]) {
  const order: string[] = [];
  const grouped: Record<string, JawabanRes[]> = {};
  for (const j of jawaban) {
    if (!grouped[j.seksi]) {
      order.push(j.seksi);
      grouped[j.seksi] = [];
    }
    grouped[j.seksi].push(j);
  }
  return order.map((seksi) => ({ seksi, items: grouped[seksi] }));
}

export function RefleksiDetailPage() {
  const params = useParams();
  const refleksiId = Number(params.id);
  const { data: detail, isLoading, isError } = useRefleksiDetail(refleksiId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <NotebookPen className="size-10 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">Refleksi tidak ditemukan</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/panel/refleksi">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke daftar refleksi
          </Link>
        </Button>
      </div>
    );
  }

  const sections = groupBySeksi(detail.jawaban ?? []);

  return (
    <div className="space-y-4">
      {/* Header: nama beswan + bulan/tahun + badge status */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/panel/refleksi"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <h1 className="text-xl font-bold tracking-tight">
          {detail.beswan_nama}
          <span className="text-muted-foreground">
            {" "}· Refleksi {BULAN[detail.bulan - 1]} {detail.tahun}
          </span>
        </h1>
        <RefleksiStatusBadge status={detail.status} />
      </div>

      {/* Ringkasan untuk donatur (hasil AI/kurasi) bila ada */}
      {detail.ringkasan_donatur && (
        <Card className="gap-2 py-4">
          <CardContent className="space-y-2 px-4 text-sm">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Ringkasan untuk Donatur</h2>
              {detail.ringkasan_status && (
                <Badge variant="outline" className="capitalize text-muted-foreground">
                  {detail.ringkasan_status}
                </Badge>
              )}
            </div>
            <p className="whitespace-pre-wrap text-muted-foreground">{detail.ringkasan_donatur}</p>
          </CardContent>
        </Card>
      )}

      {/* Jawaban terkelompok per seksi */}
      {sections.length === 0 ? (
        <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
          Belum ada jawaban
        </p>
      ) : (
        sections.map(({ seksi, items }) => (
          <div key={seksi} className="space-y-2">
            <h2 className="text-sm font-semibold">{seksi}</h2>
            <div className="divide-y rounded-md border bg-card">
              {items.map((j) => (
                <div key={j.pertanyaan_id} className="space-y-1 px-4 py-3">
                  <div className="text-xs text-muted-foreground">{j.label}</div>
                  <p className="whitespace-pre-wrap text-sm">{j.nilai || "—"}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
