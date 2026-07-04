import { API_BASE_URL, setToken, logout as apiLogout } from "@/shared/lib/apiClient";
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      user: {},
      loading: false,

      // credential = Google ID token (JWT) from @react-oauth/google's GoogleLogin onSuccess
      loginWithGoogle: async (credential) => {
        set({ loading: true });
        try {
          const response = await axios.post(`${API_BASE_URL}/api/donatur/auth/google`, { credential });
          const { token, id, email, nama, kode } = response.data.data;

          setToken(token);

          set({
            token,
            isAuthenticated: true,
            user: { id, email, nama, kode },
            loading: false,
          });

          return response.data;
        } catch (error) {
          set({ loading: false });
          const msg = error.response?.data?.message || error.message || "Login gagal";
          throw new Error(msg);
        }
      },

      logout: () => {
        apiLogout();
        set({ token: null, isAuthenticated: false, user: {} });
      },
    }),
    { name: "donatur-auth-storage" }
  )
);
