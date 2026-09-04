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
  // Ikut dikembalikan di semua response DonaturRes (list, detail, create, update)
  catatan: string | null;
  warna: string | null;
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
  // Tanpa omitempty di backend — key selalu ada, null kalau belum diisi.
  // catatan kosong tersimpan sebagai "" (bukan null), beda dari warna.
  catatan: string | null;
  warna: string | null; // slug ROW_COLORS; null = ikut warna tag otomatis
  // FEpromt25 §7 — tanda "sudah dikirim WA" per (bulan, konteks), dibagi seluruh
  // staf AnC. Selalu array ([] kalau kosong), tidak tergantung filter periode.
  pesan_terkirim?: PesanTerkirim[];
}

export interface PesanTerkirim {
  bulan: string; // "2026-09"
  konteks: string; // "tgl_7" | "tgl_25" | konteks template lain
  sent_at: string;
}

// POST /internal/donatur/:id/pesan-log (admin, anc) → upsert; klik ulang oleh
// orang lain memperbarui sent_by/sent_at pada baris yang sama.
export async function logPesanTerkirim(id: number, body: { bulan: string; konteks: string }) {
  const res = await apiClient.post<PesanTerkirim & { id: number; sent_by_nama: string }>(
    `/internal/donatur/${id}/pesan-log`,
    body
  );
  return res.data;
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

// Tag yang boleh diatur manual dari dialog Catatan & Tag di Monitoring.
// Sisanya (sudah_konfirmasi, donatur_setia, dst) ditandai dari tempat lain.
export const MANUAL_TAGS = ["perlu_followup", "sulit_dihubungi", "sementara_berhenti"] as const;

// Warna baris monitoring. Disimpan sebagai slug, bukan hex, supaya tema
// gelap/terang tetap FE yang menentukan renderingnya.
export const ROW_COLORS = [
  { value: "merah", label: "Merah", cls: "bg-red-500/10 hover:bg-red-500/15" },
  { value: "kuning", label: "Kuning", cls: "bg-yellow-500/10 hover:bg-yellow-500/15" },
  { value: "hijau", label: "Hijau", cls: "bg-emerald-500/10 hover:bg-emerald-500/15" },
  { value: "biru", label: "Biru", cls: "bg-sky-500/10 hover:bg-sky-500/15" },
  { value: "ungu", label: "Ungu", cls: "bg-violet-500/10 hover:bg-violet-500/15" },
  { value: "abu", label: "Abu", cls: "bg-muted/60 hover:bg-muted" },
] as const;

// Warna otomatis dari tag, dipakai kalau `warna` manual kosong
const TAG_ROW_COLOR: Record<string, string> = {
  perlu_followup: "merah",
  sulit_dihubungi: "kuning",
  sementara_berhenti: "abu",
  donatur_setia: "ungu",
};

// Manual menang; kalau kosong, ikut tag pertama (urutan DONATUR_TAGS) yang punya warna
export function rowColorClass(warna: string | null | undefined, tags: string[] = []) {
  const slug =
    warna ||
    DONATUR_TAGS.map((t) => t.value).find((v) => tags.includes(v) && TAG_ROW_COLOR[v]) ;
  const resolved = slug ? (TAG_ROW_COLOR[slug] ?? slug) : undefined;
  return ROW_COLORS.find((c) => c.value === resolved)?.cls;
}

// Konteks pesan_template yang men-drive dua tombol kirim di Monitoring.
// Konvensi isi data, bukan enum backend — kalau belum ada, FE jatuh ke
// template donatur aktif mana pun.
export const WA_KONTEKS = { tgl25: "tgl_25", tgl7: "tgl_7" } as const;

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

// FEpromt26: password opsional — kosong = donatur menyetel sendiri lewat tautan
// email selamat datang; has_password=false sampai itu dilakukan.
export async function createDonatur(body: {
  nama: string;
  email: string;
  password?: string;
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
  // Hanya untuk warna, "" berarti KOSONGKAN (disimpan NULL → ikut warna tag).
  // Untuk catatan, "" tersimpan apa adanya sebagai string kosong.
  // Nilai selain slug ROW_COLORS ditolak backend dengan 400.
  warna?: string;
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
