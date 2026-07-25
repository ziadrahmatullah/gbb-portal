import { useQuery } from "@tanstack/react-query";
import { getDashboardGBB } from "../services";

export const DASHBOARD_KEY = "dashboard-gbb";

export function useDashboardGBB(periodeId?: number) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, periodeId ?? "latest"],
    queryFn: () => getDashboardGBB(periodeId),
  });
}
