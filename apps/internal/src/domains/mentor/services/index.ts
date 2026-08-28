import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/mentor_dto.go
export interface Mentor {
  id: number;
  nama: string;
  bidang_keahlian: string;
  is_internal: boolean;
  linkedin_url?: string | null;
  jumlah_event: number; // total event sepanjang masa (backend tidak memfilter periode)
  avg_rating?: number | null; // null = belum ada feedback ber-mentor_id
}

export interface MentorEventHistory {
  event_id: number;
  nama_event: string;
  tanggal: string;
  peran: string; // speaker | moderator | fasilitator
  avg_feedback?: number | null;
}

export interface MentorDetail extends Mentor {
  email?: string;
  hp?: string;
  cv_url?: string | null;
  event_history: MentorEventHistory[];
  feedback_kutipan?: string[]; // maks 10 kutipan terbaru
}

export async function getMentorList(params: ListParams = {}) {
  const res = await apiClient.get<Mentor[]>("/internal/mentor", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

// Export Excel: GET /internal/mentor?download=true mengembalikan .xlsx (binary).
// Filter yang sama ikut berlaku; page/limit diabaikan backend — jangan dikirim.
// Nama file dari Content-Disposition (sudah ter-expose lewat CORS), fallback
// "data-mentor.xlsx". Pola sama persis dengan downloadBeswanExcel.
export type MentorExportParams = {
  is_internal?: string; // "true" | "false"
  bidang_keahlian?: string;
  search?: string;
};

export async function downloadMentorExcel(params: MentorExportParams = {}) {
  const res = await apiClient.getBlob("/internal/mentor", { ...params, download: true });
  const disposition = String(res.headers["content-disposition"] ?? "");
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const filename = match?.[1] ? decodeURIComponent(match[1]) : "data-mentor.xlsx";
  return { blob: res.data, filename };
}

export interface MentorStats {
  total: number;
  undip: number;
  non_undip: number;
}

export async function getMentorStats() {
  const res = await apiClient.get<MentorStats>("/internal/mentor/stats");
  return res.data;
}

export async function getMentorDetail(id: number) {
  const res = await apiClient.get<MentorDetail>(`/internal/mentor/${id}`);
  return res.data;
}

// POST/PUT multipart: nama, email, hp, linkedin_url, bidang_keahlian,
// is_internal + cv (file, opsional)
export async function createMentor(form: FormData) {
  const res = await apiClient.post<MentorDetail>("/internal/mentor", form);
  return res.data;
}

export async function updateMentor(id: number, form: FormData) {
  const res = await apiClient.put<MentorDetail>(`/internal/mentor/${id}`, form);
  return res.data;
}

export async function deleteMentor(id: number) {
  const res = await apiClient.delete(`/internal/mentor/${id}`);
  return res.message;
}
