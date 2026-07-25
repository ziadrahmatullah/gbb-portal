import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "../services";

export const PROFILE_KEY = "profile";

export function useMyProfile() {
  return useQuery({
    queryKey: [PROFILE_KEY, "me"],
    queryFn: getMyProfile,
    staleTime: 5 * 60 * 1000, // identitas donatur jarang berubah dalam satu sesi
  });
}
