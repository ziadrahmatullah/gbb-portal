import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createHighlight, deleteHighlight, getHighlightList, updateHighlight } from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const HIGHLIGHT_KEY = "highlight";

// Mutation di sini cukup invalidate key-nya sendiri (lihat queryClient.js) —
// mengatur urutan = beberapa PUT kecil berturut-turut, jangan sampai tiap
// klik me-refetch dashboard & monitoring.
const SELF_INVALIDATE = { invalidates: "self" } as const;

export function useHighlightList(params: ListParams = {}) {
  return useQuery({
    queryKey: [HIGHLIGHT_KEY, "list", params],
    queryFn: () => getHighlightList(params),
  });
}

export function useCreateHighlight() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: SELF_INVALIDATE,
    mutationFn: (form: FormData) => createHighlight(form),
    onSuccess: () => {
      toast.success("Highlight ditambahkan");
      queryClient.invalidateQueries({ queryKey: [HIGHLIGHT_KEY] });
    },
  });
}

export function useUpdateHighlight() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: SELF_INVALIDATE,
    mutationFn: ({ id, form }: { id: number; form: FormData }) => updateHighlight(id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HIGHLIGHT_KEY] });
    },
  });
}

export function useDeleteHighlight() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: SELF_INVALIDATE,
    mutationFn: (id: number) => deleteHighlight(id),
    onSuccess: () => {
      toast.success("Highlight dihapus");
      queryClient.invalidateQueries({ queryKey: [HIGHLIGHT_KEY] });
    },
  });
}
