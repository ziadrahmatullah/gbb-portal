import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyDashboard,
  getMyPenugasan,
  getNotifikasi,
  getPrestasi,
  markNotifikasiRead,
} from "../services";
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

export function useNotifikasi(unreadOnly = true) {
  return useQuery({
    queryKey: [BERANDA_KEY, "notifikasi", unreadOnly],
    queryFn: () => getNotifikasi(unreadOnly ? { is_read: "false" } : {}),
  });
}

export function useMarkNotifikasiRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markNotifikasiRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BERANDA_KEY, "notifikasi"] });
    },
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
