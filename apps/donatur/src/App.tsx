import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sonner";
import { queryClient } from "@/shared/lib/queryClient";
import { LoginPage } from "@/domains/auth/components/LoginPage";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { BerandaPage } from "@/domains/beranda";
import { MentorPage } from "@/domains/mentor";
import { DashboardGBBPage } from "@/domains/dashboard";
import { DataBeswanPage } from "@/domains/beswan";
import { LaporanPage } from "@/domains/laporan";

// GOOGLE_CLIENT_ID masih kosong di config dev backend — shell login Google
// sudah lengkap, tinggal diuji begitu client ID tersedia (lihat LoginPage).
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <Toaster richColors position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/beranda" element={<BerandaPage />} />
                <Route path="/daftar-mentor" element={<MentorPage />} />
                <Route path="/dashboard" element={<DashboardGBBPage />} />
                <Route path="/data-beswan" element={<DataBeswanPage />} />
                <Route path="/laporan" element={<LaporanPage />} />
                <Route path="*" element={<Navigate to="/beranda" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
