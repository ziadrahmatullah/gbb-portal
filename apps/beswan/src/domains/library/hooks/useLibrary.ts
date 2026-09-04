import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getLibraryList, getLibraryStats, getMyTopikUsulan, usulTopik } from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const LIBRARY_KEY = "library";

export function useLibraryList(params: ListParams = {}) {
  return useQuery({
    queryKey: [LIBRARY_KEY, "list", params],
    queryFn: () => getLibraryList(params),
  });
}

export function useLibraryStats() {
  return useQuery({
    queryKey: [LIBRARY_KEY, "stats"],
    queryFn: () => getLibraryStats(),
  });
}

// Daftar usulan milik beswan. retry:false — endpoint bisa belum ada (404)
// sebelum BE rilis; komponen menyembunyikan bagian ini saat isError.
export function useMyTopikUsulan() {
  return useQuery({
    queryKey: [LIBRARY_KEY, "usulan"],
    queryFn: getMyTopikUsulan,
    retry: false,
  });
}

export function useUsulTopik() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topik: string) => usulTopik(topik),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LIBRARY_KEY, "usulan"] });
      toast.success("Usulan topik terkirim — terima kasih!");
    },
  });
}
