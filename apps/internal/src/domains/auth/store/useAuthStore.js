import { API_BASE_URL, setToken, logout as apiLogout } from "@/shared/lib/apiClient";
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      isAuthenticated: false,
      user: {},
      loading: false,

      // Login
      login: async (email, password) => {
        set({ loading: true });
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
          const { token, id, email: userEmail, fullname, phone, role } = response.data.data;

          // Store token in localStorage
          setToken(token);

          set({
            token,
            isAuthenticated: true,
            user: {
              id,
              email: userEmail,
              full_name: fullname,
              phone: phone || "",
              role,
            },
            loading: false,
          });

          return response.data;
        } catch (error) {
          set({ loading: false });
          const msg = error.response?.data?.message || error.message || "Login failed";
          throw new Error(msg);
        }
      },

      // Register
      register: async (fullname, email, phone, password) => {
        set({ loading: true });
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
            fullname,
            email,
            phone,
            password,
          });

          set({ loading: false });
          toast.success("Registration successful! Please login.");
          return response.data;
        } catch (error) {
          set({ loading: false });
          const msg = error.response?.data?.message || error.message || "Registration failed";
          throw new Error(msg);
        }
      },

      // Forgot Password
      forgotPassword: async (email) => {
        set({ loading: true });
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
          set({ loading: false });
          toast.success("Password reset code sent to your email");
          return response.data;
        } catch (error) {
          set({ loading: false });
          const msg = error.response?.data?.message || error.message || "Failed to send reset code";
          throw new Error(msg);
        }
      },

      // Apply Password (reset password with token)
      applyPassword: async (email, token, new_password) => {
        set({ loading: true });
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/apply-password`, {
            email,
            token,
            new_password,
          });
          set({ loading: false });
          toast.success("Password reset successful! Please login with your new password.");
          return response.data;
        } catch (error) {
          set({ loading: false });
          const msg = error.response?.data?.message || error.message || "Failed to reset password";
          throw new Error(msg);
        }
      },

      // Change Password (authenticated)
      changePassword: async (old_password, new_password) => {
        set({ loading: true });
        try {
          const { token } = get();
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/change-password`,
            { old_password, new_password },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          set({ loading: false });
          toast.success("Password changed successfully!");
          return response.data;
        } catch (error) {
          set({ loading: false });
          const msg = error.response?.data?.message || error.message || "Failed to change password";
          throw new Error(msg);
        }
      },

      // Logout
      logout: () => {
        apiLogout();
        set({ token: null, isAuthenticated: false, user: {} });
        toast.success("Logged out successfully");
      },

      // Update user data
      setUser: (user) => set({ user }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
