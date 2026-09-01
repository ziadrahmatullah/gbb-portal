import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  commitCashflow,
  createKategori,
  deleteCashflow,
  getCashflowList,
  getKategoriList,
  getOverview,
  getOverviewBreakdown,
  updateCashflow,
  previewCashflow,
  updateKategori,
} from "../services";
import type { CommitCashflowRow, UpdateCashflowReq } from "../services";
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

// Dry-run — tidak menyentuh DB, jadi tidak ada query yang perlu di-invalidate
export function usePreviewCashflow() {
  return useMutation({
    mutationFn: ({ file, sumber }: { file: File; sumber: string }) =>
      previewCashflow(file, sumber),
    onSuccess: (data) => {
      const s = data?.summary;
      toast.success(
        s
          ? `${s.new_count} baris siap diklasifikasi, ${s.duplicate_count} duplikat dilewati`
          : "File berhasil dibaca"
      );
    },
  });
}

// Commit — titik satu-satunya di mana baris mutasi benar-benar masuk DB.
// inserted_count < requested BUKAN kegagalan: selisihnya baris duplikat yang
// dilewati backend, jadi dilaporkan sebagai info di deskripsi toast sukses.
export function useCommitCashflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: CommitCashflowRow[]) => commitCashflow(rows),
    onSuccess: (data) => {
      const s = data?.summary;
      toast.success(s ? `${s.inserted_count} baris tersimpan` : "Data tersimpan", {
        description: s?.skipped_count
          ? `${s.skipped_count} baris dilewati karena sudah ada di database.`
          : undefined,
      });
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

export function useOverviewBreakdown(periodeId?: string) {
  return useQuery({
    queryKey: [KEUANGAN_KEY, "overview-breakdown", periodeId ?? "all"],
    queryFn: () => getOverviewBreakdown(periodeId),
  });
}

export function useDonaturOptions() {
  return useQuery({
    queryKey: ["donatur", "options"],
    queryFn: () => getDonaturList({ limit: 100 }),
  });
}
