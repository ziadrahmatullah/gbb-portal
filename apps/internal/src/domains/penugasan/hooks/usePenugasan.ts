import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createPenugasan,
  deletePenugasan,
  getHasilList,
  getPenugasanList,
  getPenugasanStats,
  nilaiHasil,
  updatePenugasan,
} from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const PENUGASAN_KEY = "penugasan";

export function usePenugasanList(params: ListParams = {}) {
  return useQuery({
    queryKey: [PENUGASAN_KEY, "list", params],
    queryFn: () => getPenugasanList(params),
  });
}

export function usePenugasanStats(periodeId?: string) {
  return useQuery({
    queryKey: [PENUGASAN_KEY, "stats", periodeId ?? "all"],
    queryFn: () => getPenugasanStats(periodeId),
  });
}

export function useHasilList(penugasanId: number | null) {
  return useQuery({
    queryKey: [PENUGASAN_KEY, "hasil", penugasanId],
    queryFn: () => getHasilList(penugasanId as number),
    enabled: penugasanId != null,
  });
}

export function useCreatePenugasan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => createPenugasan(form),
    onSuccess: (data) => {
      // Kode auto dari response backend, ditampilkan setelah tersimpan
      toast.success(`Penugasan ${data?.kode_penugasan ?? ""} berhasil dibuat`.trim());
      queryClient.invalidateQueries({ queryKey: [PENUGASAN_KEY] });
    },
  });
}

export function useUpdatePenugasan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form }: { id: number; form: FormData }) => updatePenugasan(id, form),
    onSuccess: () => {
      toast.success("Penugasan berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [PENUGASAN_KEY] });
    },
  });
}

export function useDeletePenugasan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePenugasan(id),
    onSuccess: () => {
      toast.success("Penugasan berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: [PENUGASAN_KEY] });
    },
  });
}

export function useNilaiHasil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ hasilId, nilai, feedback }: { hasilId: number; nilai: number; feedback?: string }) =>
      nilaiHasil(hasilId, { nilai, feedback }),
    onSuccess: () => {
      toast.success("Nilai berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: [PENUGASAN_KEY] });
    },
  });
}
