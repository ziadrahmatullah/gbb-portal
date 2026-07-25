import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/mentor_dto.go (MentorRes untuk /beswan/mentor)
// Tidak ada email/HP — sengaja (kontak mentor via Tim Program GBB)
export interface Mentor {
  id: number;
  nama: string;
  bidang_keahlian: string;
  is_internal: boolean; // true = badge "🏠 Tim GBB"
  linkedin_url?: string | null;
  jumlah_event: number;
  avg_rating?: number | null; // null = belum ada feedback → jangan render bintang
}

export async function getMentorList(params: ListParams = {}) {
  const res = await apiClient.get<Mentor[]>("/beswan/mentor", {
    page: 1,
    limit: 100,
    ...params,
  });
  return toPaged(res);
}

// Dua mode (radio wireframe), endpoint sama — FE wajib pastikan salah satu terisi.
// Tidak ada endpoint bagi beswan melihat status request-nya (submit-only).
export async function requestMentor(body: { mentor_id?: number; curhat_text?: string }) {
  const res = await apiClient.post("/beswan/mentor/request", body);
  return res.message;
}
