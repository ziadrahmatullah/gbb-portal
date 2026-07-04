import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services";

const KEY = "dashboard";

export function useDashboardMasterData() {
  return useQuery({
    queryKey: [KEY, "master-data"],
    queryFn: () => dashboardService.getMasterData(),
  });
}

export function useDashboardTransaction(params = {}) {
  return useQuery({
    queryKey: [KEY, "transaction", params],
    queryFn: () => dashboardService.getTransaction(params),
  });
}

export function useDashboardQurban(params = {}) {
  return useQuery({
    queryKey: [KEY, "qurban", params],
    queryFn: () => dashboardService.getQurban(params),
  });
}
