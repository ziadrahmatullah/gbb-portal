import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "@/shared/lib/apiClient";

export function ProtectedRoute() {
  const token = getToken();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
