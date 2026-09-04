import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/mentor_dto.go
export interface Mentor {
  id: number;
  nama: string;
  bidang_keahlian: string;
  is_internal: boolean;
  linkedin_url?: string | null;
  jumlah_event: number; // total event sepanjang masa (backend tidak memfilter periode)
}

export interface MentorEventHistory {
  event_id: number;
  nama_event: string;
  tanggal: string;
  peran: string; // speaker | moderator | fasilitator
}

export interface MentorDetail extends Mentor {
  email?: string;
  hp?: string;
  cv_url?: string | null;
  event_history: MentorEventHistory[];
}

export async function getMentorList(params: ListParams = {}) {
  const res = await apiClient.get<Mentor[]>("/internal/mentor", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

// Export Excel: GET /internal/mentor?download=true mengembalikan .xlsx (binary).
// Filter yang sama ikut berlaku; page/limit diabaikan backend — jangan dikirim.
// Nama file dari Content-Disposition (sudah ter-expose lewat CORS), fallback
// "data-mentor.xlsx". Pola sama persis dengan downloadBeswanExcel.
export type MentorExportParams = {
  is_internal?: string; // "true" | "false"
  bidang_keahlian?: string;
  search?: string;
};

export async function downloadMentorExcel(params: MentorExportParams = {}) {
  const res = await apiClient.getBlob("/internal/mentor", { ...params, download: true });
  const disposition = String(res.headers["content-disposition"] ?? "");
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const filename = match?.[1] ? decodeURIComponent(match[1]) : "data-mentor.xlsx";
  return { blob: res.data, filename };
}

export interface MentorStats {
  total: number;
  undip: number;
  non_undip: number;
  // Antrean pendaftaran mentor berstatus menunggu (FEpromt25 §2) — untuk banner
  // & badge tab; dititipkan di sini supaya tidak ada request tambahan.
  pendaftaran_menunggu?: number;
}

export async function getMentorStats() {
  const res = await apiClient.get<MentorStats>("/internal/mentor/stats");
  return res.data;
}

export async function getMentorDetail(id: number) {
  const res = await apiClient.get<MentorDetail>(`/internal/mentor/${id}`);
  return res.data;
}

// POST/PUT multipart: nama, email, hp, linkedin_url, bidang_keahlian,
// is_internal + cv (file, opsional)
export async function createMentor(form: FormData) {
  const res = await apiClient.post<MentorDetail>("/internal/mentor", form);
  return res.data;
}

export async function updateMentor(id: number, form: FormData) {
  const res = await apiClient.put<MentorDetail>(`/internal/mentor/${id}`, form);
  return res.data;
}

export async function deleteMentor(id: number) {
  const res = await apiClient.delete(`/internal/mentor/${id}`);
  return res.message;
}

// ─── Request Mentor (matching curhat beswan → mentor) ─────────────────────

export interface MentorRequestRes {
  id: number;
  beswan_id: number;
  beswan_nama: string;
  mentor_id?: number | null;
  mentor_nama?: string | null;
  curhat_text?: string | null;
  status: string; // pending | matched | done
  created_at: string;
  responded_at?: string | null;
}

export type MentorRequestListParams = ListParams & {
  status?: "pending" | "matched" | "done";
};

export async function listMentorRequests(params: MentorRequestListParams = {}) {
  const res = await apiClient.get<MentorRequestRes[]>("/internal/mentor/requests", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

// PUT /internal/mentor/requests/:id (role admin/pcm). status "matched" wajib
// disertai mentor bila request belum punya → 400 "tentukan mentor untuk
// matching request ini". Saat matched/done backend mengirim notifikasi
// in-app ke beswan otomatis.
export interface UpdateMentorRequestReq {
  status: "pending" | "matched" | "done";
  mentor_id?: number;
}

export async function updateMentorRequest(id: number, body: UpdateMentorRequestReq) {
  const res = await apiClient.put<MentorRequestRes>(`/internal/mentor/requests/${id}`, body);
  return res.data;
}

// ─── Pendaftaran Mentor (self-signup donatur/beswan → verifikasi internal) ──
// Kontrak dari balasan BE atas FEpromt25 §2. Tabel TERPISAH dari `mentors`:
// pendaftar tidak muncul di direktori mentor sampai dipromosikan (terdaftar).

export type PendaftaranStatus = "menunggu" | "perlu_info" | "terdaftar" | "ditolak";

export interface MentorPendaftaran {
  id: number;
  pendaftar_tipe: string; // donatur | beswan | unknown (backfill)
  pendaftar_id: number;
  nama: string;
  email: string;
  hp: string;
  bidang_keahlian: string;
  cv_url?: string | null;
  linkedin_url?: string | null;
  is_internal: boolean; // deklarasi alumni UNDIP dari pendaftar
  status: PendaftaranStatus;
  catatan?: string | null;
  mentor_id?: number | null; // terisi = sudah dipromosikan ke tabel mentors
  verified_by?: number | null;
  verified_by_nama?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type MentorPendaftaranListParams = ListParams & { status?: PendaftaranStatus };

// Sort server-side: menunggu dulu, lalu created_at DESC — jangan sort ulang.
export async function listMentorPendaftaran(params: MentorPendaftaranListParams = {}) {
  const res = await apiClient.get<MentorPendaftaran[]>("/internal/mentor/pendaftaran", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

// PUT /internal/mentor/pendaftaran/:id (admin, pcm)
//   terdaftar  → promosi ke tabel mentors (idempoten), boleh koreksi
//                bidang_keahlian / is_internal di body yang sama
//   perlu_info → catatan WAJIB (400 kalau kosong)
//   ditolak    → catatan opsional
// Baris yang sudah dipromosikan (mentor_id terisi) tidak bisa diubah lagi → 400.
export interface UpdateMentorPendaftaranReq {
  status: Exclude<PendaftaranStatus, "menunggu">;
  catatan?: string;
  bidang_keahlian?: string;
  is_internal?: boolean;
}

export async function updateMentorPendaftaran(id: number, body: UpdateMentorPendaftaranReq) {
  const res = await apiClient.put<MentorPendaftaran>(`/internal/mentor/pendaftaran/${id}`, body);
  return res.data;
}
