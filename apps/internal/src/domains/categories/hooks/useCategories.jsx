import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "../services";

const KEY = "categories";

export function useCategories(params = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => categoryService.getAll(params),
  });
}

export function useCategory(id) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => categoryService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => categoryService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => categoryService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => categoryService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
