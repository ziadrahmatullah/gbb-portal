import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifikasi,
  getUnreadCount,
  markAllNotifikasiRead,
  markNotifikasiRead,
} from "../services";

export const NOTIFIKASI_KEY = "notifikasi";

// Titik merah lonceng. Poll 60 dtk — satu-satunya sumber kesegaran
// (tidak ada push/websocket).
export function useUnreadCount() {
  return useQuery({
    queryKey: [NOTIFIKASI_KEY, "unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
  });
}

// enabled = popover terbuka — daftar tidak perlu di-fetch saat tertutup.
// Tanpa filter is_read: yang sudah dibaca tetap tampil (digaya redup).
// Urutan sudah created_at DESC dari server.
export function useNotifikasiList(enabled: boolean) {
  return useQuery({
    queryKey: [NOTIFIKASI_KEY, "list"],
    queryFn: async () => {
      const paged = await getNotifikasi();
      return paged.items;
    },
    enabled,
  });
}

export function useMarkNotifikasiRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markNotifikasiRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFIKASI_KEY] });
    },
  });
}

export function useMarkAllNotifikasiRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotifikasiRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFIKASI_KEY] });
    },
  });
}
