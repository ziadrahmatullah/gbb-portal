import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, getToken, setToken, logout as apiLogout } from "@/shared/lib/apiClient";
import { queryClient } from "@/shared/lib/queryClient";

// Profil ringkas donatur yang login (dari GET /donatur/profile —
// login hanya mengembalikan token, tanpa objek donatur)
export interface DonaturProfile {
  nama: string;
  email: string;
  kode_donatur: string;
  batch: string[];
}

interface AuthState {
  token: string | null;
  profile: DonaturProfile | null;
  loading: boolean;
  // idToken = Google ID token dari @react-oauth/google GoogleLogin onSuccess
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  setProfile: (profile: DonaturProfile) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: getToken(),
      profile: null,
      loading: false,

      loginWithGoogle: async (idToken) => {
        set({ loading: true });
        try {
          const res = await apiClient.post<{ token: string }>("/auth/donatur/login", {
            id_token: idToken,
          });
          if (!res.data?.token) {
            throw new Error(typeof res.error === "string" ? res.error : "Login gagal");
          }
          setToken(res.data.token);
          // Login hanya balikin token — ambil profil untuk sidebar/greeting
          const prof = await apiClient.get<DonaturProfile>("/donatur/profile");
          set({ token: res.data.token, profile: prof.data ?? null, loading: false });
        } catch (err) {
          setToken(null);
          set({ loading: false });
          throw err;
        }
      },

      logout: () => {
        apiLogout();
        queryClient.clear();
        set({ token: null, profile: null });
      },

      setProfile: (profile) => set({ profile }),
    }),
    {
      name: "donatur-auth-storage",
      version: 1,
      migrate: () => ({ token: null, profile: null }),
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);
