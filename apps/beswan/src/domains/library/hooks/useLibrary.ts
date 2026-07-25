import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getLibraryList, getLibraryStats, usulTopik } from "../services";
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

export function useUsulTopik() {
  return useMutation({
    mutationFn: (topik: string) => usulTopik(topik),
    onSuccess: () => toast.success("Usulan topik terkirim — terima kasih!"),
  });
}
