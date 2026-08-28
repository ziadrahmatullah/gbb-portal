import { apiClient, API_BASE_URL } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

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
}

// Mirror dto/refleksi_dto.go — dipakai tab Refleksi di detail beswan
export interface RefleksiItem {
  id: number;
  periode_id: number;
  bulan: number;
  tahun: number;
  status: string;
  submitted_at?: string | null;
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
  if (body.foto) form.append("foto", body.foto);
  if (body.cv) form.append("cv", body.cv);
  const res = await apiClient.put<BeswanListItem>(`/internal/beswan/${id}`, form);
  return res.data;
}

export async function getBeswanRefleksi(beswanId: number, params: ListParams = {}) {
  const res = await apiClient.get<RefleksiItem[]>("/internal/refleksi", {
    beswan_id: beswanId,
    page: 1,
    limit: 50,
    ...params,
  });
  return toPaged(res);
}
