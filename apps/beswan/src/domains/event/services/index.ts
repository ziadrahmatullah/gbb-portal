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
  kapasitas: number;
  jumlah_peserta: number;
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
