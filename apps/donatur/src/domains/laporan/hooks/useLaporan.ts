import { useQuery } from "@tanstack/react-query";
import { getLaporanList } from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const LAPORAN_KEY = "donatur-laporan";

export function useLaporanList(params: ListParams = {}) {
  return useQuery({
    queryKey: [LAPORAN_KEY, "list", params],
    queryFn: () => getLaporanList(params),
  });
}
