import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "@/shared/lib/apiClient";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";

export function ProtectedRoute() {
  // Dua sumber reaktivitas:
  // 1. Subscribe token di auth store → re-check seketika saat login/logout,
  //    tanpa perlu navigasi (React bail-out kalau tidak subscribe apa pun).
  // 2. Subscribe location → re-check tiap navigasi client-side, menangkap
  //    kasus localStorage diubah di luar store (dihapus manual/expired).
  useLocation();
  const storeToken = useAuthStore((s) => s.token);

  // Keduanya harus ada: localStorage adalah yang dipakai apiClient,
  // store adalah mirror reaktifnya.
  if (!storeToken || !getToken()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
