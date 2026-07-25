import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// ─── Pertanyaan refleksi (form dinamis) ──────────────────────────────────

export type FieldType =
  | "short_text"
  | "long_text"
  | "dropdown"
  | "single_choice"
  | "linear_scale"
  | "file_upload";

// opsi & kondisi datang sebagai *string JSON* dari backend — parse di FE
export interface Pertanyaan {
  id: number;
  kode: string;
  label: string;
  field_type: FieldType;
  opsi?: string | null;
  is_required: boolean;
  urutan: number; // WAJIB sort by urutan di FE (backend tidak menjamin urut)
  kondisi?: string | null;
}

// Bentuk opsi per field_type (hasil parse):
// dropdown/single_choice: {pilihan: string[]}
// linear_scale: {min, max, label_min, label_max}
// file_upload: {accept: string[], max_mb, multiple}
export interface OpsiPilihan {
  pilihan?: string[];
  min?: number;
  max?: number;
  label_min?: string;
  label_max?: string;
  accept?: string[];
  max_mb?: number;
  multiple?: boolean;
}

export interface Kondisi {
  depends_on_kode: string;
  equals: string;
}

export function parseJSONString<T>(raw?: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function getPertanyaan() {
  const res = await apiClient.get<Pertanyaan[]>("/beswan/refleksi/pertanyaan");
  return [...(res.data ?? [])].sort((a, b) => a.urutan - b.urutan);
}

// ─── Refleksi bulanan (jawaban) ──────────────────────────────────────────

export interface RefleksiJawaban {
  pertanyaan_id: number;
  kode?: string;
  nilai: string; // selalu string (file_upload = JSON string array URL)
}

export interface RefleksiRes {
  id: number;
  periode_id: number;
  bulan: number;
  tahun: number;
  status: string; // draft | submitted
  submitted_at?: string | null;
  jawaban?: RefleksiJawaban[] | null; // absen bila submitted? -> tetap guard
}

// Bulan yang belum pernah diisi = 200 dengan data null → form kosong
export async function getRefleksi(periodeId: number, bulan: number, tahun: number) {
  const res = await apiClient.get<RefleksiRes | null>("/beswan/refleksi", {
    periode_id: periodeId,
    bulan,
    tahun,
  });
  return res.data ?? null;
}

// Upsert draft — kirim hanya jawaban yang terisi
export async function saveDraft(body: {
  periode_id: number;
  bulan: number;
  tahun: number;
  jawaban: { pertanyaan_id: number; nilai: string }[];
}) {
  const res = await apiClient.put("/beswan/refleksi", body);
  return res.message;
}

// 400 "pertanyaan wajib belum diisi: <labels>" → tampilkan apa adanya
export async function submitRefleksi(body: {
  periode_id: number;
  bulan: number;
  tahun: number;
  jawaban: { pertanyaan_id: number; nilai: string }[];
}) {
  const res = await apiClient.post("/beswan/refleksi/submit", body);
  return res.message;
}

// Upload dokumentasi DULU (multipart "files"), URL hasilnya masuk nilai jawaban
export async function uploadDokumentasi(files: File[]) {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const res = await apiClient.post<string[]>("/beswan/refleksi/dokumentasi", fd);
  return res.data ?? [];
}

// ─── Prestasiku ──────────────────────────────────────────────────────────

export interface PrestasiFile {
  id: number;
  file_url: string;
  tipe: string; // sertifikat | foto
}

export interface Prestasi {
  id: number;
  judul: string;
  deskripsi: string;
  kategori: string; // studi | organisasi | luar_kampus
  tanggal: string;
  files?: PrestasiFile[] | null;
}

export async function getPrestasiList(params: ListParams = {}) {
  const res = await apiClient.get<Prestasi[]>("/beswan/prestasi", {
    page: 1,
    limit: 100,
    ...params,
  });
  return toPaged(res);
}

export interface PrestasiInput {
  judul: string;
  deskripsi: string;
  kategori: string;
  tanggal: string; // YYYY-MM-DD (backend menerima date-only maupun RFC3339)
}

// Create = multipart (files[] opsional multi, tipe per file tidak bisa diset → default backend)
export async function createPrestasi(input: PrestasiInput, files: File[]) {
  const fd = new FormData();
  fd.append("judul", input.judul);
  fd.append("deskripsi", input.deskripsi);
  fd.append("kategori", input.kategori);
  fd.append("tanggal", input.tanggal);
  files.forEach((f) => fd.append("files", f));
  const res = await apiClient.post<Prestasi>("/beswan/prestasi", fd);
  return res.data;
}

// Update = JSON partial, TANPA file (file dikelola endpoint terpisah)
export async function updatePrestasi(id: number, input: Partial<PrestasiInput>) {
  const res = await apiClient.put(`/beswan/prestasi/${id}`, input);
  return res.message;
}

export async function addPrestasiFile(id: number, file: File, tipe: "sertifikat" | "foto") {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("tipe", tipe);
  const res = await apiClient.post(`/beswan/prestasi/${id}/file`, fd);
  return res.message;
}

export async function deletePrestasiFile(id: number, fileId: number) {
  const res = await apiClient.delete(`/beswan/prestasi/${id}/file/${fileId}`);
  return res.message;
}

// Backend cascade-delete file lampiran bersama prestasinya
export async function deletePrestasi(prestasi: Prestasi) {
  const res = await apiClient.delete(`/beswan/prestasi/${prestasi.id}`);
  return res.message;
}
