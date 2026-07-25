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
