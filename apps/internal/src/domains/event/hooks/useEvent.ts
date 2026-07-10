import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createEvent,
  deleteEvent,
  getEventDetail,
  getEventList,
  getEventStats,
  saveAbsensi,
  updateEvent,
} from "../services";
import type { CreateEventReq, UpdateEventReq } from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const EVENT_KEY = "event";

export function useEventList(params: ListParams = {}) {
  return useQuery({
    queryKey: [EVENT_KEY, "list", params],
    queryFn: () => getEventList(params),
  });
}

export function useEventStats(periodeId?: string) {
  return useQuery({
    queryKey: [EVENT_KEY, "stats", periodeId ?? "all"],
    queryFn: () => getEventStats(periodeId),
  });
}

export function useEventDetail(id: number) {
  return useQuery({
    queryKey: [EVENT_KEY, "detail", id],
    queryFn: () => getEventDetail(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEventReq) => createEvent(body),
    onSuccess: () => {
      toast.success("Event berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: [EVENT_KEY] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateEventReq }) => updateEvent(id, body),
    onSuccess: () => {
      toast.success("Event berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [EVENT_KEY] });
      // Entri library tipe event_materi bisa ikut berubah saat youtube/slide diisi
      queryClient.invalidateQueries({ queryKey: ["kurikulum", "library"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEvent(id),
    onSuccess: () => {
      toast.success("Event berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: [EVENT_KEY] });
    },
  });
}

export function useSaveAbsensi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, absensi }: { eventId: number; absensi: { beswan_id: number; hadir: boolean }[] }) =>
      saveAbsensi(eventId, absensi),
    onSuccess: () => {
      toast.success("Absensi berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: [EVENT_KEY] });
    },
  });
}
