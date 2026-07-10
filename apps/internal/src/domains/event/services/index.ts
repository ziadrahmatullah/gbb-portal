import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/event_dto.go
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
  youtube_url?: string | null;
  slide_url?: string | null;
  rekaman_tersedia: boolean;
  materi_tersedia: boolean;
  status: string; // upcoming | done | cancelled
}

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

// PUT partial — field kosong tidak diubah backend. PENTING: key youtube_url/slide_url
// hanya boleh disertakan saat ada nilainya, karena kehadiran key (walau "") langsung
// men-set flag rekaman_tersedia/materi_tersedia = true di backend.
export interface UpdateEventReq {
  nama_event?: string;
  tipe?: string;
  format?: string;
  lokasi?: string;
  tanggal?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  deskripsi?: string;
  youtube_url?: string;
  slide_url?: string;
  status?: "upcoming" | "done" | "cancelled";
}

export async function getEventList(params: ListParams = {}) {
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
  const [total, upcoming, done] = await Promise.all([
    getEventList({ limit: 1, ...base }),
    getEventList({ limit: 1, status: "upcoming", ...base }),
    getEventList({ limit: 100, status: "done", ...base }),
  ]);
  const belumRekaman = done.items.filter((e) => !e.rekaman_tersedia || !e.materi_tersedia);
  return {
    total: total.totalItems,
    done: done.totalItems,
    upcoming: upcoming.totalItems,
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

// Upsert per item — kirim SELURUH roster beswan periode setiap simpan
export async function saveAbsensi(eventId: number, absensi: { beswan_id: number; hadir: boolean }[]) {
  const res = await apiClient.post(`/internal/event/${eventId}/absensi`, { absensi });
  return res.message;
}
