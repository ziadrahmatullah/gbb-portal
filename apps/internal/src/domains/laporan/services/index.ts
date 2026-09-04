import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/laporan_dto.go
// Enum tertutup di backend (binding oneof). `publikasi` = infografis/poster
// (PNG/JPG boleh) — FEpromt25 §4.
export const LAPORAN_TIPE_OPTIONS = ["booklet", "keuangan", "publikasi", "internal"] as const;
export type LaporanTipe = (typeof LAPORAN_TIPE_OPTIONS)[number];
export const LAPORAN_TIPE_LABEL: Record<LaporanTipe, string> = {
  booklet: "Booklet",
  keuangan: "Keuangan",
  publikasi: "Publikasi",
  internal: "Internal",
};

// allowedLaporanMime di BE = dokumen ∪ gambar (png/jpeg), maks 5MB
export const LAPORAN_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg";

export function isImageFile(url?: string | null) {
  return /\.(png|jpe?g)(\?|$)/i.test(url ?? "");
}

export interface Laporan {
  id: number;
  judul: string;
  tipe: LaporanTipe;
  file_url: string;
  periode_id?: number | null;
  is_public: boolean;
}

export interface UpdateLaporanReq {
  judul?: string;
  tipe?: LaporanTipe;
  is_public?: boolean;
}

export async function getLaporanList(params: ListParams = {}) {
  const res = await apiClient.get<Laporan[]>("/internal/laporan", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

// POST multipart: judul, tipe, periode_id?, is_public, file (wajib)
export async function createLaporan(form: FormData) {
  const res = await apiClient.post<Laporan>("/internal/laporan", form);
  return res.data;
}

// PUT JSON partial — file TIDAK bisa diganti lewat edit
export async function updateLaporan(id: number, body: UpdateLaporanReq) {
  const res = await apiClient.put<Laporan>(`/internal/laporan/${id}`, body);
  return res.data;
}

export async function deleteLaporan(id: number) {
  const res = await apiClient.delete(`/internal/laporan/${id}`);
  return res.message;
}
