import { apiClient, API_BASE_URL } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/highlight_dto.go — kartu "Highlight GBB" di Beranda
// Portal Donatur (GET /donatur/highlight hanya mengambil yang aktif=true,
// terurut `urutan`). Endpoint /internal/highlight sudah lama ada; UI admin ini
// yang baru — sebelumnya tidak ada cara mengisi highlight sama sekali.
//
// Balasan BE FEpromt25 §5: link_ig opsional, + kategori (string), + tanggal
// (DATE nullable, "YYYY-MM-DD"). Semantik PUT multipart:
//   judul, kategori   : "" = tidak diubah
//   link_ig, tanggal  : tidak dikirim = tidak diubah; dikirim KOSONG = dihapus
//   urutan, aktif     : tidak dikirim = tidak diubah
export interface HighlightPost {
  id: number;
  judul: string;
  link_ig: string; // "" = tanpa tautan IG
  gambar_url?: string | null;
  kategori?: string; // "" untuk baris lama
  tanggal?: string | null; // "2026-08-01"
  urutan: number;
  aktif: boolean;
}

export const HIGHLIGHT_KATEGORI = [
  { value: "recap", label: "Recap" },
  { value: "kisah_inspiratif", label: "Kisah Inspiratif" },
  { value: "oprec", label: "Oprec Beswan" },
] as const;

export function kategoriLabel(v?: string) {
  return HIGHLIGHT_KATEGORI.find((k) => k.value === v)?.label ?? v ?? "";
}

// "2026-08-01" → "Agustus 2026" (label kartu di deck)
export function tanggalLabel(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export function highlightImageUrl(path?: string | null) {
  if (!path) return undefined;
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}

export async function getHighlightList(params: ListParams = {}) {
  const res = await apiClient.get<HighlightPost[]>("/internal/highlight", {
    page: 1,
    limit: 50,
    ...params,
  });
  return toPaged(res);
}

// POST multipart: judul, link_ig (masih wajib di BE), urutan, aktif, gambar (png/jpg ≤2MB)
export async function createHighlight(form: FormData) {
  const res = await apiClient.post<HighlightPost>("/internal/highlight", form);
  return res.data;
}

// PUT multipart partial. Catatan BE: `Urutan == 0` diabaikan (dianggap tidak
// diubah), jadi urutan di FE selalu 1-based.
export async function updateHighlight(id: number, form: FormData) {
  const res = await apiClient.put<HighlightPost>(`/internal/highlight/${id}`, form);
  return res.data;
}

export async function deleteHighlight(id: number) {
  const res = await apiClient.delete(`/internal/highlight/${id}`);
  return res.message;
}
