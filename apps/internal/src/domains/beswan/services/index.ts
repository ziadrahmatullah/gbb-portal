import { apiClient, API_BASE_URL } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";
import type { Penugasan } from "@/domains/penugasan/services";

// Mirror gbb-backend dto/beswan_dto.go
export interface BeswanListItem {
  id: number;
  nama_lengkap: string;
  nim: string;
  email: string;
  hp: string;
  cv_url?: string | null;
  foto_url?: string | null;
  status?: string; // "aktif" | "alumni"
  batch?: string;
  // FEpromt25 §3 — "" / 0 / 0 kalau belum diisi → tampilkan "—".
  // `semester` DITURUNKAN BE dari tahun_masuk (cutoff ganjil = Agustus), tidak disimpan.
  jurusan?: string;
  tahun_masuk?: number;
  semester?: number;
  // FEpromt29 §1 — email pemulihan/alternatif beswan ("" = belum diisi)
  email_pemulihan?: string;
  // FEpromt30 — beswan sudah membuat tautan langganan kalender ICS (belum ditampilkan)
  kalender_aktif?: boolean;
}

export interface BeswanStats {
  total: number;
  aktif: number;
  alumni: number;
  avg_ipk: number;
}

export interface BeswanPeriodeOption {
  periode_id: number;
  periode_nama: string;
  status: string;
}

export interface BeswanChartBulanan {
  bulan: number;
  tahun: number;
  kehadiran_persen: number;
  avg_nilai: number | null; // null = tidak ada tugas dinilai bulan itu
}

export interface BeswanChartIPK {
  periode_id: number;
  periode_nama: string;
  semester: number;
  ipk: number;
}

export interface BeswanAbsensiEvent {
  event_id: number;
  nama_event: string;
  tanggal: string;
  hadir: boolean;
  youtube_url?: string | null;
  slide_url?: string | null;
}

export interface BeswanRapor {
  periode_id: number;
  kehadiran_hadir: number;
  kehadiran_total: number;
  kehadiran_persen: number;
  tugas_submitted: number;
  tugas_total: number;
  tugas_avg_nilai: number;
  refleksi_submitted: number;
  refleksi_total: number;
  chart_bulanan: BeswanChartBulanan[];
  absensi: BeswanAbsensiEvent[];
}

export interface BeswanDetail {
  id: number;
  nama_lengkap: string;
  nim: string;
  email: string;
  hp: string;
  cv_url?: string | null;
  foto_url?: string | null;
  jurusan?: string;
  tahun_masuk?: number;
  semester?: number;
  email_pemulihan?: string;
  periodes: BeswanPeriodeOption[];
  rapor?: BeswanRapor | null;
  chart_ipk: BeswanChartIPK[];
  reminders?: string[];
}

export interface CreateBeswanReq {
  nama_lengkap: string;
  nim: string;
  email: string;
  hp: string;
  periode_id: number;
  jurusan?: string;
  tahun_masuk?: number; // 2000..tahun depan; 0/absen = belum diisi
  // FEpromt26: opsional. Kosong = beswan membuat password sendiri lewat tautan
  // di email selamat datang (7 hari). Default lama "beswan123" sudah DIHAPUS BE.
  password?: string;
}

// foto_url/cv_url dari backend berupa path relatif yang diserve statis
export function assetUrl(path?: string | null) {
  if (!path) return undefined;
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}

// Param GET /internal/beswan — selain param list standar, backend mendukung:
// sort_by=nama (+ order=asc|desc, hanya berlaku bila sort_by dikirim) dan
// filter status=aktif|alumni. Jangan kirim order tanpa sort_by.
export type BeswanListParams = ListParams & {
  periode_id?: string;
  status?: "aktif" | "alumni";
  sort_by?: "nama";
  order?: "asc" | "desc";
};

