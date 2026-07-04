import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { animalTypeService } from "../services";

const KEY = "animal-types";

export function useAnimalTypes(params = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => animalTypeService.getAll(params),
  });
}

export function useAnimalTypesDropdown() {
  return useQuery({
    queryKey: [KEY, "dropdown"],
    queryFn: async () => {
      const res = await animalTypeService.getAll({ limit: 100 });
      return res.items ?? [];
    },
  });
}

export function useAnimalType(id) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => animalTypeService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateAnimalType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => animalTypeService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAnimalType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => animalTypeService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteAnimalType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => animalTypeService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
