import { useQuery } from "@tanstack/react-query";
import { getMyDashboard, getMyPenugasan, getPrestasi } from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const BERANDA_KEY = "beranda";

// Dipakai Beranda DAN AppLayout (info batch di sidebar) — query key sama,
// react-query men-dedup jadi satu request.
export function useMyDashboard(periodeId?: string) {
  return useQuery({
    queryKey: [BERANDA_KEY, "dashboard", periodeId ?? "latest"],
    queryFn: () => getMyDashboard(periodeId),
  });
}

export function useMyPenugasan(params: ListParams = {}) {
  return useQuery({
    queryKey: [BERANDA_KEY, "penugasan", params],
    queryFn: () => getMyPenugasan(params),
  });
}

export function usePrestasi(params: ListParams = {}) {
  return useQuery({
    queryKey: [BERANDA_KEY, "prestasi", params],
    queryFn: () => getPrestasi(params),
  });
}
