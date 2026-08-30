import { apiClient, API_BASE_URL } from "@/shared/lib/apiClient";
import { toPaged } from "@/shared/lib/apiTypes";
import type { ListParams } from "@/shared/lib/apiTypes";

// Mirror gbb-backend dto/beswan_dto.go (BeswanDetailRes untuk /beswan/dashboard)
export interface PeriodeInfo {
  periode_id: number;
  periode_nama: string;
  status: string; // aktif | alumni
}

export interface ChartBulanan {
  bulan: number;
  tahun: number;
  kehadiran_persen: number;
  avg_nilai: number | null; // null = tidak ada tugas dinilai bulan itu (bukan nilai 0)
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
  absensi: AbsensiEvent[]; // sumber "My Events"
}

export interface MyDashboard {
  id: number;
  nama_lengkap: string;
  nim: string;
  email: string;
  hp: string;
  cv_url?: string | null;
  foto_url?: string | null;
  periodes: PeriodeInfo[];
  rapor?: Rapor | null; // null bila belum terdaftar periode manapun
  chart_ipk: ChartIPK[];
  reminders?: string[]; // string bebas dari backend, render apa adanya
}

// Tanpa periode_id = backend pakai periode terakhir yang diikuti beswan
export async function getMyDashboard(periodeId?: string) {
  const res = await apiClient.get<MyDashboard>(
    "/beswan/dashboard",
    periodeId ? { periode_id: periodeId } : undefined
  );
  return res.data;
}

// ─── My Tasks ────────────────────────────────────────────────────────────

// MyPenugasanRes = penugasan + hasil milik beswan login (null = belum kumpul)
export interface MyPenugasan {
  id: number;
  kode_penugasan: string;
  judul: string;
  deskripsi: string;
  lampiran_url?: string | null;
  deadline: string;
  nilai_maks: number;
  status: string; // status penugasan: aktif | selesai
  hasil_status?: string | null; // submitted | graded | null = belum kumpul
  file_url?: string | null;
  submitted_at?: string | null;
  terlambat: boolean;
  nilai?: number | null;
  feedback?: string | null;
}

export async function getMyPenugasan(params: ListParams = {}) {
  const res = await apiClient.get<MyPenugasan[]>("/beswan/penugasan", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

// ─── Prestasiku ──────────────────────────────────────────────────────────

export interface PrestasiFile {
  id: number;
  file_url: string;
  tipe: string;
}

export interface Prestasi {
  id: number;
  judul: string;
  deskripsi: string;
  kategori: string; // luar_kampus | organisasi | studi
  tanggal: string;
  files: PrestasiFile[];
}

export const PRESTASI_KATEGORI: Record<string, { label: string; icon: string }> = {
  luar_kampus: { label: "Luar Kampus", icon: "🌐" },
  organisasi: { label: "Organisasi", icon: "🤝" },
  studi: { label: "Studi", icon: "🏫" },
};

export async function getPrestasi(params: ListParams = {}) {
  const res = await apiClient.get<Prestasi[]>("/beswan/prestasi", {
    page: 1,
    limit: 20,
    ...params,
  });
  return toPaged(res);
}

// file_url/foto/slide dari backend bisa path relatif (statis) atau URL absolut
export function assetUrl(path?: string | null) {
  if (!path) return undefined;
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}
