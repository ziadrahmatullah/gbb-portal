import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createPeriode,
  deletePeriode,
  getPeriodeList,
  updatePeriode,
} from "../services";
import type { CreatePeriodeReq, UpdatePeriodeReq } from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const PERIODE_KEY = "periode";

export function usePeriodeList(params: ListParams = {}) {
  return useQuery({
    queryKey: [PERIODE_KEY, params],
    queryFn: () => getPeriodeList(params),
  });
}

// Daftar periode untuk dropdown filter (dipakai lintas modul).
export function usePeriodeOptions() {
  return useQuery({
    queryKey: [PERIODE_KEY, "options"],
    queryFn: () => getPeriodeList({ limit: 100 }),
  });
}

export function useCreatePeriode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePeriodeReq) => createPeriode(body),
    onSuccess: () => {
      toast.success("Periode berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: [PERIODE_KEY] });
    },
  });
}

export function useUpdatePeriode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdatePeriodeReq }) =>
      updatePeriode(id, body),
    onSuccess: () => {
      toast.success("Periode berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [PERIODE_KEY] });
    },
  });
}

export function useDeletePeriode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePeriode(id),
    onSuccess: () => {
      toast.success("Periode berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: [PERIODE_KEY] });
    },
  });
}
