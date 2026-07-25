import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMyIPK, getMyProfile, updateMyProfile, upsertMyIPK } from "../services";
import { BERANDA_KEY } from "@/domains/beranda/hooks/useBeranda";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";

export const PROFILE_KEY = "profile";

export function useMyProfile() {
  return useQuery({
    queryKey: [PROFILE_KEY, "me"],
    queryFn: getMyProfile,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (profile) => {
      qc.invalidateQueries({ queryKey: [PROFILE_KEY] });
      // Foto/nama di topbar berasal dari dashboard + auth store — sinkronkan
      qc.invalidateQueries({ queryKey: [BERANDA_KEY, "dashboard"] });
      if (profile) useAuthStore.getState().setProfile(profile);
      toast.success("Profil berhasil diperbarui");
    },
  });
}

export function useMyIPK() {
  return useQuery({
    queryKey: [PROFILE_KEY, "ipk"],
    queryFn: getMyIPK,
  });
}

export function useUpsertIPK() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertMyIPK,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PROFILE_KEY, "ipk"] });
      qc.invalidateQueries({ queryKey: [BERANDA_KEY, "dashboard"] }); // chart IPK beranda
      toast.success("Data akademik tersimpan");
    },
  });
}
