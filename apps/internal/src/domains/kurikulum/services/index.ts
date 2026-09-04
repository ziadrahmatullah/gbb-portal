import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/kurikulum_dto.go
export interface Topik {
  id: number;
  periode_id: number;
  periode_nama: string; // mis. "GBB 2025 Genap"
  urutan: number;
  judul: string;
  detail: string;
  tor_url: string;
  status: string; // planned | ongoing | done
}

// Media (rekaman/slide) tidak lagi di-embed di list — ambil per topik lewat
// GET /internal/kurikulum/topik/:id
export interface TopikMediaRes {
  event_id: number;
  nama_event: string;
  tanggal: string; // ISO
  youtube_url?: string | null;
  slide_url?: string | null;
}

export interface TopikDetailRes extends Topik {
  media: TopikMediaRes[]; // semua event tertaut, urut tanggal ASC
}

// Create/update topik = multipart (BUKAN JSON): TOR di-upload sebagai file
// "tor" ke storage backend. tor_url tidak lagi diterima sebagai input —
// response TopikRes tetap berisi tor_url (URL file yang dihosting backend).
export interface CreateTopikReq {
  periode_id: number;
  urutan: number;
  judul: string;
  detail?: string;
  tor?: File;
}

export interface UpdateTopikReq {
  urutan?: number;
  judul?: string;
  detail?: string;
  status?: "planned" | "ongoing" | "done";
  tor?: File;
}

export interface LibraryItem {
  id: number;
  event_id?: number | null;
  nama: string;
  deskripsi: string;
  file_url: string;
  ai_summary?: string | null; // hasil AI, read-only
  tags?: string | null; // comma-separated
  tipe: string; // event_materi | upload
}

export interface UpdateLibraryReq {
  nama?: string;
  deskripsi?: string;
  tags?: string;
}

// Status usulan (FEpromt32): pending = Menunggu Review, approved = Disetujui,
// rejected = Ditolak; "reviewed" = status lama sebelum ada keputusan.
export type TopikUsulanStatus = "pending" | "reviewed" | "approved" | "rejected";

export interface TopikUsulan {
  id: number;
  beswan_id: number;
  nama_beswan: string;
  topik_usulan: string;
  status: string; // TopikUsulanStatus
  catatan?: string | null; // catatan PCM, tampil juga di portal beswan
  created_at?: string;
}

export interface LibraryStats {
  total_materi: number;
  dari_event: number;
  upload_manual: number;
}

// ─── Topik ───────────────────────────────────────────────────────────────

export async function getTopikList(params: ListParams = {}) {
  const res = await apiClient.get<Topik[]>("/internal/kurikulum/topik", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

export async function getTopikDetail(id: number) {
  const res = await apiClient.get<TopikDetailRes>(`/internal/kurikulum/topik/${id}`);
  return res.data;
}

export async function createTopik(body: CreateTopikReq) {
  const form = new FormData();
  form.append("periode_id", String(body.periode_id));
  form.append("urutan", String(body.urutan));
  form.append("judul", body.judul);
  if (body.detail) form.append("detail", body.detail);
  if (body.tor) form.append("tor", body.tor);
  const res = await apiClient.post<Topik>("/internal/kurikulum/topik", form);
  return res.data;
}

// Tanpa file "tor" = TOR yang ada tidak berubah
export async function updateTopik(id: number, body: UpdateTopikReq) {
  const form = new FormData();
  if (body.urutan !== undefined) form.append("urutan", String(body.urutan));
  if (body.judul) form.append("judul", body.judul);
  if (body.detail !== undefined) form.append("detail", body.detail);
  if (body.status) form.append("status", body.status);
  if (body.tor) form.append("tor", body.tor);
  const res = await apiClient.put<Topik>(`/internal/kurikulum/topik/${id}`, form);
  return res.data;
}

export async function deleteTopik(id: number) {
  const res = await apiClient.delete(`/internal/kurikulum/topik/${id}`);
  return res.message;
}

export interface CopyTopikRes {
  copied: number;
  topik: Topik[];
}

// POST /internal/kurikulum/topik/copy (role admin/pcm) — salin SEMUA topik
// periode sumber ke periode tujuan: urutan dipertahankan, status di-reset ke
// "planned", dan bila tujuan sudah punya topik salinan di-append setelah
// urutan tertingginya (tidak menimpa).
export async function copyTopik(sourcePeriodeId: number, targetPeriodeId: number) {
  const res = await apiClient.post<CopyTopikRes>("/internal/kurikulum/topik/copy", {
    source_periode_id: sourcePeriodeId,
    target_periode_id: targetPeriodeId,
  });
  return res.data;
}

// ─── Library ─────────────────────────────────────────────────────────────

export async function getLibraryList(params: ListParams = {}) {
  const res = await apiClient.get<LibraryItem[]>("/internal/kurikulum/library", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

export async function getLibraryStats() {
  const res = await apiClient.get<LibraryStats>("/internal/kurikulum/library/stats");
  return res.data;
}

// POST multipart: file wajib; tipe selalu "upload" (entri event_materi
// dibuat otomatis backend saat event disimpan dengan Youtube/Slide URL)
export async function createLibrary(form: FormData) {
  const res = await apiClient.post<LibraryItem>("/internal/kurikulum/library", form);
  return res.data;
}

// PUT JSON — file & tipe TIDAK bisa diganti setelah dibuat
export async function updateLibrary(id: number, body: UpdateLibraryReq) {
  const res = await apiClient.put<LibraryItem>(`/internal/kurikulum/library/${id}`, body);
  return res.data;
}

export async function deleteLibrary(id: number) {
  const res = await apiClient.delete(`/internal/kurikulum/library/${id}`);
  return res.message;
}

// ─── Topik Usulan ─────────────────────────────────────────────────────────

export async function getTopikUsulanList(params: ListParams = {}) {
  const res = await apiClient.get<TopikUsulan[]>("/internal/kurikulum/topik-usulan", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

export async function updateTopikUsulanStatus(
  id: number,
  status: TopikUsulanStatus,
  catatan?: string
) {
  const res = await apiClient.put<TopikUsulan>(`/internal/kurikulum/topik-usulan/${id}`, {
    status,
    ...(catatan !== undefined ? { catatan } : {}),
  });
  return res.data;
}

// ─── Event options (untuk dropdown event_id di form upload) ──────────────
// Sementara di sini; pindah ke domain event saat modul Event dibangun.

export interface EventOption {
  id: number;
  nama_event: string;
}

export async function getEventOptions() {
  const res = await apiClient.get<EventOption[]>("/internal/event", { page: 1, limit: 100 });
  return toPaged(res);
}
