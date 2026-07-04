import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qurbanService } from "../services";

const KEY = "qurbans";

export function useQurbans(params = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => qurbanService.getAll(params),
  });
}

export function useQurban(id) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => qurbanService.getById(id),
    enabled: Boolean(id),
  });
}

export function useQurbanSummary() {
  return useQuery({
    queryKey: [KEY, "summary"],
    queryFn: () => qurbanService.getSummary(),
  });
}

export function useCreateQurban() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => qurbanService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateQurban() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => qurbanService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteQurban() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => qurbanService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useBulkUploadQurban() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => qurbanService.bulkUpload(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
