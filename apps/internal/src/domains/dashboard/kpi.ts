import type { ProgressBeswan } from "./services";

// ─── Ambang KPI (versi awal, masukan PCM Sep 2026 slide 18) ──────────────
// Sementara konstanta FE. Deck meminta angka ini bisa diatur admin — itu butuh
// tabel setting + endpoint evaluasi di backend (lihat plan "ajuan-pcm-3" &
// FEpromt32). Saat BE-nya ada, widget ini cukup membaca hasil evaluasi BE.
export const KPI_DEFAULT = {
  kehadiran_min: 90, // % — "Kehadiran di bawah standar (misal: 90%)"
  // Refleksi dianggap tertinggal bila bulan yang belum diisi > angka ini —
  // bulan berjalan biasanya memang belum diisi, jadi 1 bulan kosong = wajar.
  // (Uji visual 4 Sep: dengan ambang 0, 18/18 beswan ter-flag → tidak berguna.)
  refleksi_tertinggal_max: 1,
} as const;

export interface Indikator {
  key: "kehadiran" | "refleksi";
  label: string;
}

// Indikator yang GAGAL untuk satu beswan, dari data progress_beswan yang sudah
// ada di GET /dashboard/analitik-beswan. Tugas ≥95%, IPK menurun, mentoring,
// dan follow-up belum bisa dihitung di FE (datanya tidak ada di response ini).
export function indikatorGagal(p: ProgressBeswan): Indikator[] {
  const out: Indikator[] = [];
  if (p.hadir_persen < KPI_DEFAULT.kehadiran_min) {
    out.push({
      key: "kehadiran",
      label: `Kehadiran ${Math.round(p.hadir_persen)}% (< ${KPI_DEFAULT.kehadiran_min}%)`,
    });
  }
  if (
    p.refleksi_total > 0 &&
    p.refleksi_total - p.refleksi_selesai > KPI_DEFAULT.refleksi_tertinggal_max
  ) {
    out.push({
      key: "refleksi",
      label: `Refleksi ${p.refleksi_selesai}/${p.refleksi_total}`,
    });
  }
  return out;
}

