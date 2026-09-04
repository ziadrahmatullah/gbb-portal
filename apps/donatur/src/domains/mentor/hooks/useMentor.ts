import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { daftarMentor, getMentorStats, getMyPendaftaran } from "../services";
import type { DaftarMentorInput } from "../services";

export const MENTOR_KEY = "mentor";

export function useMentorStats() {
  return useQuery({
    queryKey: [MENTOR_KEY, "stats"],
    queryFn: getMentorStats,
  });
}

export function useMyPendaftaran() {
  return useQuery({
    queryKey: [MENTOR_KEY, "pendaftaran"],
    queryFn: getMyPendaftaran,
  });
}

export function useDaftarMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DaftarMentorInput) => daftarMentor(input),
    onSuccess: (data) => {
      toast.success("Pendaftaran mentor terkirim — tim GBB akan meninjaunya");
      // Taruh objek balasan langsung ke cache supaya kartu status muncul seketika
      if (data) qc.setQueryData([MENTOR_KEY, "pendaftaran"], data);
      qc.invalidateQueries({ queryKey: [MENTOR_KEY] });
    },
  });
}
