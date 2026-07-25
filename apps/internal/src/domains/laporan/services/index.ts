import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/laporan_dto.go
// Enum tertutup di backend (binding oneof)
export const LAPORAN_TIPE_OPTIONS = ["booklet", "keuangan", "internal"] as const;
export type LaporanTipe = (typeof LAPORAN_TIPE_OPTIONS)[number];

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
