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

export async function getBeswanList(params: ListParams = {}) {
  const res = await apiClient.get<BeswanListItem[]>("/internal/beswan", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
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

// PUT multipart/form-data: nama_lengkap, hp (text) + foto, cv (file) — semua opsional
export async function updateBeswan(id: number, form: FormData) {
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
