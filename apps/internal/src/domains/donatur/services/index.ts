import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/donatur_dto.go
export interface DonaturPeriodeInfo {
  periode_id: number;
  periode_nama: string;
  status: string; // aktif | tidak_aktif
  nominal?: number | null;
  skema?: string | null;
}

export interface Donatur {
  id: number;
  kode: string;
  nama: string;
  email: string;
  hp: string;
  organisasi: string;
  nominal_default?: number | null;
  skema: string; // sebulan_patungan | semester_patungan | sebulan_donasi | semester_donasi | belum_bersedia
  is_checked: boolean;
  has_password: boolean;
  tags?: string[];
  periodes?: DonaturPeriodeInfo[];
}

export interface DonaturStats {
  total: number;
  aktif_periode: number;
  belum_diklasifikasi: number;
  belum_set_password: number;
}

export interface MonitoringBulan {
  bulan: string; // YYYY-MM
  nominal: number;
}

export interface DonaturMonitoring {
  id: number;
  kode: string;
  nama: string;
  hp: string;
  skema: string;
  tags: string[];
  periode_akhir_id?: number | null;
  periode_akhir?: string;
  periode_akhir_aktif: boolean;
  bulanan: MonitoringBulan[]; // kosong kalau tanpa filter periode
  total: number;
}

// Minimal untuk dropdown/lookup lintas modul (dipakai klasifikasi cashflow)
export interface DonaturOption {
  id: number;
  kode: string;
  nama: string;
}

export const SKEMA_OPTIONS = [
  { value: "sebulan_patungan", label: "Sebulan Patungan" },
  { value: "semester_patungan", label: "1 Semester Patungan" },
  { value: "sebulan_donasi", label: "Sebulan Donasi" },
  { value: "semester_donasi", label: "1 Semester Donasi" },
  { value: "belum_bersedia", label: "Belum Bersedia" },
] as const;

export const skemaLabel = (v: string) =>
  SKEMA_OPTIONS.find((s) => s.value === v)?.label ?? v;

export const DONATUR_TAGS = [
  { value: "sudah_konfirmasi", label: "Sudah Konfirmasi", icon: "✅" },
  { value: "donatur_setia", label: "Donatur Setia", icon: "⭐" },
  { value: "baru_bergabung", label: "Baru Bergabung", icon: "🆕" },
  { value: "perlu_followup", label: "Perlu Follow-Up", icon: "🔴" },
  { value: "sulit_dihubungi", label: "Sulit Dihubungi", icon: "⚠️" },
  { value: "sementara_berhenti", label: "Sementara Berhenti", icon: "⏸️" },
  { value: "sudah_ditandai", label: "Sudah Ditandai", icon: "☑️" },
] as const;

export const tagMeta = (v: string) => DONATUR_TAGS.find((t) => t.value === v);

// ─── List / stats / detail ───────────────────────────────────────────────

export async function getDonaturList(params: ListParams = {}) {
  const res = await apiClient.get<Donatur[]>("/internal/donatur", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

export async function getDonaturStats() {
  const res = await apiClient.get<DonaturStats>("/internal/donatur/stats");
  return res.data;
}

export async function createDonatur(body: {
  nama: string;
  email: string;
  password: string;
  hp?: string;
  organisasi?: string;
  nominal_default?: number;
  skema: string;
}) {
  const res = await apiClient.post<Donatur>("/internal/donatur", body);
  return res.data;
}

// Mirror UpdateDonaturReq — selain catatan/is_checked, profil (nama..nominal_default)
// kini bisa dikoreksi manual (string kosong / field absen = tidak diubah)
export interface UpdateDonaturReq {
  catatan?: string;
  is_checked?: boolean;
  nama?: string;
  email?: string;
  hp?: string;
  organisasi?: string;
  skema?: string;
  nominal_default?: number;
}

export async function updateDonatur(id: number, body: UpdateDonaturReq) {
  const res = await apiClient.put<Donatur>(`/internal/donatur/${id}`, body);
  return res.data;
}

// Upsert keikutsertaan per periode (men-drive checkbox matriks)
export async function assignPeriode(
  id: number,
  body: { periode_id: number; nominal?: number; skema?: string; status: "aktif" | "tidak_aktif" }
) {
  const res = await apiClient.post(`/internal/donatur/${id}/periode`, body);
  return res.data;
}

// Hapus baris donatur_periode sepenuhnya — beda dari assignPeriode(status:
// "tidak_aktif") yang cuma upsert status, baris lama tetap ada.
export async function removePeriode(id: number, periodeId: number) {
  const res = await apiClient.delete(`/internal/donatur/${id}/periode/${periodeId}`);
  return res.message;
}

export async function addTag(id: number, tag: string) {
  const res = await apiClient.post(`/internal/donatur/${id}/tag`, { tag });
  return res.message;
}

export async function removeTag(id: number, tag: string) {
  const res = await apiClient.delete(`/internal/donatur/${id}/tag/${tag}`);
  return res.message;
}

// ─── Password (login donatur pakai email+password, bukan Google OAuth lagi) ──

// Admin/AnC set password baru untuk donatur, tanpa perlu password lama
// (mis. saat donatur lupa password) — pengganti fitur Link Akun yang lama.
export async function resetDonaturPassword(id: number, password: string) {
  const res = await apiClient.put(`/internal/donatur/${id}/reset-password`, { password });
  return res.message;
}

// ─── Monitoring ──────────────────────────────────────────────────────────

export async function getMonitoringList(params: ListParams = {}) {
  const res = await apiClient.get<DonaturMonitoring[]>("/internal/donatur/monitoring", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

// ─── Pesan template (untuk tombol Kirim WA; GET boleh diakses anc) ────────

export interface PesanTemplate {
  id: number;
  nama: string;
  konteks: string;
  isi: string;
  urutan: number;
  is_default: boolean;
  aktif: boolean;
}

export async function getPesanTemplates() {
  const res = await apiClient.get<PesanTemplate[]>("/internal/settings/pesan-template", {
    limit: 100,
  });
  return toPaged(res);
}
