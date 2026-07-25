import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createLaporan, deleteLaporan, getLaporanList, updateLaporan } from "../services";
import type { UpdateLaporanReq } from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const LAPORAN_KEY = "laporan";

export function useLaporanList(params: ListParams = {}) {
  return useQuery({
    queryKey: [LAPORAN_KEY, "list", params],
    queryFn: () => getLaporanList(params),
  });
}

export function useCreateLaporan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => createLaporan(form),
    onSuccess: () => {
      toast.success("Laporan berhasil diupload");
      queryClient.invalidateQueries({ queryKey: [LAPORAN_KEY] });
    },
  });
}

export function useUpdateLaporan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateLaporanReq }) => updateLaporan(id, body),
    onSuccess: () => {
      toast.success("Laporan berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [LAPORAN_KEY] });
    },
  });
}

export function useDeleteLaporan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteLaporan(id),
    onSuccess: () => {
      toast.success("Laporan berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: [LAPORAN_KEY] });
    },
  });
}
