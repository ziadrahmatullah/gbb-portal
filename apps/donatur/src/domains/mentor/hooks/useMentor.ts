import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { daftarMentor, getMentorStats } from "../services";
import type { DaftarMentorInput } from "../services";

export const MENTOR_KEY = "mentor";

export function useMentorStats() {
  return useQuery({
    queryKey: [MENTOR_KEY, "stats"],
    queryFn: getMentorStats,
  });
}

export function useDaftarMentor() {
  return useMutation({
    mutationFn: (input: DaftarMentorInput) => daftarMentor(input),
    onSuccess: () => toast.success("Pendaftaran mentor berhasil — terima kasih!"),
  });
}
