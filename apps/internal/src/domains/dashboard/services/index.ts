import { apiClient } from "@/shared/lib/apiClient";

// Mirror gbb-backend dto/dashboard_dto.go
export interface DashboardEventData {
  total_event: number;
  event_selesai: number;
  beswan_aktif: number;
  donasi_bulan_ini: number;
}

export interface DashboardAnalitikData {
  beswan_aktif: number;
  avg_kehadiran: number; // skala 0-100
  avg_ipk: number;
  refleksi_ontime: number; // skala 0-100
}

export interface DashboardGrowthData {
  total_pendaftar: number;
  minat_kontribusi: number;
  calon_mentor: number;
  calon_donatur: number;
}

// periodeId kosong/undefined = semua periode (backend pakai DefaultQuery "")
export async function getDashboardEvent(periodeId?: string) {
  const res = await apiClient.get<DashboardEventData>(
    "/internal/dashboard/event",
    periodeId ? { periode_id: periodeId } : undefined
  );
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
