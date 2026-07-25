import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "@/shared/lib/apiClient";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";

export function ProtectedRoute() {
  // Dua sumber reaktivitas (pelajaran dari Portal Internal):
  // 1. Subscribe token store → re-check seketika saat login/logout.
  // 2. Subscribe location → re-check tiap navigasi (localStorage diubah manual).
  useLocation();
  const storeToken = useAuthStore((s) => s.token);

  if (!storeToken || !getToken()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
