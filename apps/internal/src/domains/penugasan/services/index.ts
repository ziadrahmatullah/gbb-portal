import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/penugasan_dto.go
export interface Penugasan {
  id: number;
  kode_penugasan: string; // di-generate backend
  periode_id: number;
  event_id?: number | null; // null = tugas non-event
  judul: string;
  deskripsi: string;
  lampiran_url?: string | null;
  deadline: string;
  nilai_maks: number;
  status: string; // aktif | selesai
  // backend-computed — langsung dipakai untuk kolom "Kumpul: x/y"
  terkumpul_count: number;
  total_beswan: number;
}

export interface HasilPenugasan {
  id: number; // 0 untuk baris belum_kumpul (belum ada record hasil)
  beswan_id: number;
  nama_beswan: string;
  file_url?: string;
  submitted_at?: string | null;
  terlambat: boolean;
  status: string; // belum_kumpul | submitted | graded
  nilai?: number | null;
  feedback?: string | null;
}

export async function getPenugasanList(params: ListParams = {}) {
  const res = await apiClient.get<Penugasan[]>("/internal/penugasan", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

// GET /internal/penugasan/:id (rilis FEpromt14) — bentuk sama dengan item
// list, termasuk terkumpul_count & total_beswan; 404 bila id tidak ada
export async function getPenugasanById(id: number) {
  const res = await apiClient.get<Penugasan>(`/internal/penugasan/${id}`);
  return res.data ?? null;
}

// Stats wireframe (Total Tugas / Submitted / Belum Kumpul) diagregasi dari
// terkumpul_count & total_beswan hasil list (dibatasi 100 tugas terbaru).
export async function getPenugasanStats(periodeId?: string) {
  const list = await getPenugasanList({
    limit: 100,
    ...(periodeId ? { periode_id: periodeId } : {}),
  });
  const submitted = list.items.reduce((acc, p) => acc + p.terkumpul_count, 0);
  const belumKumpul = list.items.reduce(
    (acc, p) => acc + (p.total_beswan - p.terkumpul_count),
    0
  );
  return { total: list.totalItems, submitted, belumKumpul };
}

// POST multipart: periode_id, event_id?, judul, deskripsi, deadline, nilai_maks,
// lampiran (file opsional). Kode penugasan di-generate backend.
export async function createPenugasan(form: FormData) {
  const res = await apiClient.post<Penugasan>("/internal/penugasan", form);
  return res.data;
}

// PUT multipart partial: judul, deskripsi, deadline, status, lampiran (replace)
export async function updatePenugasan(id: number, form: FormData) {
  const res = await apiClient.put<Penugasan>(`/internal/penugasan/${id}`, form);
  return res.data;
}

export async function deletePenugasan(id: number) {
  const res = await apiClient.delete(`/internal/penugasan/${id}`);
  return res.message;
}

// Roster LENGKAP seluruh beswan periode tugas ini (termasuk belum_kumpul)
export async function getHasilList(penugasanId: number, params: ListParams = {}) {
  const res = await apiClient.get<HasilPenugasan[]>(
    `/internal/penugasan/${penugasanId}/hasil`,
    { page: 1, limit: 100, ...params }
  );
  return toPaged(res);
}

// Set status hasil jadi "graded"; boleh dipanggil ulang untuk revisi nilai
export async function nilaiHasil(hasilId: number, body: { nilai: number; feedback?: string }) {
  const res = await apiClient.post(`/internal/penugasan/hasil/${hasilId}/nilai`, body);
  return res.message;
}
