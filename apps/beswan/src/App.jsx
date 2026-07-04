import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Layout } from "@/shared/components/layout/Layout";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { LoginPage } from "@/domains/auth/components/LoginPage";
import { BerandaPage } from "@/domains/beranda/components/BerandaPage";
import { LibraryPage } from "@/domains/library/components/LibraryPage";
import { MentorPage } from "@/domains/mentor/components/MentorPage";
import { RefleksiPage } from "@/domains/refleksi/components/RefleksiPage";
import { ProfilePage } from "@/domains/profile/components/ProfilePage";

function App() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/beranda" element={<BerandaPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/mentor" element={<MentorPage />} />
              <Route path="/refleksi" element={<RefleksiPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
