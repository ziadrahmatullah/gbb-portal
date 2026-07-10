import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createKategori,
  deleteCashflow,
  getCashflowList,
  getKategoriList,
  getOverview,
  getOverviewBreakdown,
  updateCashflow,
  updateKategori,
  uploadCashflow,
} from "../services";
import type { UpdateCashflowReq } from "../services";
import { getDonaturList } from "@/domains/donatur/services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const KEUANGAN_KEY = "keuangan";

// ─── Cashflow ────────────────────────────────────────────────────────────

export function useCashflowList(params: ListParams = {}) {
  return useQuery({
    queryKey: [KEUANGAN_KEY, "cashflow", params],
    queryFn: () => getCashflowList(params),
  });
}

export function useUploadCashflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadCashflow(file),
    onSuccess: (data) => {
      const s = data?.summary;
      toast.success(
        s
          ? `Upload selesai: ${s.inserted_count} baris tersimpan, ${s.duplicate_count} duplikat dilewati`
          : "Upload selesai"
      );
      queryClient.invalidateQueries({ queryKey: [KEUANGAN_KEY] });
    },
  });
}

export function useUpdateCashflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateCashflowReq }) =>
      updateCashflow(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEUANGAN_KEY] });
    },
  });
}

export function useDeleteCashflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCashflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEUANGAN_KEY] });
    },
  });
}

// ─── Master Kategori ─────────────────────────────────────────────────────

export function useKategoriList(params: ListParams = {}) {
  return useQuery({
    queryKey: [KEUANGAN_KEY, "kategori", params],
    queryFn: () => getKategoriList(params),
  });
}

export function useCreateKategori() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof createKategori>[0]) => createKategori(body),
    onSuccess: () => {
      toast.success("Kategori berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: [KEUANGAN_KEY, "kategori"] });
    },
  });
}

export function useUpdateKategori() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateKategori>[1] }) =>
      updateKategori(id, body),
    onSuccess: () => {
      toast.success("Kategori berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [KEUANGAN_KEY, "kategori"] });
    },
  });
}

// ─── Overview & opsi ─────────────────────────────────────────────────────

export function useOverview(periodeId?: string) {
  return useQuery({
    queryKey: [KEUANGAN_KEY, "overview", periodeId ?? "all"],
    queryFn: () => getOverview(periodeId),
  });
}

export function useOverviewBreakdown() {
  return useQuery({
    queryKey: [KEUANGAN_KEY, "overview-breakdown"],
    queryFn: () => getOverviewBreakdown(),
  });
}

export function useDonaturOptions() {
  return useQuery({
    queryKey: ["donatur", "options"],
    queryFn: () => getDonaturList({ limit: 100 }),
  });
}
