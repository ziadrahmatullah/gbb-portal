import { useQuery } from "@tanstack/react-query";
import {
  getDashboardEvent,
  getDashboardAnalitik,
  getDashboardGrowth,
} from "../services";

export const DASHBOARD_KEY = "dashboard";

export function useDashboardEvent(periodeId?: string) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, "event", periodeId ?? "all"],
    queryFn: () => getDashboardEvent(periodeId),
  });
}

export function useDashboardAnalitik(periodeId?: string) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, "analitik", periodeId ?? "all"],
    queryFn: () => getDashboardAnalitik(periodeId),
  });
}

export function useDashboardGrowth() {
  return useQuery({
    queryKey: [DASHBOARD_KEY, "growth"],
    queryFn: () => getDashboardGrowth(),
  });
}
