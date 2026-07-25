import { useQuery } from "@tanstack/react-query";
import { getHighlight, getMyDashboard } from "../services";

export const BERANDA_KEY = "beranda";

export function useMyDashboard() {
  return useQuery({
    queryKey: [BERANDA_KEY, "dashboard"],
    queryFn: getMyDashboard,
  });
}

export function useHighlight() {
  return useQuery({
    queryKey: [BERANDA_KEY, "highlight"],
    queryFn: getHighlight,
  });
}
