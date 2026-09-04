import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/shared/lib/queryClient";
import { LoginPage } from "@/domains/auth/components/LoginPage";
import { ForgotPasswordPage } from "@/domains/auth/components/ForgotPasswordPage";
import { ResetPasswordPage } from "@/domains/auth/components/ResetPasswordPage";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { BerandaPage } from "@/domains/beranda";
import { EventPage, EventDetailPage } from "@/domains/event";
import { PenugasanPage, PenugasanDetailPage } from "@/domains/penugasan";
import { LibraryPage } from "@/domains/library";
import { MentorPage } from "@/domains/mentor";
import { RefleksiPage } from "@/domains/refleksi";
import { ProfilePage } from "@/domains/profile";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          {/* Login at root */}
          <Route path="/" element={<LoginPage />} />
          {/* Lupa password (FEpromt25 §8): tautan email BE menuju /reset-password?token=… */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/panel" element={<AppLayout />}>
              <Route index element={<BerandaPage />} />
              <Route path="event" element={<EventPage />} />
              <Route path="event/:id" element={<EventDetailPage />} />
              <Route path="penugasan" element={<PenugasanPage />} />
              <Route path="penugasan/:id" element={<PenugasanDetailPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="mentor" element={<MentorPage />} />
              <Route path="refleksi" element={<RefleksiPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/panel" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
