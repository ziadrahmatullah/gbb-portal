import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, getToken, setToken, logout as apiLogout } from "@/shared/lib/apiClient";
import { queryClient } from "@/shared/lib/queryClient";
import type { Role } from "@/shared/constants/roles";

interface AuthState {
  // Mirror reaktif dari localStorage auth_token — supaya guard (ProtectedRoute)
  // ikut re-render saat login/logout tanpa perlu navigasi/reload.
  token: string | null;
  role: Role | null;
  email: string | null;
  nama: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface LoginData {
  token: string;
  role: Role;
  nama?: string;
}

// Token disimpan hanya di localStorage (setToken) — satu sumber kebenaran
// yang dibaca ProtectedRoute dan interceptor apiClient.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: getToken(),
      role: null,
      email: null,
      nama: null,
      loading: false,

      login: async (email, password) => {
        set({ loading: true });
        try {
          const res = await apiClient.post<LoginData>("/auth/internal/login", {
            email,
            password,
          });
          if (!res.data?.token) {
            throw new Error(typeof res.error === "string" ? res.error : "Login gagal");
          }
          setToken(res.data.token);
          set({
            token: res.data.token,
            role: res.data.role,
            email,
            nama: res.data.nama ?? null,
            loading: false,
          });
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      logout: () => {
        apiLogout();
        queryClient.clear(); // cegah data cache bocor antar user
        set({ token: null, role: null, email: null, nama: null });
      },
    }),
    {
      name: "auth-storage",
      version: 2,
      // v0: buang blob persist shape lama dari boilerplate ({token, isAuthenticated, user})
      // v1 → v2: tambah nama (terisi lagi saat login berikutnya)
      migrate: (persisted, version) => {
        const prev = version >= 1 ? (persisted as { role?: Role | null; email?: string | null }) : null;
        return { role: prev?.role ?? null, email: prev?.email ?? null, nama: null };
      },
      partialize: (state) => ({ role: state.role, email: state.email, nama: state.nama }),
    }
  )
);
