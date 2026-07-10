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
  linked_email?: string | null;
  tags?: string[];
  periodes?: DonaturPeriodeInfo[];
}

export interface DonaturStats {
  total: number;
  aktif_periode: number;
  belum_diklasifikasi: number;
  belum_terlink: number;
}

export interface PendingLogin {
  email: string;
  nama: string;
  first_seen_at: string;
  last_seen_at: string;
  attempt_count: number;
}

export interface MonitoringBulan {
  bulan: string; // YYYY-MM
  nominal: number;
}

export interface DonaturMonitoring {
  id: number;
  kode: string;
  nama: string;
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
  hp?: string;
  organisasi?: string;
  nominal_default?: number;
  skema: string;
}) {
  const res = await apiClient.post<Donatur>("/internal/donatur", body);
  return res.data;
}

// PUT hanya menerima catatan & is_checked (profil di-mirror dari Sheets, read-only)
export async function updateDonatur(id: number, body: { catatan?: string; is_checked?: boolean }) {
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

export async function addTag(id: number, tag: string) {
  const res = await apiClient.post(`/internal/donatur/${id}/tag`, { tag });
  return res.message;
}

export async function removeTag(id: number, tag: string) {
  const res = await apiClient.delete(`/internal/donatur/${id}/tag/${tag}`);
  return res.message;
}

// ─── Link akun ───────────────────────────────────────────────────────────

export async function getPendingLogins(search?: string) {
  const res = await apiClient.get<PendingLogin[]>(
    "/internal/donatur/pending-logins",
    search ? { search } : undefined
  );
  return res.data ?? [];
}

export async function linkUser(id: number, email: string) {
  const res = await apiClient.put(`/internal/donatur/${id}/link-user`, { email });
  return res.data;
}

export async function unlinkUser(id: number) {
  const res = await apiClient.delete(`/internal/donatur/${id}/link-user`);
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
