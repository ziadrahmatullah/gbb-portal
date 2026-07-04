import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventService } from "../services";

const KEY = "events";

export function useEvents(params = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => eventService.getAll(params),
  });
}

export function useEvent(id) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => eventService.getById(id),
    enabled: Boolean(id),
  });
}

export function useEventsDropdown() {
  return useQuery({
    queryKey: [KEY, "dropdown"],
    queryFn: () => eventService.getAllForDropdown(),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => eventService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => eventService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => eventService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
