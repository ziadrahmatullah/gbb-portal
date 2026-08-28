import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createMentor,
  deleteMentor,
  getMentorDetail,
  getMentorList,
  getMentorStats,
  updateMentor,
} from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const MENTOR_KEY = "mentor";

export function useMentorList(params: ListParams = {}) {
  return useQuery({
    queryKey: [MENTOR_KEY, "list", params],
    queryFn: () => getMentorList(params),
  });
}

export function useMentorStats() {
  return useQuery({
    queryKey: [MENTOR_KEY, "stats"],
    queryFn: () => getMentorStats(),
  });
}

// Untuk opsi dropdown bidang keahlian (filter list pakai exact match di backend,
// jadi opsinya diambil dari data yang ada).
export function useMentorOptions() {
  return useQuery({
    queryKey: [MENTOR_KEY, "options"],
    queryFn: () => getMentorList({ limit: 100 }),
  });
}

export function useMentorDetail(id: number | null) {
  return useQuery({
    queryKey: [MENTOR_KEY, "detail", id],
    queryFn: () => getMentorDetail(id as number),
    enabled: id != null && Number.isFinite(id),
  });
}

export function useCreateMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => createMentor(form),
    onSuccess: () => {
      toast.success("Mentor berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: [MENTOR_KEY] });
    },
  });
}

export function useUpdateMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form }: { id: number; form: FormData }) => updateMentor(id, form),
    onSuccess: () => {
      toast.success("Data mentor berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [MENTOR_KEY] });
    },
  });
}

export function useDeleteMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteMentor(id),
    onSuccess: () => {
      toast.success("Mentor berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: [MENTOR_KEY] });
    },
  });
}
