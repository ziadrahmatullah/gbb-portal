import { apiClient } from "@/shared/lib/apiClient";

// Mirror gbb-backend dto/dashboard_dto.go (bentuk final per balasan FEpromt18)

// Bentuk umum chart kategorikal
export interface ChartCount {
  label: string;
  jumlah: number;
}

// Seri bulanan: `bulan` = key sortable ("2026-01"), sudah terurut dari BE —
// jangan sort ulang di FE.
export interface SeriBulanan {
  bulan: string;
  label: string; // "Jan 26"
  jumlah: number;
}

export interface DashboardEventData {
  total_event: number;
  event_selesai: number;
  beswan_aktif: number;
  donasi_bulan_ini: number;
  event_per_bulan: SeriBulanan[];
  kehadiran: { hadir: number; tidak_hadir: number; persen_hadir: number };
  // pending = ekspektasi pengumpulan (penugasan x beswan periode) yang belum masuk
  penugasan: { submitted: number; graded: number; pending: number };
  // FEpromt25 §6 — selalu 3 entri (Talkshow, GROWTH, Lainnya), zero-filled,
  // urutan tetap, supaya chart stabil saat difilter tipe.
  event_per_tipe?: ChartCount[];
}

export type EventTipeFilter = "talkshow" | "growth" | "other";

export interface TrenKehadiranBulan {
  bulan: string;
  label: string;
  persen: number;
}

export interface RefleksiBulan {
  bulan: string;
  label: string;
  selesai: number; // submitted
  total: number; // baris refleksi ada
}

export interface NilaiTugasBatch {
  batch: string; // nama periode
  avg_nilai: number;
}

export interface ProgressBeswan {
  beswan_id: number;
  nama: string;
  hadir_persen: number;
  avg_nilai_tugas: number;
  refleksi_selesai: number;
  refleksi_total: number;
  ipk: number;
  prestasi: number;
}

export interface DashboardAnalitikData {
  beswan_aktif: number;
  avg_kehadiran: number; // skala 0-100
  avg_ipk: number;
  // % semua baris refleksi yang disubmit <= akhir bulan refleksinya
  // (draft & telat = tidak ontime), skala 0-100
  refleksi_ontime: number;
  tren_kehadiran: TrenKehadiranBulan[];
  refleksi_per_bulan: RefleksiBulan[];
  // 4 bucket tetap: "< 2.50", "2.50 - 2.99", "3.00 - 3.49", "3.50 - 4.00"
  distribusi_ipk: ChartCount[];
  nilai_tugas_per_batch: NilaiTugasBatch[];
  // FEpromt25 §3 — bucket "Belum diisi" SELALU paling akhir; jurusan urut jumlah
  // desc, semester menaik. Jangan sort ulang.
  distribusi_jurusan?: ChartCount[];
  distribusi_semester?: ChartCount[];
  // Tanpa pagination (skala beswan masih kecil)
  progress_beswan: ProgressBeswan[];
}

export interface DashboardGrowthData {
  total_pendaftar: number;
  minat_kontribusi: number;
  calon_mentor: number;
  calon_donatur: number;
  distribusi_profesi: ChartCount[];
  minat_kontribusi_chart: ChartCount[];
  tren_tema: ChartCount[];
  bidang_keahlian: ChartCount[];
  universitas_asal: ChartCount[];
  saluran_info: ChartCount[];
  pengenalan_gbb: ChartCount[];
}

// Hanya field yang datanya memang dikumpulkan form donatur —
// jenis_beasiswa/kriteria/pekerjaan/saluran_info/alumni/faktor_ragu tidak ada.
export interface DashboardTrendDonaturData {
  total_estimasi_komitmen: number;
  total_calon_donatur: number;
  tren_pendaftaran: SeriBulanan[];
  skema_donasi: ChartCount[]; // label Indonesia: "Patungan Bulanan" dst.
}

// periodeId kosong/undefined = semua periode (backend pakai DefaultQuery "")
// tipe= menyaring total_event, event_selesai, event_per_bulan, kehadiran,
// event_per_tipe; beswan_aktif / donasi_bulan_ini / penugasan tidak ikut.
export async function getDashboardEvent(periodeId?: string, tipe?: EventTipeFilter) {
  const res = await apiClient.get<DashboardEventData>("/internal/dashboard/event", {
    ...(periodeId ? { periode_id: periodeId } : {}),
    ...(tipe ? { tipe } : {}),
  });
  return res.data;
}

export async function getDashboardAnalitik(periodeId?: string) {
  const res = await apiClient.get<DashboardAnalitikData>(
    "/internal/dashboard/analitik-beswan",
    periodeId ? { periode_id: periodeId } : undefined
  );
  return res.data;
}

export async function getDashboardGrowth() {
  const res = await apiClient.get<DashboardGrowthData>("/internal/dashboard/growth");
  return res.data;
}

export async function getDashboardTrendDonatur() {
  const res = await apiClient.get<DashboardTrendDonaturData>(
    "/internal/dashboard/trend-donatur"
  );
  return res.data;
}
