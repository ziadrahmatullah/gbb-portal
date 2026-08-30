import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/event_dto.go — disalin dari app internal.
// Endpoint beswan read-only: backend membatasi ke periode enrollment beswan
// dan menyembunyikan event draft; tidak ada aksi edit/status/absensi di sini.
export interface EventMentorInfo {
  mentor_id: number;
  nama: string;
  peran: string; // speaker | moderator | fasilitator
}

export interface EventItem {
  id: number;
  kode_event: string;
  periode_id: number;
  topik_id?: number | null;
  nama_event: string;
  tipe: string; // talkshow | growth | other
  format: string; // online | offline | hybrid
  lokasi: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  deskripsi: string;
  kapasitas: number; // 0 = event terbuka tanpa pendaftaran; >0 = harus join
  jumlah_peserta: number;
  // Daftar periode yang boleh mengikuti event ini
  periode_ids: number[];
  // Jumlah beswan yang sudah join (kuota siapa cepat)
  jumlah_join: number;
  // Hanya ada di event berkapasitas: apakah beswan ini sudah join.
  // Catatan: pada event berkapasitas yang BELUM di-join, backend
  // menyembunyikan lokasi, youtube_url, dan slide_url.
  is_joined?: boolean;
  mentors: EventMentorInfo[];
  youtube_url?: string | null;
  slide_url?: string | null;
  rekaman_tersedia: boolean;
  materi_tersedia: boolean;
  status: string; // published | done | cancelled (draft tidak pernah sampai ke sini)
}

// Param GET /beswan/event: page, limit, periode_id, status, tipe, search.
// Default backend (tanpa sort_by): urut waktu dibuat, terbaru di atas —
// jangan sort ulang di FE. sort_by=tanggal + order=asc|desc = urut tanggal
// event; jangan kirim order tanpa sort_by.
export type BeswanEventListParams = ListParams & {
  periode_id?: string;
  status?: string;
  tipe?: string;
  sort_by?: "tanggal";
  order?: "asc" | "desc";
};

export async function getBeswanEventList(params: BeswanEventListParams = {}) {
  const res = await apiClient.get<EventItem[]>("/beswan/event", {
    page: 1,
    limit: 9,
    ...params,
  });
  return toPaged(res);
}

// Event yang tidak boleh dilihat beswan dibalas 404
export async function getBeswanEventDetail(id: number) {
  const res = await apiClient.get<EventItem>(`/beswan/event/${id}`);
  return res.data;
}

// Join/batal pendaftaran event berkapasitas (kuota siapa cepat). Error 400
// backend berpesan siap-tampil (mis. "kuota event sudah penuh") — interceptor
// menampilkannya via toast apa adanya.
export async function joinEvent(id: number) {
  const res = await apiClient.post(`/beswan/event/${id}/join`);
  return res.message;
}

export async function leaveEvent(id: number) {
  const res = await apiClient.delete(`/beswan/event/${id}/join`);
  return res.message;
}
