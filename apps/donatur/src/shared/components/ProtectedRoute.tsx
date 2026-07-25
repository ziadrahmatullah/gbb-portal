import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "@/shared/lib/apiClient";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";

export function ProtectedRoute() {
  useLocation();
  const storeToken = useAuthStore((s) => s.token);

  if (!storeToken || !getToken()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
