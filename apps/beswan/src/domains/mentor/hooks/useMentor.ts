import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMentorList, getMyMentorRequests, requestMentor } from "../services";
import type { ListParams } from "@/shared/lib/apiTypes";

export const MENTOR_KEY = "mentor";

export function useMentorList(params: ListParams = {}) {
  return useQuery({
    queryKey: [MENTOR_KEY, "list", params],
    queryFn: () => getMentorList(params),
  });
}

export function useMyMentorRequests() {
  return useQuery({
    queryKey: [MENTOR_KEY, "my-requests"],
    queryFn: () => getMyMentorRequests(),
  });
}

export function useRequestMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { mentor_id?: number; curhat_text?: string }) => requestMentor(body),
    onSuccess: () => {
      toast.success("Permintaan mentor terkirim — tim GBB akan menindaklanjuti!");
      // Request baru langsung tampil di section "Request Mentormu"
      queryClient.invalidateQueries({ queryKey: [MENTOR_KEY, "my-requests"] });
    },
  });
}
