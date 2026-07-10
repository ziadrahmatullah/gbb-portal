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
}

export interface MentorDetail extends Mentor {
  email?: string;
  hp?: string;
  cv_url?: string | null;
}

export async function getMentorList(params: ListParams = {}) {
  const res = await apiClient.get<Mentor[]>("/internal/mentor", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

// Tidak ada endpoint stats mentor — agregasi dari total_item dua query ringan
// (pola yang sama dengan stats Library).
export async function getMentorStats() {
  const [internal, eksternal] = await Promise.all([
    getMentorList({ limit: 1, is_internal: "true" }),
    getMentorList({ limit: 1, is_internal: "false" }),
  ]);
  return {
    undip: internal.totalItems,
    nonUndip: eksternal.totalItems,
    total: internal.totalItems + eksternal.totalItems,
  };
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
