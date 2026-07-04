import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { articleService } from "../services";

const KEY = "articles";

export function useArticles(params = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => articleService.getAll(params),
  });
}

export function useArticle(id) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => articleService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => articleService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => articleService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useSetHighlightArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_highlight }) => articleService.setHighlight(id, is_highlight),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => articleService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
