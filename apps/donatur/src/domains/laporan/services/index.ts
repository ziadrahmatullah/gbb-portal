import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Enum tertutup (binding oneof di backend, seed sudah dimigrasi)
export const LAPORAN_TIPE_OPTIONS = ["booklet", "keuangan", "internal"] as const;
export type LaporanTipe = (typeof LAPORAN_TIPE_OPTIONS)[number];

// Mirror gbb-backend dto/laporan_dto.go LaporanRes
export interface Laporan {
  id: number;
  judul: string;
  tipe: string;
  file_url: string;
  periode_id?: number | null;
  is_public: boolean;
}

// GET /donatur/laporan sudah otomatis filter is_public=true — FE tidak perlu
// filter tambahan untuk itu.
export async function getLaporanList(params: ListParams = {}) {
  const res = await apiClient.get<Laporan[]>("/donatur/laporan", {
    page: 1,
    limit: 50,
    ...params,
  });
  return toPaged(res);
}
