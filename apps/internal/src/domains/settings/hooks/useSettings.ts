import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  changeMyPassword,
  createAIConfig,
  createPesanTemplate,
  createUser,
  deleteAIConfig,
  deletePesanTemplate,
  deleteUser,
  getAIConfigList,
  getUserList,
  resetUserPassword,
  setActiveAIConfig,
  updateAIConfig,
  updatePesanTemplate,
  updateUser,
} from "../services";
import type {
  CreateAIConfigReq,
  CreateUserReq,
  PesanTemplateBody,
  UpdateAIConfigReq,
  UpdateUserReq,
} from "../services";
import { getPesanTemplates } from "@/domains/donatur/services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const SETTINGS_KEY = "settings";

// ─── Users ───────────────────────────────────────────────────────────────

export function useUserList(params: ListParams = {}) {
  return useQuery({
    queryKey: [SETTINGS_KEY, "users", params],
    queryFn: () => getUserList(params),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserReq) => createUser(body),
    onSuccess: () => {
      toast.success("User berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, "users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateUserReq }) => updateUser(id, body),
    onSuccess: () => {
      toast.success("User berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, "users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      toast.success("User berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, "users"] });
    },
    // Error 409 (hapus diri/admin terakhir/masih direferensikan) sudah
    // di-toast interceptor dengan pesan backend apa adanya.
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      resetUserPassword(id, password),
    onSuccess: () => toast.success("Password berhasil direset"),
  });
}

// Ganti password sendiri — tidak menyentuh cache users (endpoint terpisah)
export function useChangeMyPassword() {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      changeMyPassword(oldPassword, newPassword),
    onSuccess: () => toast.success("Password berhasil diubah"),
  });
}

// ─── Template Pesan WA ───────────────────────────────────────────────────

export function usePesanTemplateList() {
  return useQuery({
    queryKey: [SETTINGS_KEY, "pesan-template"],
    queryFn: () => getPesanTemplates(),
  });
}

export function useCreatePesanTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PesanTemplateBody) => createPesanTemplate(body),
    onSuccess: () => {
      toast.success("Template berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, "pesan-template"] });
      queryClient.invalidateQueries({ queryKey: ["donatur", "pesan-template"] });
    },
  });
}

export function useUpdatePesanTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<PesanTemplateBody> }) =>
      updatePesanTemplate(id, body),
    onSuccess: () => {
      toast.success("Template berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, "pesan-template"] });
      queryClient.invalidateQueries({ queryKey: ["donatur", "pesan-template"] });
    },
  });
}

export function useDeletePesanTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePesanTemplate(id),
    onSuccess: () => {
      toast.success("Template berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, "pesan-template"] });
      queryClient.invalidateQueries({ queryKey: ["donatur", "pesan-template"] });
    },
  });
}

// ─── Konfigurasi AI ──────────────────────────────────────────────────────

export function useAIConfigList() {
  return useQuery({
    queryKey: [SETTINGS_KEY, "ai-config"],
    queryFn: () => getAIConfigList(),
  });
}

export function useCreateAIConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAIConfigReq) => createAIConfig(body),
    onSuccess: () => {
      toast.success("Provider AI berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, "ai-config"] });
    },
  });
}

export function useUpdateAIConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateAIConfigReq }) =>
      updateAIConfig(id, body),
    onSuccess: () => {
      toast.success("Provider AI berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, "ai-config"] });
    },
  });
}

export function useDeleteAIConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAIConfig(id),
    onSuccess: () => {
      toast.success("Provider AI berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, "ai-config"] });
    },
  });
}

export function useSetActiveAIConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => setActiveAIConfig(id),
    onSuccess: () => {
      toast.success("Provider aktif diperbarui");
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, "ai-config"] });
    },
  });
}
