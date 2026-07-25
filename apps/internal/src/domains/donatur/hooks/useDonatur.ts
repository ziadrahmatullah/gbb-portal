import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addTag,
  assignPeriode,
  createDonatur,
  getDonaturList,
  getDonaturStats,
  getMonitoringList,
  getPendingLogins,
  getPesanTemplates,
  linkUser,
  removePeriode,
  removeTag,
  unlinkUser,
  updateDonatur,
} from "../services";
import type { UpdateDonaturReq } from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const DONATUR_KEY = "donatur";

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

export function useUpdateDonatur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateDonaturReq }) =>
      updateDonatur(id, body),
    onSuccess: () => {
      toast.success("Donatur berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [DONATUR_KEY] });
    },
  });
}

export function useAssignPeriode() {
  const queryClient = useQueryClient();
  return useMutation({
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
    mutationFn: ({ id, tag }: { id: number; tag: string }) => addTag(id, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATUR_KEY] });
    },
  });
}

export function useRemoveTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tag }: { id: number; tag: string }) => removeTag(id, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATUR_KEY] });
    },
  });
}

export function usePendingLogins(search: string, enabled: boolean) {
  return useQuery({
    queryKey: [DONATUR_KEY, "pending-logins", search],
    queryFn: () => getPendingLogins(search || undefined),
    enabled,
  });
}

export function useLinkUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, email }: { id: number; email: string }) => linkUser(id, email),
    onSuccess: () => {
      toast.success("Akun berhasil di-link");
      queryClient.invalidateQueries({ queryKey: [DONATUR_KEY] });
    },
  });
}

export function useUnlinkUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unlinkUser(id),
    onSuccess: () => {
      toast.success("Akun berhasil di-unlink");
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
