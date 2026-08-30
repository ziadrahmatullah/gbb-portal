import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto refleksi (view internal). List terurut bulan
// refleksi terbaru dulu dari backend.
export interface RefleksiRes {
  id: number;
  beswan_id: number;
  beswan_nama: string;
  periode_id: number;
  bulan: number; // 1-12
  tahun: number;
  status: string; // draft | submitted
  submitted_at?: string | null;
  ringkasan_donatur?: string | null;
  ringkasan_status?: string | null;
}

export interface JawabanRes {
  pertanyaan_id: number;
  seksi: string;
  label: string;
  nilai: string;
}

// Detail = item list + jawaban terurut sesuai urutan pertanyaan (siap render,
// tidak perlu fetch bank pertanyaan)
export interface RefleksiDetailRes extends RefleksiRes {
  jawaban: JawabanRes[];
}

export type RefleksiListParams = ListParams & {
  periode_id?: string;
  beswan_id?: number;
  status?: "draft" | "submitted";
};

export async function listRefleksi(params: RefleksiListParams = {}) {
  const res = await apiClient.get<RefleksiRes[]>("/internal/refleksi", {
    page: 1,
    limit: 10,
    ...params,
  });
  return toPaged(res);
}

export async function getRefleksiDetail(id: number) {
  const res = await apiClient.get<RefleksiDetailRes>(`/internal/refleksi/${id}`);
  return res.data;
}
