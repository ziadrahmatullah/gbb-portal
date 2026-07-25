import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, getToken, setToken, logout as apiLogout } from "@/shared/lib/apiClient";
import { queryClient } from "@/shared/lib/queryClient";

// Profil ringkas beswan yang login (dari GET /beswan/profile —
// login hanya mengembalikan token, tanpa objek beswan)
export interface BeswanProfile {
  id: number;
  nama_lengkap: string;
  nim: string;
  email: string;
  hp?: string;
}

interface AuthState {
  // Mirror reaktif dari localStorage beswan_auth_token — guard ikut re-render
  // saat login/logout tanpa perlu navigasi/reload.
  token: string | null;
  profile: BeswanProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  // Dipanggil setelah PUT /beswan/profile agar topbar/greeting ikut segar
  setProfile: (profile: BeswanProfile) => void;
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
          const res = await apiClient.post<{ token: string }>("/auth/beswan/login", {
            email,
            password,
          });
          if (!res.data?.token) {
            throw new Error(typeof res.error === "string" ? res.error : "Login gagal");
          }
          setToken(res.data.token);
          // Login hanya balikin token — ambil profil untuk topbar/greeting
          const prof = await apiClient.get<BeswanProfile>("/beswan/profile");
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
      name: "beswan-auth-storage",
      version: 1,
      migrate: () => ({ token: null, profile: null }),
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);
