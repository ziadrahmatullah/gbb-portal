import { apiClient } from "@/shared/lib/apiClient";

// Mirror kontrak yang diminta ke backend di gbb-backend/promt/FEpromt25.txt §1
// (GET /donatur/status). BE yang menghitung aturan aktif/tidak — FE tidak
// pernah menurunkannya sendiri dari history_konsistensi.
export type StatusAlasan =
  | "aktif_bulan_ini"
  | "dalam_grace"
  | "semester_masih_berlaku"
  | "donatur_baru"
  | "belum_donasi_bulan_ini"
  | "tidak_ada_periode_aktif";

export interface DonaturStatus {
  is_aktif_bulan_ini: boolean;
  alasan: StatusAlasan;
  bulan_ini: string; // "2026-09"
  skema_efektif: string;
  donasi_terakhir_bulan?: string | null;
  grace_sampai?: string | null;
  punya_periode_aktif: boolean;
}

// Flag rilis: gating menu baru aktif kalau VITE_GATING_ENABLED=true. Default
// MATI — UI-nya sudah lengkap, tapi endpoint /donatur/status belum live; tanpa
// flag ini portal berperilaku persis seperti sebelumnya.
export const GATING_ENABLED = import.meta.env.VITE_GATING_ENABLED === "true";

export async function getDonaturStatus() {
  const res = await apiClient.get<DonaturStatus>("/donatur/status");
  return res.data;
}
