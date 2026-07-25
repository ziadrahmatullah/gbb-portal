import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/cashflow_dto.go
export interface Cashflow {
  id: number;
  sheet: string; // nama sheet Excel (singkatan bulan, mis. "Agt")
  tanggal: string;
  bulan: string; // "2025-08"
  ft_number?: string | null;
  deskripsi: string;
  nominal: number;
  tipe: string; // cash_in | cash_out
  kat_bsi: string;
  kategori_id?: number | null; // null = belum diklasifikasi
  kategori_nama?: string;
  sub_kategori_id?: number | null;
  sub_kategori_nama?: string;
  donatur_id?: number | null;
  donatur_nama?: string;
  is_anonymous: boolean;
  match_source?: string | null; // "auto" = hasil auto-match upload (badge ✓auto)
  status_klasifikasi: string; // inputted | unknown
  catatan?: string | null;
}

export interface CashflowDuplicate {
  sheet: string;
  tanggal: string;
  ft_number?: string | null;
  deskripsi: string;
  nominal: number;
  tipe: string;
}

export interface UploadCashflowResult {
  inserted: Cashflow[]; // sudah PERSIST di backend (bukan draft)
  duplicates: CashflowDuplicate[]; // dilewati, tidak disimpan, tanpa id
  summary: {
    total_rows: number;
    inserted_count: number;
    duplicate_count: number;
    unknown_count: number;
  };
}

// PUT partial — backend menghitung ulang status_klasifikasi setiap update:
// inputted = kategori_id terisi DAN (cash_out ATAU donatur_id/is_anonymous untuk cash_in)
export interface UpdateCashflowReq {
  donatur_id?: number | null;
  is_anonymous?: boolean;
  kategori_id?: number;
  sub_kategori_id?: number | null;
  catatan?: string;
  // Flag eksplisit untuk MENGOSONGKAN relasi — field nil di atas berarti
  // "tidak diubah", jadi clear butuh flag sendiri
  clear_donatur?: boolean;
  clear_sub_kategori?: boolean;
}

export interface CashflowKategori {
  id: number;
  nama: string;
  parent_id?: number | null; // null = kategori induk; terisi = sub-kategori
  tipe: string; // cash_in | cash_out | both
  aktif: boolean;
  urutan: number;
  keywords?: string | null; // comma-separated, dipakai auto-match saat upload
}

export interface OverviewKeuangan {
  total_masuk: number;
  total_keluar: number;
  net: number;
  jumlah_transaksi: number;
}

export interface OverviewBulan {
  bulan: string; // "2025-08"
  masuk: number;
  keluar: number;
}

export interface OverviewKategori {
  kategori_id?: number | null; // null = belum diklasifikasi
  nama: string;
  tipe: string; // cash_in | cash_out
  jumlah: number;
  total: number;
}

export interface OverviewBreakdown {
  per_bulan: OverviewBulan[];
  per_kategori: OverviewKategori[];
}

// ─── Cashflow ────────────────────────────────────────────────────────────

export async function getCashflowList(params: ListParams = {}) {
  const res = await apiClient.get<Cashflow[]>("/internal/cashflow", {
    page: 1,
    limit: 50,
    ...params,
  });
  return toPaged(res);
}

export async function uploadCashflow(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post<UploadCashflowResult>("/internal/cashflow/upload", form);
  return res.data;
}

export async function updateCashflow(id: number, body: UpdateCashflowReq) {
  const res = await apiClient.put<Cashflow>(`/internal/cashflow/${id}`, body);
  return res.data;
}

// Permanen — tidak ada restore di backend; undo di FE bersifat optimistic
// (DELETE ditunda beberapa detik sampai user tidak klik Undo)
export async function deleteCashflow(id: number) {
  const res = await apiClient.delete(`/internal/cashflow/${id}`);
  return res.message;
}

// ─── Master Kategori ─────────────────────────────────────────────────────

export async function getKategoriList(params: ListParams = {}) {
  const res = await apiClient.get<CashflowKategori[]>("/internal/cashflow/kategori", {
    page: 1,
    limit: 100,
    ...params,
  });
  return toPaged(res);
}

export async function createKategori(body: {
  nama: string;
  parent_id?: number;
  tipe: string;
  urutan?: number;
  keywords?: string;
}) {
  const res = await apiClient.post<CashflowKategori>("/internal/cashflow/kategori", body);
  return res.data;
}

export async function updateKategori(
  id: number,
  body: { nama?: string; tipe?: string; aktif?: boolean; urutan?: number; keywords?: string }
) {
  const res = await apiClient.put<CashflowKategori>(`/internal/cashflow/kategori/${id}`, body);
  return res.data;
}

// ─── Overview ────────────────────────────────────────────────────────────

export async function getOverview(periodeId?: string) {
  const res = await apiClient.get<OverviewKeuangan>(
    "/internal/cashflow/overview",
    periodeId ? { periode_id: periodeId } : undefined
  );
  return res.data;
}

// Agregasi per bulan/kategori dihitung backend
export async function getOverviewBreakdown(periodeId?: string) {
  const res = await apiClient.get<OverviewBreakdown>(
    "/internal/cashflow/overview/breakdown",
    periodeId ? { periode_id: periodeId } : undefined
  );
  return res.data;
}
