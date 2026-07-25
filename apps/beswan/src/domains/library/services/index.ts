import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/kurikulum_dto.go (LibraryRes)
export interface LibraryItem {
  id: number;
  event_id?: number | null;
  nama: string;
  deskripsi: string;
  file_url: string;
  ai_summary?: string | null; // hasil AI, read-only
  tags?: string | null; // comma-separated — split di FE
  tipe: string; // event_materi | upload
  youtube_url?: string | null; // dari event terkait; null = tidak ada rekaman
}

export interface LibraryStats {
  total_materi: number;
  total_tag: number;
}

export async function getLibraryList(params: ListParams = {}) {
  const res = await apiClient.get<LibraryItem[]>("/beswan/kurikulum/library", {
    page: 1,
    limit: 100, // daftar tag diturunkan dari data ter-load; cap 100 materi
    ...params,
  });
  return toPaged(res);
}

export async function getLibraryStats() {
  const res = await apiClient.get<LibraryStats>("/beswan/kurikulum/library/stats");
  return res.data;
}

// Submit-only — tidak ada endpoint list usulan untuk beswan
export async function usulTopik(topikUsulan: string) {
  const res = await apiClient.post("/beswan/kurikulum/topik-usulan", {
    topik_usulan: topikUsulan,
  });
  return res.data;
}

export const splitTags = (tags?: string | null) =>
  (tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);
