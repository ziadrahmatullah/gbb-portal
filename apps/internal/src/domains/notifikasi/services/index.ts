import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/notifikasi_dto.go
export interface Notifikasi {
  id: number;
  recipient_type: string;
  tipe: string;
  pesan: string;
  is_read: boolean;
  ref_table?: string | null;
  ref_id?: number | null;
  created_at: string;
}

export async function getNotifikasi(params: ListParams = {}) {
  const res = await apiClient.get<Notifikasi[]>("/internal/notifikasi", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

// Backend memvalidasi kepemilikan (404 bila bukan milik user yang login)
export async function markNotifikasiRead(id: number) {
  const res = await apiClient.put(`/internal/notifikasi/${id}/read`);
  return res.message;
}

export async function markAllNotifikasiRead() {
  const res = await apiClient.put("/internal/notifikasi/read-all");
  return res.message;
}

export async function getUnreadCount() {
  const res = await apiClient.get<{ count: number }>("/internal/notifikasi/unread-count");
  return res.data?.count ?? 0;
}

// Halaman tujuan saat notifikasi diklik. Prioritas ref_table (deep-link ke
// detail), fallback per tipe (halaman list). null = tidak bisa diklik.
// Sejak FEpromt20, BE menulis ref = entitas yang punya halaman ("penugasan",
// "events"); fallback per tipe tetap dipertahankan untuk row lama
// ber-ref_table "hasil_penugasan".
export function getNotifikasiTarget(n: Notifikasi): string | null {
  if (n.ref_id) {
    if (n.ref_table === "events") return `/panel/event/${n.ref_id}`;
    if (n.ref_table === "penugasan") return `/panel/penugasan/${n.ref_id}`;
  }
  switch (n.tipe) {
    case "event":
      return "/panel/event";
    case "penugasan":
    case "nilai":
    case "hasil":
      return "/panel/penugasan";
    case "mentor_request":
      return "/panel/mentor";
    case "laporan":
      return "/panel/laporan";
    default:
      return null;
  }
}
