import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { changeMyPassword, getMyProfile } from "../services";

export const PROFILE_KEY = "profile";

export function useMyProfile() {
  return useQuery({
    queryKey: [PROFILE_KEY, "me"],
    queryFn: getMyProfile,
    staleTime: 5 * 60 * 1000, // identitas donatur jarang berubah dalam satu sesi
  });
}

export function useChangeMyPassword() {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      changeMyPassword(oldPassword, newPassword),
    onSuccess: () => toast.success("Password berhasil diubah"),
  });
}
