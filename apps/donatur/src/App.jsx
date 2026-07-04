import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sonner";
import { Layout } from "@/shared/components/layout/Layout";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { LoginPage } from "@/domains/auth/components/LoginPage";
import { BerandaPage } from "@/domains/beranda/components/BerandaPage";
import { DaftarMentorPage } from "@/domains/mentor/components/DaftarMentorPage";
import { DashboardPage } from "@/domains/dashboard/components/DashboardPage";
import { DataBeswanPage } from "@/domains/beswan/components/DataBeswanPage";
import { LaporanPage } from "@/domains/laporan/components/LaporanPage";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/beranda" element={<BerandaPage />} />
              <Route path="/daftar-mentor" element={<DaftarMentorPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/data-beswan" element={<DataBeswanPage />} />
              <Route path="/laporan" element={<LaporanPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
