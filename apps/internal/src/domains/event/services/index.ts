import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/event_dto.go
export interface EventMentorInfo {
  mentor_id: number;
  nama: string;
  peran: string; // speaker | moderator | fasilitator
}

export interface EventItem {
  id: number;
  kode_event: string; // di-generate backend
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
  status: string; // draft | published | done | cancelled
}

// Enum status event. Event baru dibuat backend berstatus "draft" dan
// disembunyikan dari portal beswan/donatur sampai dipublish.
export type EventStatus = "draft" | "published" | "done" | "cancelled";

export interface AssignMentorReq {
  mentor_id: number;
  peran: "speaker" | "moderator" | "fasilitator";
}

export interface CreateEventReq {
  periode_id: number;
  topik_id?: number; // kosongkan = event non-kurikulum
  nama_event: string;
  tipe: string;
  format: string;
  lokasi?: string;
  tanggal: string;
  jam_mulai?: string;
  jam_selesai?: string;
  deskripsi?: string;
  kapasitas?: number;
  mentors: AssignMentorReq[];
}

// PUT partial — field kosong/tidak dikirim tidak diubah backend. PENTING:
// - key youtube_url/slide_url hanya boleh disertakan saat ada nilainya, karena
//   kehadiran key (walau "") langsung men-set flag rekaman_tersedia/materi_tersedia = true.
// - key "mentors" JANGAN disertakan sama sekali kecuali user memang mengubah roster —
//   kehadiran key ini (termasuk array kosong []) mengganti SELURUH roster mentor lama.
export interface UpdateEventReq {
  // Pindah periode — kirim hanya bila berubah; backend otomatis mengosongkan
  // topik_id event (topik terikat periode), kode_event tetap
  periode_id?: number;
  // Ganti topik — tidak dikirim = tidak berubah; 0 = lepas tautan (event jadi
  // non-kurikulum); nilai lain divalidasi milik periode event (bila dikirim
  // bersama periode_id, validasinya terhadap periode BARU)
  topik_id?: number;
  nama_event?: string;
  tipe?: string;
  format?: string;
  lokasi?: string;
  tanggal?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  deskripsi?: string;
  kapasitas?: number;
  youtube_url?: string;
  slide_url?: string;
  status?: EventStatus;
  mentors?: AssignMentorReq[];
}

export interface UpdateEventStatusReq {
  status: EventStatus;
}

// PUT /internal/event/:id/status (role admin/pcm) — jalur khusus ganti status.
// Status di luar enum → 400; event tidak ada → 404.
export async function updateEventStatus(id: number, status: EventStatus) {
  const res = await apiClient.put<EventItem>(`/internal/event/${id}/status`, { status });
  return res.data;
}

// Default backend (tanpa sort_by): urut waktu dibuat, terbaru di atas —
// jangan sort ulang di FE. sort_by=tanggal + order=asc|desc mengurutkan
// berdasarkan tanggal event; jangan kirim order tanpa sort_by.
export type EventListParams = ListParams & {
  periode_id?: string;
  status?: string;
  tipe?: string;
  sort_by?: "tanggal";
  order?: "asc" | "desc";
};

export async function getEventList(params: EventListParams = {}) {
  const res = await apiClient.get<EventItem[]>("/internal/event", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

// Tidak ada endpoint stats event — agregasi dari total_item + scan event done
// untuk daftar "belum rekaman/materi" (dipakai metric card + alert banner).
// Catatan: scan done dibatasi 100 event terbaru; kalau lebih, daftar alert terpotong.
export async function getEventStats(periodeId?: string) {
  const base = periodeId ? { periode_id: periodeId } : {};
  const [total, published, done] = await Promise.all([
    getEventList({ limit: 1, ...base }),
    getEventList({ limit: 1, status: "published", ...base }),
    getEventList({ limit: 100, status: "done", ...base }),
  ]);
  const belumRekaman = done.items.filter((e) => !e.rekaman_tersedia || !e.materi_tersedia);
  return {
    total: total.totalItems,
    done: done.totalItems,
    published: published.totalItems,
    belumRekaman,
  };
}

export async function getEventDetail(id: number) {
  const res = await apiClient.get<EventItem>(`/internal/event/${id}`);
  return res.data;
}

export async function createEvent(body: CreateEventReq) {
  const res = await apiClient.post<EventItem>("/internal/event", body);
  return res.data;
}

export async function updateEvent(id: number, body: UpdateEventReq) {
  const res = await apiClient.put<EventItem>(`/internal/event/${id}`, body);
  return res.data;
}

export async function deleteEvent(id: number) {
  const res = await apiClient.delete(`/internal/event/${id}`);
  return res.message;
}

// Mirror AbsensiRes — status hadir tersimpan per beswan
export interface AbsensiItem {
  beswan_id: number;
  nama: string;
  hadir: boolean;
}

export async function getAbsensi(eventId: number) {
  const res = await apiClient.get<AbsensiItem[]>(`/internal/event/${eventId}/absensi`);
  return res.data ?? [];
}

// Upsert per item — kirim SELURUH roster beswan periode setiap simpan
export async function saveAbsensi(eventId: number, absensi: { beswan_id: number; hadir: boolean }[]) {
  const res = await apiClient.post(`/internal/event/${eventId}/absensi`, { absensi });
  return res.message;
}
