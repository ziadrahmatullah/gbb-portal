import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror MyPenugasanRes — penugasan + hasil milik beswan login. List sudah
// terurut terbaru-dulu dan dibatasi ke periode enrollment beswan oleh
// backend — jangan sort/filter periode di client.
export interface MyPenugasan {
  id: number;
  kode_penugasan: string;
  periode_id: number;
  event_id?: number | null;
  judul: string;
  deskripsi: string;
  lampiran_url?: string | null;
  deadline: string; // ISO
  nilai_maks: number;
  // Status TUGAS (aktif | selesai) — beda dari hasil_status milik beswan
  status: string;
  // Statistik kelas: berapa beswan yang sudah kumpul dari total periode
  terkumpul_count: number;
  total_beswan: number;
  // Milik beswan login; hasil_status absen/null = belum mengumpulkan
  hasil_status?: "submitted" | "graded" | null;
  file_url?: string | null;
  submitted_at?: string | null;
  terlambat: boolean;
  nilai?: number | null;
  feedback?: string | null;
}

export type MyPenugasanListParams = ListParams & {
  status?: "aktif" | "selesai";
};

export async function getMyPenugasanList(params: MyPenugasanListParams = {}) {
  const res = await apiClient.get<MyPenugasan[]>("/beswan/penugasan", {
    page: 1,
    limit: 10,
    ...params,
  });
  return toPaged(res);
}

// 404 bila bukan hak beswan ini
export async function getMyPenugasanDetail(id: number) {
  const res = await apiClient.get<MyPenugasan>(`/beswan/penugasan/${id}`);
  return res.data;
}

// Kumpul / kumpulkan ulang — multipart field "file"; backend otomatis
// menandai terlambat bila melewati deadline
export async function kumpulPenugasan(id: number, file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post(`/beswan/penugasan/${id}/kumpul`, form);
  return res.message;
}
