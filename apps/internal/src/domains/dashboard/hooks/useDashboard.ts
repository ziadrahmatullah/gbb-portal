import { useQuery } from "@tanstack/react-query";
import type { EventTipeFilter } from "../services";
import {
  getDashboardEvent,
  getDashboardAnalitik,
  getDashboardGrowth,
  getDashboardTrendDonatur,
} from "../services";

export const DASHBOARD_KEY = "dashboard";

export function useDashboardEvent(periodeId?: string, tipe?: EventTipeFilter) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, "event", periodeId ?? "all", tipe ?? "all"],
    queryFn: () => getDashboardEvent(periodeId, tipe),
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

export function useDashboardTrendDonatur() {
  return useQuery({
    queryKey: [DASHBOARD_KEY, "trend-donatur"],
    queryFn: () => getDashboardTrendDonatur(),
  });
}
