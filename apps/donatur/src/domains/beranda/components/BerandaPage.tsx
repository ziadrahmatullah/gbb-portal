import { useMemo, useState } from "react";
import { CalendarCheck, Info, Sparkles, Tag, Wallet, X } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gbb/ui";
import { StatCard } from "@/shared/components/StatCard";
import { formatRupiah, BULAN_PENDEK } from "@/shared/lib/format";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { useHighlight, useMyDashboard } from "../hooks/useBeranda";
import { HIGHLIGHT_KATEGORI_LABEL, highlightTanggal } from "../services";
import { useDonaturStatus } from "@/shared/hooks/useDonaturStatus";
import { AjakPatunganPanel } from "@/shared/components/AjakPatunganPanel";

const BANNER_DISMISS_KEY = "donatur_banner_email_dismissed";

function EmailBanner() {
  // Tidak ada flag "sudah dismiss" dari backend — status dismiss murni disimpan
  // di localStorage FE, tampil lagi tiap sesi/browser baru (sesuai wireframe).
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(BANNER_DISMISS_KEY) === "1");
  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(BANNER_DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <Alert className="border-secondary/30 bg-secondary/5">
      <Info className="size-4 text-secondary" />
      <AlertDescription className="pr-6 text-foreground/80">
        Pastikan email Gmail yang kamu pakai login di portal ini SAMA dengan email saat
        mengisi form bit.ly/AlumniMauBantu. Jika berbeda, hubungi Tim AnC agar akunmu
        dihubungkan, sehingga data beswan &amp; donasi kamu tampil lengkap.
      </AlertDescription>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup"
        className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </Alert>
  );
}

function HistoryKonsistensiTable({
  history,
}: {
  history: { periode_id: number; periode_nama: string; aktif: boolean; bulanan: { bulan: number; tahun: number; donasi: boolean }[] }[];
}) {
  // Union semua bulan-tahun lintas periode sebagai header tunggal (panjang tiap
  // periode berbeda-beda — periode lain mungkin tidak mencakup bulan itu sama sekali).
  const columns = useMemo(() => {
    const seen = new Map<string, { bulan: number; tahun: number }>();
    for (const row of history) {
      for (const b of row.bulanan) {
        seen.set(`${b.tahun}-${b.bulan}`, { bulan: b.bulan, tahun: b.tahun });
      }
    }
    return [...seen.values()].sort((a, b) => a.tahun - b.tahun || a.bulan - b.bulan);
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <CalendarCheck className="size-10 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">Belum ada riwayat donasi</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="sticky left-0 bg-muted/50 px-3">Batch</TableHead>
            {columns.map((c) => (
              <TableHead key={`${c.tahun}-${c.bulan}`} className="px-3 text-center">
                {BULAN_PENDEK[c.bulan - 1]} {String(c.tahun).slice(2)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((row) => {
            const byCol = new Map(row.bulanan.map((b) => [`${b.tahun}-${b.bulan}`, b.donasi]));
            return (
              <TableRow key={row.periode_id}>
                <TableCell className="sticky left-0 bg-card px-3 font-medium">
                  {row.periode_nama}
                  {row.aktif && (
                    <Badge variant="outline" className="ml-1.5 text-primary">
                      aktif
                    </Badge>
                  )}
                </TableCell>
                {columns.map((c) => {
                  const key = `${c.tahun}-${c.bulan}`;
                  const donasi = byCol.get(key);
                  return (
                    <TableCell key={key} className="px-3 text-center">
                      {donasi === undefined ? (
                        <span className="text-muted-foreground/50">—</span>
                      ) : donasi ? (
                        "✅"
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function HighlightGrid() {
  const { data: highlights, isLoading } = useHighlight();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!highlights || highlights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <Sparkles className="size-10 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">Belum ada highlight</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {highlights.map((h) => {
        const card = (
          <Card className="gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
            {h.gambar_url ? (
              <img src={h.gambar_url} alt={h.judul} className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-muted text-muted-foreground">
                <Sparkles className="size-6" />
              </div>
            )}
            <CardContent className="space-y-1 p-3">
              {(h.kategori || h.tanggal) && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {h.kategori && (
                    <Badge variant="secondary" className="font-normal">
                      {HIGHLIGHT_KATEGORI_LABEL[h.kategori] ?? h.kategori}
                    </Badge>
                  )}
                  {h.tanggal && <span className="text-muted-foreground">{highlightTanggal(h.tanggal)}</span>}
                </div>
              )}
              <div className="text-sm font-medium line-clamp-2">{h.judul}</div>
              {h.link_ig && (
                <span className="inline-flex items-center gap-1 text-xs text-primary group-hover:underline">
                  🔗 Lihat di IG
                </span>
              )}
            </CardContent>
          </Card>
        );
        // link_ig opsional — poster tanpa post IG dirender tanpa tautan
        return h.link_ig ? (
          <a key={h.id} href={h.link_ig} target="_blank" rel="noreferrer" className="group">
            {card}
          </a>
        ) : (
          <div key={h.id}>{card}</div>
        );
      })}
    </div>
  );
}

export function BerandaPage() {
  const profile = useAuthStore((s) => s.profile);
  const { data, isLoading } = useMyDashboard();
  // Ajakan patungan di Beranda memakai komponen yang sama dengan halaman
  // terkunci — satu sumber copy. Hanya tampil saat gating aktif & belum donasi.
  const { locked, status } = useDonaturStatus();
  const firstName = profile?.nama?.split(" ")[0] ?? "";

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">
          👋 Halo{firstName ? `, Kak ${firstName}` : ""}! Terima kasih telah menjadi bagian
          dari perjalanan para beswan.
        </h1>
        <p className="text-muted-foreground">Kontribusimu sangat berarti! 💚</p>
      </div>

      <EmailBanner />

      {locked && <AjakPatunganPanel status={status} compact />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Wallet}
          label="Total Donasi Kamu"
          value={data ? formatRupiah(data.total_donasi) : "—"}
          loading={isLoading}
        />
        <StatCard
          icon={CalendarCheck}
          label="Konsistensi Bulan Ini"
          value={data ? `${data.konsistensi_bulan_ini_terpenuhi}/${data.konsistensi_bulan_ini_total}` : "—"}
          loading={isLoading}
        />
        <StatCard
          icon={Tag}
          label="Batch Diikuti"
          value={data?.batch_diikuti.join(", ") || "—"}
          loading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History Konsistensi Donasi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : (
            <HistoryKonsistensiTable history={data?.history_konsistensi ?? []} />
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Highlight GBB</h2>
        <HighlightGrid />
      </section>
    </div>
  );
}
