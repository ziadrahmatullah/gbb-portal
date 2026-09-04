import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  batalkanPengumpulan,
  getMyPenugasanDetail,
  getMyPenugasanList,
  kumpulPenugasan,
} from "../services";
import type { MyPenugasanListParams } from "../services";

export const PENUGASAN_KEY = "penugasan";

export function useMyPenugasanList(params: MyPenugasanListParams = {}) {
  return useQuery({
    queryKey: [PENUGASAN_KEY, "list", params],
    queryFn: () => getMyPenugasanList(params),
  });
}

export function useMyPenugasanDetail(id: number) {
  return useQuery({
    queryKey: [PENUGASAN_KEY, "detail", id],
    queryFn: () => getMyPenugasanDetail(id),
    enabled: Number.isFinite(id),
  });
}

export function useBatalkanPengumpulan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => batalkanPengumpulan(id),
    onSuccess: (message) => {
      toast.success(message || "Pengumpulan dibatalkan");
      queryClient.invalidateQueries({ queryKey: [PENUGASAN_KEY] });
    },
  });
}

export function useKumpulPenugasan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => kumpulPenugasan(id, file),
    onSuccess: (message) => {
      toast.success(message || "Tugas berhasil dikumpulkan");
      // List + detail segar (status pengumpulan berubah)
      queryClient.invalidateQueries({ queryKey: [PENUGASAN_KEY] });
    },
  });
}
