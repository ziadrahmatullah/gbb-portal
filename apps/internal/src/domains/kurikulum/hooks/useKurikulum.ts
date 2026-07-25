import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createLibrary,
  createTopik,
  deleteLibrary,
  deleteTopik,
  getEventOptions,
  getLibraryList,
  getLibraryStats,
  getTopikList,
  getTopikUsulanList,
  updateLibrary,
  updateTopik,
  updateTopikUsulanStatus,
} from "../services";
import type { CreateTopikReq, UpdateLibraryReq, UpdateTopikReq } from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const KURIKULUM_KEY = "kurikulum";

// ─── Topik ───────────────────────────────────────────────────────────────

export function useTopikList(params: ListParams = {}) {
  return useQuery({
    queryKey: [KURIKULUM_KEY, "topik", params],
    queryFn: () => getTopikList(params),
  });
}

export function useCreateTopik() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTopikReq) => createTopik(body),
    onSuccess: () => {
      toast.success("Topik berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: [KURIKULUM_KEY, "topik"] });
    },
  });
}

export function useUpdateTopik() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateTopikReq }) => updateTopik(id, body),
    onSuccess: () => {
      toast.success("Topik berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [KURIKULUM_KEY, "topik"] });
    },
  });
}

export function useDeleteTopik() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTopik(id),
    onSuccess: () => {
      toast.success("Topik berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: [KURIKULUM_KEY, "topik"] });
    },
  });
}

// ─── Library ─────────────────────────────────────────────────────────────

export function useLibraryList(params: ListParams = {}) {
  return useQuery({
    queryKey: [KURIKULUM_KEY, "library", params],
    queryFn: () => getLibraryList(params),
  });
}

export function useLibraryStats() {
  return useQuery({
    queryKey: [KURIKULUM_KEY, "library-stats"],
    queryFn: () => getLibraryStats(),
  });
}

export function useCreateLibrary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => createLibrary(form),
    onSuccess: () => {
      toast.success("Materi berhasil diupload");
      queryClient.invalidateQueries({ queryKey: [KURIKULUM_KEY] });
    },
  });
}

export function useUpdateLibrary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateLibraryReq }) => updateLibrary(id, body),
    onSuccess: () => {
      toast.success("Materi berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [KURIKULUM_KEY] });
    },
  });
}

export function useDeleteLibrary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteLibrary(id),
    onSuccess: () => {
      toast.success("Materi berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: [KURIKULUM_KEY] });
    },
  });
}

// ─── Topik Usulan & Event options ────────────────────────────────────────

export function useTopikUsulanList(params: ListParams = {}) {
  return useQuery({
    queryKey: [KURIKULUM_KEY, "topik-usulan", params],
    queryFn: () => getTopikUsulanList(params),
  });
}

export function useEventOptions() {
  return useQuery({
    queryKey: ["event", "options"],
    queryFn: () => getEventOptions(),
  });
}

export function useUpdateTopikUsulanStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "pending" | "reviewed" }) =>
      updateTopikUsulanStatus(id, status),
    onSuccess: () => {
      toast.success("Status usulan diperbarui");
      queryClient.invalidateQueries({ queryKey: [KURIKULUM_KEY, "topik-usulan"] });
    },
  });
}
