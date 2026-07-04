import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { districtService } from "../services";

const KEY = "districts";

export function useDistricts(params = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => districtService.getAll(params),
  });
}

export function useDistrictsDropdown() {
  return useQuery({
    queryKey: [KEY, "dropdown"],
    queryFn: () => districtService.getAll({ limit: 100 }),
  });
}

export function useDistrict(id) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => districtService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateDistrict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => districtService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDistrict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => districtService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteDistrict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => districtService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
