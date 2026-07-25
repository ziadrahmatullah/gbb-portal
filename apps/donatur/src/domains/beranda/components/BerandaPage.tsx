import { useMemo, useState } from "react";
import { CalendarCheck, Info, Sparkles, Tag, Wallet, X } from "lucide-react";
import { StatCard } from "@/shared/components/StatCard";
import { formatRupiah, BULAN_PENDEK } from "@/shared/lib/format";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { useHighlight, useMyDashboard } from "../hooks/useBeranda";

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
    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
      <Info className="h-4 w-4 shrink-0 mt-0.5" />
      <p className="flex-1">
        Pastikan email Gmail yang kamu pakai login di portal ini SAMA dengan email saat
        mengisi form bit.ly/AlumniMauBantu. Jika berbeda, hubungi Tim AnC agar akunmu
        dihubungkan, sehingga data beswan &amp; donasi kamu tampil lengkap.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup"
        className="shrink-0 text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
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
      <p className="text-sm text-muted-foreground py-6 text-center rounded-xl border border-dashed">
        Belum ada riwayat donasi
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="py-2 px-3 text-left font-medium sticky left-0 bg-muted/50">Batch</th>
            {columns.map((c) => (
              <th key={`${c.tahun}-${c.bulan}`} className="py-2 px-3 text-center font-medium whitespace-nowrap">
                {BULAN_PENDEK[c.bulan - 1]} {String(c.tahun).slice(2)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((row) => {
            const byCol = new Map(row.bulanan.map((b) => [`${b.tahun}-${b.bulan}`, b.donasi]));
            return (
              <tr key={row.periode_id} className="border-b last:border-0">
                <td className="py-2 px-3 font-medium whitespace-nowrap sticky left-0 bg-card">
                  {row.periode_nama}
                  {row.aktif && <span className="ml-1.5 text-xs text-primary">(aktif)</span>}
                </td>
                {columns.map((c) => {
                  const key = `${c.tahun}-${c.bulan}`;
                  const donasi = byCol.get(key);
                  return (
                    <td key={key} className="py-2 px-3 text-center">
                      {donasi === undefined ? (
                        <span className="text-muted-foreground/50">—</span>
                      ) : donasi ? (
                        "✅"
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HighlightGrid() {
  const { data: highlights, isLoading } = useHighlight();

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!highlights || highlights.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center rounded-xl border border-dashed">
        Belum ada highlight
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {highlights.map((h) => (
        <a
          key={h.id}
          href={h.link_ig}
          target="_blank"
          rel="noreferrer"
          className="group rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          {h.gambar_url ? (
            <img src={h.gambar_url} alt={h.judul} className="h-32 w-full object-cover" />
          ) : (
            <div className="h-32 w-full bg-muted flex items-center justify-center text-muted-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
          )}
          <div className="p-3 space-y-1">
            <div className="text-sm font-medium line-clamp-2">{h.judul}</div>
            <span className="inline-flex items-center gap-1 text-xs text-primary group-hover:underline">
              🔗 Lihat di IG
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}

export function BerandaPage() {
  const profile = useAuthStore((s) => s.profile);
  const { data, isLoading } = useMyDashboard();
  const firstName = profile?.nama?.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">
          👋 Halo{firstName ? `, Kak ${firstName}` : ""}! Terima kasih telah menjadi bagian
          dari perjalanan para beswan.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Kontribusimu sangat berarti! 💚</p>
      </div>

      <EmailBanner />

      <div className="grid sm:grid-cols-3 gap-4">
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">History Konsistensi Donasi</h2>
        {isLoading ? (
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        ) : (
          <HistoryKonsistensiTable history={data?.history_konsistensi ?? []} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Highlight GBB</h2>
        <HighlightGrid />
      </section>
    </div>
  );
}
