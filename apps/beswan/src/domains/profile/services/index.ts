import { apiClient } from "@/shared/lib/apiClient";

// Mirror gbb-backend dto/beswan_dto.go BeswanRes (GET /beswan/profile)
export interface MyProfile {
  id: number;
  nama_lengkap: string; // read-only (hubungi tim GBB bila salah)
  nim: string; // read-only
  email: string; // read-only
  hp: string;
  cv_url?: string | null;
  foto_url?: string | null;
  status?: string;
  batch?: string;
}

export async function getMyProfile() {
  const res = await apiClient.get<MyProfile>("/beswan/profile");
  return res.data;
}

// PUT multipart — hp wajib; foto (image) & cv (document) opsional.
// Field kosong TIDAK menghapus nilai lama (Go partial-update).
export async function updateMyProfile(input: { hp: string; foto?: File; cv?: File }) {
  const fd = new FormData();
  fd.append("hp", input.hp);
  if (input.foto) fd.append("foto", input.foto);
  if (input.cv) fd.append("cv", input.cv);
  const res = await apiClient.put<MyProfile>("/beswan/profile", fd);
  return res.data;
}

// Mirror BeswanIPKRes — PERHATIAN: JSON key transkrip memang typo "transkip_url"
// di backend (dto/beswan_dto.go), jangan "dibetulkan" di FE.
export interface MyIPK {
  id: number;
  periode_id: number;
  ip_semester?: number | null;
  ipk: number;
  transkip_url?: string | null;
}

export async function getMyIPK() {
  const res = await apiClient.get<MyIPK[]>("/beswan/ipk");
  return res.data ?? [];
}

// Upsert per (beswan, periode) — multipart: periode_id* dari periodes dashboard
// (bukan dropdown bebas), ipk*, ip_semester?, transkrip? (file)
export async function upsertMyIPK(input: {
  periode_id: number;
  ipk: number;
  ip_semester?: number;
  transkrip?: File;
}) {
  const fd = new FormData();
  fd.append("periode_id", String(input.periode_id));
  fd.append("ipk", String(input.ipk));
  if (input.ip_semester != null) fd.append("ip_semester", String(input.ip_semester));
  if (input.transkrip) fd.append("transkrip", input.transkrip);
  const res = await apiClient.put<MyIPK>("/beswan/ipk", fd);
  return res.data;
}
