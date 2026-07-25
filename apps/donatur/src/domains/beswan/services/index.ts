import { apiClient } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/beswan_dto.go BeswanDonaturOverviewRes
export interface BeswanOverview {
  id: number;
  nama_lengkap: string;
  foto_url?: string | null;
  kehadiran_hadir: number;
  kehadiran_total: number;
  ipk_terbaru?: number | null;
  prestasi_terbaru?: string | null;
  refleksi_submitted: number;
  refleksi_total: number;
  // Ringkasan refleksi bulan terakhir, DIKURASI AI untuk konsumsi donatur
  // (privat/tidak relevan dibuang) — beda dari prestasi_terbaru.
  ringkasan?: string | null;
}

// ⚠ periode_id WAJIB dikirim — tanpa itu semua statistik balik 0/kosong by design.
export async function getBeswanList(periodeId: number, params: ListParams = {}) {
  const res = await apiClient.get<BeswanOverview[]>("/donatur/beswan", {
    periode_id: periodeId,
    page: 1,
    limit: 50,
    ...params,
  });
  return toPaged(res);
}

// ─── Detail (bagian "Lihat Detail") ──────────────────────────────────────
// Sama persis bentuknya dengan GET /beswan/dashboard milik beswan sendiri,
// MINUS field `reminders` (backend tidak mengisi field itu untuk donatur).

export interface PeriodeInfo {
  periode_id: number;
  periode_nama: string;
  status: string;
}

export interface ChartBulanan {
  bulan: number;
  tahun: number;
  kehadiran_persen: number;
  avg_nilai: number | null;
}

export interface ChartIPK {
  periode_id: number;
  periode_nama: string;
  semester: number;
  ipk: number;
}

export interface AbsensiEvent {
  event_id: number;
  nama_event: string;
  tanggal: string;
  hadir: boolean;
  youtube_url?: string | null;
  slide_url?: string | null;
}

export interface Rapor {
  periode_id: number;
  kehadiran_hadir: number;
  kehadiran_total: number;
  kehadiran_persen: number;
  tugas_submitted: number;
  tugas_total: number;
  tugas_avg_nilai: number;
  refleksi_submitted: number;
  refleksi_total: number;
  chart_bulanan: ChartBulanan[];
  absensi: AbsensiEvent[];
}

export interface BeswanDetail {
  id: number;
  nama_lengkap: string;
  nim: string;
  email: string;
  hp: string;
  cv_url?: string | null;
  foto_url?: string | null;
  periodes: PeriodeInfo[];
  rapor?: Rapor | null;
  chart_ipk: ChartIPK[];
}

export async function getBeswanDetail(id: number, periodeId?: number) {
  const res = await apiClient.get<BeswanDetail>(
    `/donatur/beswan/${id}`,
    periodeId ? { periode_id: periodeId } : undefined
  );
  return res.data;
}
