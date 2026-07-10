import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/kurikulum_dto.go
export interface Topik {
  id: number;
  periode_id: number;
  urutan: number;
  judul: string;
  detail: string;
  tor_url: string;
  status: string; // planned | ongoing | done
}

export interface CreateTopikReq {
  periode_id: number;
  urutan: number;
  judul: string;
  detail?: string;
  tor_url?: string;
}

export interface UpdateTopikReq {
  urutan?: number;
  judul?: string;
  detail?: string;
  tor_url?: string;
  status?: "planned" | "ongoing" | "done";
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

export interface TopikUsulan {
  id: number;
  beswan_id: number;
  topik_usulan: string;
  status: string; // pending | reviewed
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

export async function createTopik(body: CreateTopikReq) {
  const res = await apiClient.post<Topik>("/internal/kurikulum/topik", body);
  return res.data;
}

export async function updateTopik(id: number, body: UpdateTopikReq) {
  const res = await apiClient.put<Topik>(`/internal/kurikulum/topik/${id}`, body);
  return res.data;
}

export async function deleteTopik(id: number) {
  const res = await apiClient.delete(`/internal/kurikulum/topik/${id}`);
  return res.message;
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

// Tidak ada endpoint stats library untuk portal internal —
// agregasi dari total_item dua query ringan (limit=1) per tipe.
export async function getLibraryStats() {
  const [eventMateri, upload] = await Promise.all([
    getLibraryList({ limit: 1, tipe: "event_materi" }),
    getLibraryList({ limit: 1, tipe: "upload" }),
  ]);
  return {
    dariEvent: eventMateri.totalItems,
    uploadManual: upload.totalItems,
    total: eventMateri.totalItems + upload.totalItems,
  };
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

// ─── Topik Usulan (read-only untuk internal) ─────────────────────────────

export async function getTopikUsulanList(params: ListParams = {}) {
  const res = await apiClient.get<TopikUsulan[]>("/internal/kurikulum/topik-usulan", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
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
