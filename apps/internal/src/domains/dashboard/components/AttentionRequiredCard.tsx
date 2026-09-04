import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@gbb/ui";
import type { ProgressBeswan } from "../services";
import { KPI_DEFAULT, indikatorGagal } from "../kpi";

// Dialog daftar beswan — dipakai kartu Avg Kehadiran (klik → nama-nama di
// bawah rata-rata, slide 17) dan bisa dipakai ulang widget lain.
export function BeswanListDialog({
  open,
  onClose,
  title,
  description,
  rows,
  renderMeta,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  rows: ProgressBeswan[];
  renderMeta: (p: ProgressBeswan) => string;
}) {
  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada beswan</p>
        ) : (
          <ul className="max-h-80 divide-y overflow-auto rounded-md border">
            {rows.map((p) => (
              <li key={p.beswan_id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <Link
                  to={`/panel/beswan/${p.beswan_id}`}
                  className="inline-flex min-w-0 items-center gap-1 font-medium hover:text-primary hover:underline"
                >
                  <span className="truncate">{p.nama}</span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">{renderMeta(p)}</span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Widget "Perlu Perhatian" di tab Analitik Beswan (slide 18): beswan yang
// tidak memenuhi indikator + tombol Tindak Lanjut (sementara = buka detail
// beswan; pencatatan coaching menunggu BE).
export function AttentionRequiredCard({
  progress,
  loading,
}: {
  progress: ProgressBeswan[];
  loading?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const flagged = progress
    .map((p) => ({ p, gagal: indikatorGagal(p) }))
    .filter((x) => x.gagal.length > 0)
    // paling banyak indikator gagal dulu, lalu kehadiran terendah
    .sort((a, b) => b.gagal.length - a.gagal.length || a.p.hadir_persen - b.p.hadir_persen);
  const visible = showAll ? flagged : flagged.slice(0, 5);

  return (
    <Card className="border-amber-300/60 dark:border-amber-800/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
          Perlu Perhatian
          {!loading && (
            <Badge variant="outline" className="ml-1 font-normal text-muted-foreground">
              {flagged.length} beswan
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Beswan yang belum memenuhi indikator: kehadiran ≥ {KPI_DEFAULT.kehadiran_min}% dan
          refleksi bulanan tertinggal maksimal {KPI_DEFAULT.refleksi_tertinggal_max} bulan. Ambang
          masih bawaan sistem; pengaturan KPI oleh admin menyusul.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat…</p>
        ) : flagged.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Semua beswan memenuhi indikator saat ini. 🎉
          </p>
        ) : (
          <div className="divide-y rounded-md border">
            {visible.map(({ p, gagal }) => (
              <div
                key={p.beswan_id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.nama}</div>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {gagal.map((g) => (
                      <Badge
                        key={g.key}
                        variant="outline"
                        className="border-amber-500/40 bg-amber-500/10 font-normal text-amber-800 dark:text-amber-300"
                      >
                        {g.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Link
                  to={`/panel/beswan/${p.beswan_id}`}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Tindak Lanjut
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            ))}
            {flagged.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="w-full px-3 py-2 text-center text-xs text-muted-foreground hover:text-foreground"
              >
                {showAll ? "Tampilkan lebih sedikit" : `Tampilkan semua (${flagged.length})`}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
