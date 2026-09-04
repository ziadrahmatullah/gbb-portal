import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addTag,
  assignPeriode,
  createDonatur,
  getDonaturList,
  getDonaturStats,
  getMonitoringList,
  getPesanTemplates,
  logPesanTerkirim,
  removePeriode,
  removeTag,
  resetDonaturPassword,
  updateDonatur,
} from "../services";
import type { UpdateDonaturReq } from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const DONATUR_KEY = "donatur";

// Mutation di domain ini cukup meng-invalidate DONATUR_KEY sendiri — dilepas
// dari invalidate-all global di queryClient.js (lihat komentar di sana). Toggle
// periode/tag adalah aksi kecil-beruntun; kalau tiap klik me-refetch seluruh
// cache, dialog Edit Donatur terasa lambat dan switch-nya "macet".
const SELF_INVALIDATE = { invalidates: "self" } as const;

export function useDonaturList(params: ListParams = {}) {
  return useQuery({
    queryKey: [DONATUR_KEY, "list", params],
    queryFn: () => getDonaturList(params),
  });
}

export function useDonaturStats() {
  return useQuery({
    queryKey: [DONATUR_KEY, "stats"],
    queryFn: () => getDonaturStats(),
  });
}

export function useCreateDonatur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof createDonatur>[0]) => createDonatur(body),
    onSuccess: () => {
      toast.success("Donatur berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: [DONATUR_KEY] });
    },
  });
}

// Toast sengaja tidak di sini — EditDonaturDialog menyimpan profil + beberapa
// periode dalam satu klik dan menampilkan satu toast gabungan.
export function useUpdateDonatur() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: SELF_INVALIDATE,
    mutationFn: ({ id, body }: { id: number; body: UpdateDonaturReq }) =>
      updateDonatur(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATUR_KEY] });
    },
  });
}

export function useAssignPeriode() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: SELF_INVALIDATE,
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof assignPeriode>[1] }) =>
      assignPeriode(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATUR_KEY] });
    },
  });
}

export function useRemovePeriode() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: SELF_INVALIDATE,
    mutationFn: ({ id, periodeId }: { id: number; periodeId: number }) => removePeriode(id, periodeId),
    onSuccess: () => {
      toast.success("Keikutsertaan periode dihapus");
      queryClient.invalidateQueries({ queryKey: [DONATUR_KEY] });
    },
  });
}

export function useAddTag() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: SELF_INVALIDATE,
    mutationFn: ({ id, tag }: { id: number; tag: string }) => addTag(id, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATUR_KEY] });
    },
  });
}

export function useRemoveTag() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: SELF_INVALIDATE,
    mutationFn: ({ id, tag }: { id: number; tag: string }) => removeTag(id, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATUR_KEY] });
    },
  });
}

export function useResetDonaturPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      resetDonaturPassword(id, password),
    onSuccess: () => {
      toast.success("Password donatur berhasil direset");
      queryClient.invalidateQueries({ queryKey: [DONATUR_KEY] });
    },
  });
}

export function useMonitoringList(params: ListParams = {}) {
  return useQuery({
    queryKey: [DONATUR_KEY, "monitoring", params],
    queryFn: () => getMonitoringList(params),
  });
}

export function usePesanTemplates() {
  return useQuery({
    queryKey: [DONATUR_KEY, "pesan-template"],
    queryFn: () => getPesanTemplates(),
  });
}

// Tanda "sudah dikirim WA" — dicatat SETELAH wa.me dibuka, best-effort. Hanya
// invalidate query monitoring supaya baris lain tidak ikut refetch.
export function useLogPesanTerkirim() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: SELF_INVALIDATE,
    mutationFn: ({ id, bulan, konteks }: { id: number; bulan: string; konteks: string }) =>
      logPesanTerkirim(id, { bulan, konteks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATUR_KEY, "monitoring"] });
    },
  });
}
