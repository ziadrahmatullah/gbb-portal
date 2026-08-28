import { useQuery } from "@tanstack/react-query";
import { getBeswanEventDetail, getBeswanEventList } from "../services";
import type { BeswanEventListParams } from "../services";

export const EVENT_KEY = "event";

export function useBeswanEventList(params: BeswanEventListParams = {}) {
  return useQuery({
    queryKey: [EVENT_KEY, "list", params],
    queryFn: () => getBeswanEventList(params),
  });
}

export function useBeswanEventDetail(id: number) {
  return useQuery({
    queryKey: [EVENT_KEY, "detail", id],
    queryFn: () => getBeswanEventDetail(id),
    enabled: Number.isFinite(id),
  });
}
