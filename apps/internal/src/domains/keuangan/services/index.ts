import { apiClient } from "@/shared/lib/apiClient";
import { ApiError, toPaged } from "@/shared/lib/apiTypes";
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

// Baris hasil PREVIEW upload — file sudah diparse backend tapi BELUM masuk DB,
// jadi belum punya id. row_key dibuat backend, stabil selama satu sesi wizard,
// dipakai sebagai key React dan dikirim balik saat commit.
export interface CashflowDraft extends Omit<Cashflow, "id"> {
  row_key: string;
}

export interface PreviewCashflowResult {
  rows: CashflowDraft[]; // hanya baris baru — duplikat dipisah ke bawah
  duplicates: CashflowDuplicate[]; // FT Number + nominal sudah ada di DB
  summary: {
    total_rows: number;
    new_count: number;
    duplicate_count: number;
    unknown_count: number;
  };
}

// Payload commit — baris preview yang sudah diklasifikasi user.
// `bulan` sengaja tidak dikirim: server menurunkannya sendiri dari `tanggal`.
// periode_id, status_klasifikasi, match_source, dan currency juga dihitung
// server, jadi tidak ada di sini.
export interface CommitCashflowRow {
  row_key: string;
  sheet: string;
  tanggal: string;
  ft_number?: string | null;
  deskripsi: string;
  nominal: number;
  tipe: string;
  kat_bsi: string;
  kategori_id?: number | null;
  sub_kategori_id?: number | null;
  donatur_id?: number | null;
  is_anonymous: boolean;
  catatan?: string | null;
}

export interface CommitCashflowResult {
  inserted: Cashflow[];
  // Duplikat yang lolos ke commit karena baris kembar tersimpan setelah preview
  // dijalankan, atau karena Simpan ditekan/di-retry dua kali. Dilewati backend,
  // response tetap 200 — perlakukan sebagai info, BUKAN error, dan
  // inserted_count < requested itu normal.
  skipped: CashflowDuplicate[];
  summary: {
    requested: number;
    inserted_count: number;
    skipped_count: number;
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

// Jenis/sumber mutasi yang bisa diparse. Parser BSI satu-satunya yang ada di
// backend sekarang; entri non-aktif tetap dirender (disabled) supaya jelas
// dukungan lain belum ada, bukan hilang.
export const MUTASI_SUMBER = [
  {
    value: "bsi",
    label: "BSI — Bank Syariah Indonesia",
    accept: ".xlsx",
    hint: "File .xlsx ekspor mutasi BSI",
    keterangan: "1 sheet per bulan, sesuai format ekspor mutasi BSI.",
    aktif: true,
  },
] as const;

export type MutasiSumber = (typeof MUTASI_SUMBER)[number]["value"];

export const mutasiSumberMeta = (value: string) =>
  MUTASI_SUMBER.find((s) => s.value === value);

// Dry-run: backend hanya memparse + auto-klasifikasi, tidak menulis apa pun.
// Aman dipanggil berulang kali.
// `sumber` menandai parser mana yang dipakai. Backend belum membacanya (masih
// selalu BSI) — dikirim supaya kontraknya siap saat parser lain menyusul.
export async function previewCashflow(file: File, sumber: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("sumber", sumber);
  const res = await apiClient.post<PreviewCashflowResult>(
    "/internal/cashflow/upload/preview",
    form
  );
  return res.data;
}

// Satu-satunya jalan baris mutasi masuk DB — transaksional, all-or-nothing.
// Aman di-retry dengan payload sama: backend mengecek ulang duplikat
// (ft_number + nominal) saat commit, jadi kirim ulang tidak menggandakan data.
export async function commitCashflow(rows: CommitCashflowRow[]) {
  const res = await apiClient.post<CommitCashflowResult>("/internal/cashflow/batch", { rows });
  return res.data;
}

// Commit membalas 400 dengan pola { error, data: { invalid_row_keys } } —
// beda dari error lain di API ini yang cuma { error }. Payload-nya dibawa
// ApiError, dan row_key di sini dipakai menyorot baris yang menahan simpan.
export function invalidRowKeysOf(err: unknown): string[] {
  const payload = err instanceof ApiError ? err.data : undefined;
  const keys = (payload as { invalid_row_keys?: unknown } | undefined)?.invalid_row_keys;
  return Array.isArray(keys) ? keys.filter((k): k is string => typeof k === "string") : [];
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
