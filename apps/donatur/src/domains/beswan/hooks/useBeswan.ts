import { useQuery } from "@tanstack/react-query";
import { getBeswanDetail, getBeswanList } from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const BESWAN_KEY = "donatur-beswan";

export function useBeswanList(periodeId: number | undefined, params: ListParams = {}) {
  return useQuery({
    queryKey: [BESWAN_KEY, "list", periodeId, params],
    queryFn: () => getBeswanList(periodeId!, params),
    enabled: !!periodeId,
  });
}

export function useBeswanDetail(id: number | undefined, periodeId?: number) {
  return useQuery({
    queryKey: [BESWAN_KEY, "detail", id, periodeId],
    queryFn: () => getBeswanDetail(id!, periodeId),
    enabled: !!id,
  });
}
