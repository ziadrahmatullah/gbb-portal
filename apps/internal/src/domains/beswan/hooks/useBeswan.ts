import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBeswan,
  getBeswanDetail,
  getBeswanList,
  getBeswanRefleksi,
  getBeswanStats,
  updateBeswan,
} from "../services";
import type { CreateBeswanReq } from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const BESWAN_KEY = "beswan";

export function useBeswanList(params: ListParams = {}) {
  return useQuery({
    queryKey: [BESWAN_KEY, "list", params],
    queryFn: () => getBeswanList(params),
  });
}

export function useBeswanStats(periodeId?: string) {
  return useQuery({
    queryKey: [BESWAN_KEY, "stats", periodeId ?? "all"],
    queryFn: () => getBeswanStats(periodeId),
  });
}

export function useBeswanDetail(id: number, periodeId?: string) {
  return useQuery({
    queryKey: [BESWAN_KEY, "detail", id, periodeId ?? "default"],
    queryFn: () => getBeswanDetail(id, periodeId),
    enabled: Number.isFinite(id),
  });
}

export function useBeswanRefleksi(beswanId: number, enabled: boolean) {
  return useQuery({
    queryKey: [BESWAN_KEY, "refleksi", beswanId],
    queryFn: () => getBeswanRefleksi(beswanId),
    enabled,
  });
}

export function useCreateBeswan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBeswanReq) => createBeswan(body),
    onSuccess: () => {
      toast.success("Beswan berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: [BESWAN_KEY] });
    },
  });
}

export function useUpdateBeswan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form }: { id: number; form: FormData }) => updateBeswan(id, form),
    onSuccess: () => {
      toast.success("Data beswan berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [BESWAN_KEY] });
    },
  });
}