export async function getBeswanList(params: BeswanListParams = {}) {
  const res = await apiClient.get<BeswanListItem[]>("/internal/beswan", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

// Export Excel: GET /internal/beswan?download=true mengembalikan .xlsx (binary).
// Filter/sort yang sama ikut berlaku; page/limit diabaikan backend — jangan dikirim.
// Nama file diambil dari Content-Disposition (fallback "data-beswan.xlsx" bila
// header tidak ter-expose CORS).
export async function downloadBeswanExcel(
  params: Omit<BeswanListParams, "page" | "limit"> = {}
) {
  const res = await apiClient.getBlob("/internal/beswan", { ...params, download: true });
  const disposition = String(res.headers["content-disposition"] ?? "");
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const filename = match?.[1] ? decodeURIComponent(match[1]) : "data-beswan.xlsx";
  return { blob: res.data, filename };
}

export async function getBeswanStats(periodeId?: string) {
  const res = await apiClient.get<BeswanStats>(
    "/internal/beswan/stats",
    periodeId ? { periode_id: periodeId } : undefined
  );
  return res.data;
}

export async function getBeswanDetail(id: number, periodeId?: string) {
  const res = await apiClient.get<BeswanDetail>(
    `/internal/beswan/${id}`,
    periodeId ? { periode_id: periodeId } : undefined
  );
  return res.data;
}

export async function createBeswan(body: CreateBeswanReq) {
  const res = await apiClient.post<BeswanListItem>("/internal/beswan", body);
  return res.data;
}

// Field PUT /internal/beswan/:id (multipart) — semua opsional, kirim hanya yang
// berubah. email = kredensial login beswan; backend menolak 400 bila format
// salah atau "email sudah digunakan beswan lain".
export interface UpdateBeswanReq {
  nama_lengkap?: string;
  email?: string;
  hp?: string;
  jurusan?: string;
  // undefined = tidak diubah; 0 = dikosongkan (semantik BE)
  tahun_masuk?: number;
  // undefined = tidak diubah; "" = dikosongkan. BE menolak 400 bila format
  // salah atau sama dengan email utama (FEpromt29 §1)
  email_pemulihan?: string;
  foto?: File;
  cv?: File;
}

// PUT /internal/beswan/:id/status — set status batch TERKINI beswan (batch
// yang sama dengan yang tampil di kolom Status list). Kontrak diminta ke tim
// backend via gbb-backend/promt/FEpromt11.txt.
export type BeswanStatus = "aktif" | "alumni";

export async function updateBeswanStatus(id: number, status: BeswanStatus) {
  const res = await apiClient.put<BeswanListItem>(`/internal/beswan/${id}/status`, { status });
  return res.data;
}

export async function updateBeswan(id: number, body: UpdateBeswanReq) {
  const form = new FormData();
  if (body.nama_lengkap) form.append("nama_lengkap", body.nama_lengkap);
  if (body.email) form.append("email", body.email);
  if (body.hp) form.append("hp", body.hp);
  if (body.jurusan !== undefined) form.append("jurusan", body.jurusan);
  if (body.email_pemulihan !== undefined) form.append("email_pemulihan", body.email_pemulihan);
  if (body.tahun_masuk !== undefined) form.append("tahun_masuk", String(body.tahun_masuk));
  if (body.foto) form.append("foto", body.foto);
  if (body.cv) form.append("cv", body.cv);
  const res = await apiClient.put<BeswanListItem>(`/internal/beswan/${id}`, form);
  return res.data;
}

// Tab Refleksi di detail beswan kini memakai domain refleksi
// (RefleksiTable) — service refleksi lama di sini sudah dihapus.

// ─── Tugas per beswan (tab Tugas di detail beswan) ────────────────────────

// Bentuk sama dengan MyPenugasanRes portal beswan: Penugasan internal +
// hasil milik beswan ybs (hasil_status absen = belum mengumpulkan)
export interface BeswanPenugasanItem extends Penugasan {
  hasil_status?: "submitted" | "graded" | null;
  file_url?: string | null;
  submitted_at?: string | null;
  terlambat: boolean;
  nilai?: number | null;
  feedback?: string | null;
}

export type BeswanPenugasanParams = ListParams & {
  periode_id?: string;
  status?: "aktif" | "selesai";
};

// Terurut tugas terbaru dibuat; otomatis dibatasi periode enrollment beswan;
// 404 bila beswan tidak ada
export async function getBeswanPenugasan(beswanId: number, params: BeswanPenugasanParams = {}) {
  const res = await apiClient.get<BeswanPenugasanItem[]>(
    `/internal/beswan/${beswanId}/penugasan`,
    { page: 1, limit: 10, ...params }
  );
  return toPaged(res);
}
