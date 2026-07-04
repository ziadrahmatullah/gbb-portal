import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { galleryService } from "../services";

const KEY = "galleries";

export function useGalleries(params = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => galleryService.getAll(params),
  });
}

export function useGallery(id) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => galleryService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => galleryService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => galleryService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => galleryService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
