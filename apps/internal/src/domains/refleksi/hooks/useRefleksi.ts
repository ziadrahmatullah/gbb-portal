import { useQuery } from "@tanstack/react-query";
import { getRefleksiDetail, listRefleksi } from "../services";
import type { RefleksiListParams } from "../services";

export const REFLEKSI_KEY = "refleksi";

export function useRefleksiList(params: RefleksiListParams = {}) {
  return useQuery({
    queryKey: [REFLEKSI_KEY, "list", params],
    queryFn: () => listRefleksi(params),
  });
}

export function useRefleksiDetail(id: number) {
  return useQuery({
    queryKey: [REFLEKSI_KEY, "detail", id],
    queryFn: () => getRefleksiDetail(id),
    enabled: Number.isFinite(id),
  });
}
