import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getBeswanEventDetail, getBeswanEventList, joinEvent, leaveEvent } from "../services";
import type { BeswanEventListParams } from "../services";

export const EVENT_KEY = "event";

export function useBeswanEventList(params: BeswanEventListParams = {}) {
  return useQuery({
    queryKey: [EVENT_KEY, "list", params],
    queryFn: () => getBeswanEventList(params),
  });
}

export function useBeswanEventDetail(id: number) {
  return useQuery({
    queryKey: [EVENT_KEY, "detail", id],
    queryFn: () => getBeswanEventDetail(id),
    enabled: Number.isFinite(id),
  });
}

// Error 400 (mis. race kuota penuh) sudah di-toast interceptor apa adanya
export function useJoinEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => joinEvent(id),
    onSuccess: (message) => {
      toast.success(message || "Berhasil join event");
      queryClient.invalidateQueries({ queryKey: [EVENT_KEY] });
    },
  });
}

export function useLeaveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => leaveEvent(id),
    onSuccess: (message) => {
      toast.success(message || "Pendaftaran dibatalkan");
      queryClient.invalidateQueries({ queryKey: [EVENT_KEY] });
    },
  });
}
