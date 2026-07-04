import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mosqueService } from "../services";

const KEY = "mosques";

export function useMosques(params = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => mosqueService.getAll(params),
  });
}

export function useMosquesDropdown() {
  return useQuery({
    queryKey: [KEY, "dropdown"],
    queryFn: () => mosqueService.getAllForDropdown(),
  });
}

export function useMosque(id) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => mosqueService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateMosque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => mosqueService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMosque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => mosqueService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteMosque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => mosqueService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
