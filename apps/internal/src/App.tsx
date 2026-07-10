import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/shared/lib/queryClient";
// Import direct by file (bukan lewat barrel @/shared/components) supaya
// Layout.jsx lama + seluruh import tree-nya tidak ikut ke bundle.
import { LoginPage } from "@/domains/auth/components/LoginPage";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { RequireRole } from "@/shared/components/RequireRole";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { DashboardPage } from "@/domains/dashboard";
import { PeriodePage } from "@/domains/periode";
import { BeswanListPage, BeswanDetailPage } from "@/domains/beswan";
import { KurikulumPage } from "@/domains/kurikulum";
import { MentorListPage } from "@/domains/mentor";
import { EventListPage, EventDetailPage } from "@/domains/event";
import { PenugasanPage } from "@/domains/penugasan";
import { RekonsiliasiPage, OverviewPage } from "@/domains/keuangan";
import { DonaturListPage, MonitoringPage } from "@/domains/donatur";
import { LaporanPage } from "@/domains/laporan";
import { SettingsPage } from "@/domains/settings";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          {/* Login at root */}
          <Route path="/" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/panel" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="periode" element={<PeriodePage />} />
              <Route path="beswan" element={<BeswanListPage />} />
              <Route path="beswan/:id" element={<BeswanDetailPage />} />
              <Route path="kurikulum" element={<KurikulumPage />} />
              <Route path="mentor" element={<MentorListPage />} />
              <Route path="event" element={<EventListPage />} />
              <Route path="event/:id" element={<EventDetailPage />} />
              <Route path="penugasan" element={<PenugasanPage />} />

              <Route path="keuangan">
                <Route element={<RequireRole roles={["admin", "finance", "anc"]} />}>
                  <Route path="rekonsiliasi" element={<RekonsiliasiPage />} />
                </Route>
                {/* Viewer boleh lihat Overview meski tak boleh Rekonsiliasi; pcm tidak keduanya */}
                <Route element={<RequireRole roles={["admin", "finance", "anc", "viewer"]} />}>
                  <Route path="overview" element={<OverviewPage />} />
                </Route>
                {/* Donatur: view admin+anc+finance+viewer, mutasi admin+anc; pcm tidak akses */}
                <Route element={<RequireRole roles={["admin", "anc", "finance", "viewer"]} />}>
                  <Route path="donatur" element={<DonaturListPage />} />
                  <Route path="monitoring" element={<MonitoringPage />} />
                </Route>
              </Route>

              <Route path="laporan" element={<LaporanPage />} />

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
