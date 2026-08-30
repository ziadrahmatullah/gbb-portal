import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, getToken, setToken, logout as apiLogout } from "@/shared/lib/apiClient";
import { getErrorMessage } from "@/shared/lib/apiTypes";
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
  login: (email: string, password: string) => Promise<void>;
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

      login: async (email, password) => {
        set({ loading: true });
        try {
          const res = await apiClient.post<{ token: string }>("/auth/donatur/login", {
            email,
            password,
          });
          // Error HTTP dilempar interceptor; cabang ini hanya untuk 2xx tanpa token
          if (!res.data?.token) {
            throw new Error(getErrorMessage(res, "Login gagal"));
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

      // Login via Google: ID token dari GIS diverifikasi backend, balasannya
      // JWT internal yang sama dengan login email/password.
      loginWithGoogle: async (idToken) => {
        set({ loading: true });
        try {
          const res = await apiClient.post<{ token: string }>("/auth/donatur/google", {
            id_token: idToken,
          });
          if (!res.data?.token) {
            throw new Error(getErrorMessage(res, "Login Google gagal"));
          }
          setToken(res.data.token);
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
