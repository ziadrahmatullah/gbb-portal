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
  // FEpromt25 §3 — beswan melengkapi sendiri; semester diturunkan BE dari tahun_masuk
  jurusan?: string;
  tahun_masuk?: number;
  semester?: number;
  // FEpromt29 — email pemulihan/alternatif (opsional, masukan PCM Sep 2026).
  // Key SELALU ada di response begitu backend rilis ("" bila belum diisi);
  // ProfilePage memakai kehadiran key ini untuk menampilkan field-nya, jadi
  // FE aman dideploy lebih dulu.
  email_pemulihan?: string;
  // FEpromt30 — true bila beswan sudah pernah membuat tautan langganan ICS
  // (calendar_token_hash terisi); dipakai kartu Sinkron Kalender di Profile
  kalender_aktif?: boolean;
}

export async function getMyProfile() {
  const res = await apiClient.get<MyProfile>("/beswan/profile");
  return res.data;
}

// PUT multipart — hp wajib; foto (image) & cv (document) opsional.
// Field kosong TIDAK menghapus nilai lama (Go partial-update).
export async function updateMyProfile(input: {
  hp: string;
  jurusan?: string;
  tahun_masuk?: number; // 0 = kosongkan
  email_pemulihan?: string; // "" = kosongkan
  foto?: File;
  cv?: File;
}) {
  const fd = new FormData();
  fd.append("hp", input.hp);
  if (input.jurusan !== undefined) fd.append("jurusan", input.jurusan);
  if (input.email_pemulihan !== undefined) fd.append("email_pemulihan", input.email_pemulihan);
  if (input.tahun_masuk !== undefined) fd.append("tahun_masuk", String(input.tahun_masuk));
  if (input.foto) fd.append("foto", input.foto);
  if (input.cv) fd.append("cv", input.cv);
  const res = await apiClient.put<MyProfile>("/beswan/profile", fd);
  return res.data;
}

// PUT /beswan/account/change-password — endpoint sudah lama ada di backend
// (router.go), UI-nya baru dibuat atas masukan tim (fitur pendukung login:
// ubah password). Konfirmasi password hanya divalidasi di FE.
export async function changeMyPassword(oldPassword: string, newPassword: string) {
  const res = await apiClient.put("/beswan/account/change-password", {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return res.message;
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

// POST /beswan/kalender/token (FEpromt29 §3) — membuat/memutar token feed ICS
// untuk langganan Google Calendar. URL hanya dikembalikan SEKALI (backend
// menyimpan hash token saja); memanggil ulang mematikan tautan lama. Google
// mengambil GET …/beswan/kalender.ics?token=… tanpa JWT.
export async function createCalendarFeed() {
  const res = await apiClient.post<{ url: string }>("/beswan/kalender/token");
  return res.data?.url ?? "";
}
