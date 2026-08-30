import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBeswan,
  getBeswanDetail,
  getBeswanList,
  getBeswanPenugasan,
  getBeswanStats,
  updateBeswan,
  updateBeswanStatus,
} from "../services";
import type {
  BeswanListParams,
  BeswanPenugasanParams,
  BeswanStatus,
  CreateBeswanReq,
  UpdateBeswanReq,
} from "../services";

export const BESWAN_KEY = "beswan";

export function useBeswanList(params: BeswanListParams = {}) {
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

export function useBeswanPenugasan(beswanId: number, params: BeswanPenugasanParams = {}) {
  return useQuery({
    queryKey: [BESWAN_KEY, "penugasan", beswanId, params],
    queryFn: () => getBeswanPenugasan(beswanId, params),
    enabled: Number.isFinite(beswanId),
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

export function useUpdateBeswanStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: BeswanStatus }) =>
      updateBeswanStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(`Status beswan diubah menjadi ${status}`);
      queryClient.invalidateQueries({ queryKey: [BESWAN_KEY] });
    },
  });
}

export function useUpdateBeswan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateBeswanReq }) => updateBeswan(id, body),
    onSuccess: () => {
      toast.success("Data beswan berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [BESWAN_KEY] });
    },
  });
}
