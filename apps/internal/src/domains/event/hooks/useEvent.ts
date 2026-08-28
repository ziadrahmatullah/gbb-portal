import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createEvent,
  deleteEvent,
  getAbsensi,
  getEventDetail,
  getEventList,
  getEventStats,
  saveAbsensi,
  updateEvent,
  updateEventStatus,
} from "../services";
import type { CreateEventReq, EventListParams, EventStatus, UpdateEventReq } from "../services";

export const EVENT_KEY = "event";

export function useEventList(params: EventListParams = {}) {
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
      // Event baru selalu berstatus draft di backend
      toast.success("Event tersimpan sebagai Draft", {
        description: "Belum terlihat di portal beswan sampai status diubah ke Published.",
      });
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
      // Pindah periode melepas tautan topik event → media/status topik ikut berubah
      queryClient.invalidateQueries({ queryKey: ["kurikulum", "topik"] });
    },
  });
}

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: EventStatus }) =>
      updateEventStatus(id, status),
    onSuccess: () => {
      toast.success("Status event diubah");
      // Prefix [EVENT_KEY] mencakup list + detail + stats sekaligus
      queryClient.invalidateQueries({ queryKey: [EVENT_KEY] });
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

// Status hadir tersimpan — dipakai prefill checkbox tab Absensi
export function useEventAbsensi(eventId: number) {
  return useQuery({
    queryKey: [EVENT_KEY, "absensi", eventId],
    queryFn: () => getAbsensi(eventId),
    enabled: Number.isFinite(eventId),
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
