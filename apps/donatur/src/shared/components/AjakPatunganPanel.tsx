import { HeartHandshake, MessageCircle, Sparkles } from "lucide-react";
import { Button, waLink } from "@gbb/ui";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { WA_ADMIN, waAdminText } from "@/shared/lib/waAdmin";
import type { DonaturStatus } from "@/shared/lib/donaturStatus";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
function bulanLabel(ym?: string) {
  if (!ym) return "ini";
  const [y, m] = ym.split("-").map(Number);
  return `${BULAN[m - 1] ?? ""} ${y}`.trim();
}

// Panel ajakan untuk donatur yang belum patungan bulan ini. Dipakai bersama
// oleh RequireAktif (halaman terkunci) dan CTA di Beranda supaya copy-nya satu.
// Sengaja BUKAN register "akses ditolak" (ikon merah) — tujuannya mengajak,
// bukan menghukum. Dua state berbeda dari `alasan`:
//   tidak_ada_periode_aktif → tidak ada batch tujuan, arahkan ke AnC
//   lainnya                 → ajak patungan bulan ini
export function AjakPatunganPanel({
  status,
  fitur,
  compact,
}: {
  status?: DonaturStatus;
  // Nama fitur yang terkunci, mis. "Data Beswan" — untuk kalimat pembuka
  fitur?: string;
  compact?: boolean;
}) {
  const profile = useAuthStore((s) => s.profile);
  const nama = profile?.nama?.split(" ")[0] || "Kak";
  const tanpaBatch = status?.alasan === "tidak_ada_periode_aktif";

  const waText = tanpaBatch
    ? waAdminText(profile, "ingin didaftarkan ke batch patungan yang sedang aktif")
    : waAdminText(profile, "sudah transfer patungan bulan ini dan ingin dikonfirmasi");

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-primary/30 bg-primary/5 p-4"
          : "flex min-h-[60vh] items-center justify-center px-4"
      }
    >
      <div className={compact ? "flex flex-col gap-3 sm:flex-row sm:items-center" : "max-w-lg rounded-xl bg-card p-8 text-center shadow-md"}>
        {!compact && (
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <HeartHandshake className="h-7 w-7 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <h2 className={compact ? "font-semibold" : "text-lg font-semibold"}>
            {tanpaBatch
              ? `Kak ${nama}, akunmu belum terhubung ke batch aktif`
              : `Bulan ${bulanLabel(status?.bulan_ini)} Kak ${nama} belum melakukan patungan — yuk patungan dulu, Kak! 💚`}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {tanpaBatch ? (
              <>
                Menu {fitur ? <strong>{fitur}</strong> : "lengkap portal"} terbuka setelah kamu
                terdaftar di batch patungan yang sedang berjalan. Hubungi Tim AnC untuk didaftarkan.
              </>
            ) : (
              <>
                {fitur ? <>Menu <strong>{fitur}</strong>, </> : "Menu "}
                Daftar Mentor, Data Beswan, dan Laporan terbuka lagi begitu patungan bulan ini
                tercatat oleh Tim AnC. Kalau sudah transfer, kabari kami supaya segera dikonfirmasi.
              </>
            )}
          </p>
          {status?.donasi_terakhir_bulan && !tanpaBatch && (
            <p className="mt-1 text-xs text-muted-foreground">
              Patungan terakhirmu tercatat {bulanLabel(status.donasi_terakhir_bulan)}. Terima kasih! 🙏
            </p>
          )}
        </div>
        <div className={compact ? "flex shrink-0 gap-2" : "mt-5 flex flex-wrap justify-center gap-2"}>
          <Button asChild size={compact ? "sm" : "default"}>
            <a href={waLink(WA_ADMIN, waText)} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" />
              {tanpaBatch ? "Hubungi Tim AnC" : "Konfirmasi patungan"}
            </a>
          </Button>
          {!compact && !tanpaBatch && (
            <Button asChild variant="outline">
              <a href="/beranda">
                <Sparkles className="h-4 w-4" />
                Lihat riwayat donasi
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
