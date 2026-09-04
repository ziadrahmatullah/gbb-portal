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

// ─── Pratinjau online (masukan PCM Sep 2026) ─────────────────────────────
// Jenis penampil berdasarkan ekstensi file_url: pdf/gambar dirender browser
// (iframe/img), dokumen Office lewat Google Docs Viewer, selain itu hanya
// bisa diunduh.
export type ReaderKind = "pdf" | "image" | "office" | "other";

export function readerKind(url: string): ReaderKind {
  const ext = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) return "office";
  return "other";
}

export const canReadOnline = (url: string) => readerKind(url) !== "other";

// ─── Usulan topik milik beswan (masukan PCM Sep 2026 slide 9) ────────────
// GET /beswan/kurikulum/topik-usulan diminta ke BE lewat FEpromt32. Status:
// pending (Menunggu Review) | approved (Disetujui) | rejected (Ditolak);
// "reviewed" = status lama sebelum ada keputusan setuju/tolak.
export interface MyTopikUsulan {
  id: number;
  topik_usulan: string;
  status: string;
  catatan?: string | null; // catatan PCM untuk beswan, opsional
  created_at?: string;
}

export const USULAN_STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Review",
  reviewed: "Sudah Ditinjau",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export async function getMyTopikUsulan() {
  const res = await apiClient.get<MyTopikUsulan[]>(
    "/beswan/kurikulum/topik-usulan",
    { page: 1, limit: 50 },
    // 404 sebelum BE rilis → bagian "Usulanku" disembunyikan, tanpa toast
    { silent: true }
  );
  return res.data ?? [];
}
