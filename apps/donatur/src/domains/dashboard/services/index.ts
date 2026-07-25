import { apiClient } from "@/shared/lib/apiClient";

// Mirror gbb-backend dto/dashboard_dto.go DashboardBulanRes
export interface EventBulan {
  bulan: number;
  tahun: number;
  total: number;
}

// Mirror DonaturDashboardRes (GET /donatur/dashboard-gbb)
export interface DashboardGBB {
  narasi: string; // kalimat siap-pakai dari backend — tampilkan apa adanya
  total_dana: number;
  donatur_aktif: number;
  persen_beasiswa: number;
  beswan_aktif: number;
  avg_kehadiran: number;
  jumlah_event: number;
  jumlah_topik: number;
  event_per_bulan: EventBulan[];
}

export async function getDashboardGBB(periodeId?: number) {
  const res = await apiClient.get<DashboardGBB>(
    "/donatur/dashboard-gbb",
    periodeId ? { periode_id: periodeId } : undefined
  );
  return res.data;
}
