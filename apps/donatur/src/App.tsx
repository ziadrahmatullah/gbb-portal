import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/shared/lib/queryClient";
import { LoginPage } from "@/domains/auth/components/LoginPage";
import { ForgotPasswordPage } from "@/domains/auth/components/ForgotPasswordPage";
import { ResetPasswordPage } from "@/domains/auth/components/ResetPasswordPage";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { RequireAktif } from "@/shared/components/RequireAktif";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { BerandaPage } from "@/domains/beranda";
import { MentorPage } from "@/domains/mentor";
import { DashboardGBBPage } from "@/domains/dashboard";
import { BeswanDetailPage, DataBeswanPage } from "@/domains/beswan";
import { LaporanPage } from "@/domains/laporan";
import { ProfilePage } from "@/domains/profile";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          {/* Lupa password (FEpromt25 §8): tautan email BE menuju /reset-password?token=… */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/beranda" element={<BerandaPage />} />
              <Route path="/dashboard" element={<DashboardGBBPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              {/* Hanya untuk donatur aktif bulan ini (flag VITE_GATING_ENABLED).
                  /data-beswan/:id ikut dijaga — tanpa itu donatur terkunci bisa
                  deep-link langsung ke detail beswan. */}
              <Route element={<RequireAktif />}>
                <Route path="/daftar-mentor" element={<MentorPage />} />
                <Route path="/data-beswan" element={<DataBeswanPage />} />
                <Route path="/data-beswan/:id" element={<BeswanDetailPage />} />
                <Route path="/laporan" element={<LaporanPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/beranda" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
