import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/shared/lib/queryClient";
// Import direct by file (bukan lewat barrel @/shared/components) supaya
// Layout.jsx lama + seluruh import tree-nya tidak ikut ke bundle.
import { LoginPage } from "@/domains/auth/components/LoginPage";
import { ForgotPasswordPage } from "@/domains/auth/components/ForgotPasswordPage";
import { ResetPasswordPage } from "@/domains/auth/components/ResetPasswordPage";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { RequireRole } from "@/shared/components/RequireRole";
import { RequireMenu } from "@/shared/components/RequireMenu";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { DashboardPage } from "@/domains/dashboard";
import { PeriodePage } from "@/domains/periode";
import { BeswanListPage, BeswanDetailPage } from "@/domains/beswan";
import { KurikulumPage, TopikDetailPage } from "@/domains/kurikulum";
import { MentorListPage, MentorDetailPage } from "@/domains/mentor";
import { EventListPage, EventDetailPage } from "@/domains/event";
import { PenugasanPage, PenugasanDetailPage } from "@/domains/penugasan";
import { RefleksiPage, RefleksiDetailPage } from "@/domains/refleksi";
import { RekonsiliasiPage, OverviewPage } from "@/domains/keuangan";
import { DonaturListPage, MonitoringPage } from "@/domains/donatur";
import { LaporanPage } from "@/domains/laporan";
import { HighlightPage } from "@/domains/highlight";
import { SettingsPage } from "@/domains/settings";

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
              <Route element={<RequireMenu menu="dashboard" />}>
                <Route index element={<DashboardPage />} />
              </Route>
              <Route element={<RequireMenu menu="periode" />}>
                <Route path="periode" element={<PeriodePage />} />
              </Route>
              <Route element={<RequireMenu menu="beswan" />}>
                <Route path="beswan" element={<BeswanListPage />} />
                <Route path="beswan/:id" element={<BeswanDetailPage />} />
              </Route>
              <Route element={<RequireMenu menu="program_kurikulum" />}>
                <Route path="kurikulum" element={<KurikulumPage />} />
                <Route path="kurikulum/topik/:id" element={<TopikDetailPage />} />
              </Route>
              <Route element={<RequireMenu menu="program_mentor" />}>
                <Route path="mentor" element={<MentorListPage />} />
                <Route path="mentor/:id" element={<MentorDetailPage />} />
              </Route>
              <Route element={<RequireMenu menu="program_event" />}>
                <Route path="event" element={<EventListPage />} />
                <Route path="event/:id" element={<EventDetailPage />} />
              </Route>
              <Route element={<RequireMenu menu="program_penugasan" />}>
                <Route path="penugasan" element={<PenugasanPage />} />
                <Route path="penugasan/:id" element={<PenugasanDetailPage />} />
              </Route>
              <Route element={<RequireMenu menu="program_refleksi" />}>
                <Route path="refleksi" element={<RefleksiPage />} />
                <Route path="refleksi/:id" element={<RefleksiDetailPage />} />
              </Route>

              {/* Hak LIHAT menu dari matriks role×menu (Settings › Hak Akses Menu);
                  default = aturan lama. Hak EDIT tetap per role di tiap halaman. */}
              <Route path="keuangan">
                <Route element={<RequireMenu menu="keuangan_rekonsiliasi" />}>
                  <Route path="rekonsiliasi" element={<RekonsiliasiPage />} />
                </Route>
                <Route element={<RequireMenu menu="keuangan_overview" />}>
                  <Route path="overview" element={<OverviewPage />} />
                </Route>
                {/* Donatur pindah ke menu sendiri — path lama tetap hidup
                    sebagai redirect supaya bookmark/tautan lama tidak mati */}
                <Route path="donatur" element={<Navigate to="/panel/donatur/database" replace />} />
                <Route
                  path="monitoring"
                  element={<Navigate to="/panel/donatur/monitoring" replace />}
                />
              </Route>

              <Route path="donatur">
                <Route index element={<Navigate to="/panel/donatur/database" replace />} />
                <Route element={<RequireMenu menu="donatur_database" />}>
                  <Route path="database" element={<DonaturListPage />} />
                </Route>
                <Route element={<RequireMenu menu="donatur_monitoring" />}>
                  <Route path="monitoring" element={<MonitoringPage />} />
                </Route>
              </Route>

              <Route element={<RequireMenu menu="laporan" />}>
                <Route path="laporan" element={<LaporanPage />} />
              </Route>

              <Route element={<RequireMenu menu="highlight" />}>
                <Route path="highlight" element={<HighlightPage />} />
              </Route>

              <Route element={<RequireRole roles={["admin"]} />}>
                <Route path="settings" element={<SettingsPage />} />
              </Route>

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
