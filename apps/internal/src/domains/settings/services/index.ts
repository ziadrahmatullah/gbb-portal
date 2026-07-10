import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";
import type { Role } from "@/shared/constants/roles";

// Mirror gbb-backend dto/settings_dto.go

// ─── Users & Role ────────────────────────────────────────────────────────

export interface User {
  id: number;
  nama: string;
  email: string;
  role: Role;
  divisi: string;
  is_active: boolean;
}

export interface CreateUserReq {
  nama: string;
  email: string;
  password: string; // min 8
  role: Role;
  divisi?: string;
}

// Email/password tidak lewat sini. is_active opsional (omit = tidak diubah).
export interface UpdateUserReq {
  nama?: string;
  role?: Role;
  divisi?: string;
  is_active?: boolean;
}

export async function getUserList(params: ListParams = {}) {
  const res = await apiClient.get<User[]>("/internal/settings/users", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

export async function createUser(body: CreateUserReq) {
  const res = await apiClient.post<User>("/internal/settings/users", body);
  return res.data;
}

export async function updateUser(id: number, body: UpdateUserReq) {
  const res = await apiClient.put<User>(`/internal/settings/users/${id}`, body);
  return res.data;
}

// Backend punya 3 pengaman 409: hapus diri sendiri, admin terakhir,
// user yang masih direferensikan data lain — pesan errornya tampilkan apa adanya.
export async function deleteUser(id: number) {
  const res = await apiClient.delete(`/internal/settings/users/${id}`);
  return res.message;
}

// Reset password oleh admin — tanpa password lama (memulihkan akun yang tak bisa diakses)
export async function resetUserPassword(id: number, password: string) {
  const res = await apiClient.put(`/internal/settings/users/${id}/reset-password`, { password });
  return res.message;
}

// Ganti password sendiri (semua role login) — BUKAN di bawah /settings
export async function changeMyPassword(oldPassword: string, newPassword: string) {
  const res = await apiClient.put("/internal/account/change-password", {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return res.message;
}

// ─── Template Pesan WA ───────────────────────────────────────────────────
// (Tipe PesanTemplate + GET list sudah ada di domains/donatur/services — reuse.)

export interface PesanTemplateBody {
  nama: string;
  konteks?: string;
  isi: string; // placeholder format {{nama}} {{kode}} {{bulan}} {{bulan_berikutnya}} {{nominal}}
  urutan?: number;
  is_default?: boolean;
  aktif?: boolean;
}

export async function createPesanTemplate(body: PesanTemplateBody) {
  const res = await apiClient.post("/internal/settings/pesan-template", body);
  return res.data;
}

export async function updatePesanTemplate(id: number, body: Partial<PesanTemplateBody>) {
  const res = await apiClient.put(`/internal/settings/pesan-template/${id}`, body);
  return res.data;
}

export async function deletePesanTemplate(id: number) {
  const res = await apiClient.delete(`/internal/settings/pesan-template/${id}`);
  return res.message;
}

// ─── Konfigurasi AI ──────────────────────────────────────────────────────

export interface AIConfig {
  id: number;
  provider: string; // anthropic | openai_compatible
  label: string;
  model: string;
  base_url?: string | null;
  aktif: boolean;
  // api_key TIDAK PERNAH ada di response (sengaja — server-only, terenkripsi)
}

export interface CreateAIConfigReq {
  provider: string;
  label: string;
  model: string;
  base_url?: string; // wajib untuk openai_compatible
  api_key: string;
}

// api_key opsional: OMIT (jangan kirim key kosong) = pertahankan key lama
export interface UpdateAIConfigReq {
  label?: string;
  model?: string;
  base_url?: string;
  api_key?: string;
}

export async function getAIConfigList(params: ListParams = {}) {
  const res = await apiClient.get<AIConfig[]>("/internal/settings/ai-config", {
    page: 1,
    limit: 50,
    ...params,
  });
  return toPaged(res);
}

export async function createAIConfig(body: CreateAIConfigReq) {
  const res = await apiClient.post<AIConfig>("/internal/settings/ai-config", body);
  return res.data;
}

export async function updateAIConfig(id: number, body: UpdateAIConfigReq) {
  const res = await apiClient.put<AIConfig>(`/internal/settings/ai-config/${id}`, body);
  return res.data;
}

export async function deleteAIConfig(id: number) {
  const res = await apiClient.delete(`/internal/settings/ai-config/${id}`);
  return res.message;
}

// Set jadi satu-satunya provider aktif (yang lain otomatis nonaktif)
export async function setActiveAIConfig(id: number) {
  const res = await apiClient.put(`/internal/settings/ai-config/${id}/aktif`);
  return res.message;
}
