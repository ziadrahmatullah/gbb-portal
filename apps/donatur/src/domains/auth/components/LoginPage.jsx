import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "../store/useAuthStore";

export function LoginPage() {
  const navigate = useNavigate();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [error, setError] = useState("");

  const handleSuccess = async (credentialResponse) => {
    setError("");
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate("/beranda", { replace: true });
    } catch (err) {
      setError(err.message || "Login gagal. Pastikan email Gmail kamu terdaftar sebagai donatur.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm text-center">
        <img src="/assets/logo/gbb-logo-stacked.png" alt="Baik Berdampak" className="h-24 w-auto mx-auto mb-4" />
        <p className="text-sm text-muted-foreground mb-8">Masuk ke Portal Donatur</p>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive text-left">{error}</div>}

          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleSuccess} onError={() => setError("Login Google gagal.")} />
          </div>

          <p className="text-xs text-muted-foreground">
            Gunakan email Gmail yang sama dengan saat mengisi form pendaftaran donatur.
          </p>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">GBB Donatur Portal v0.1</p>
      </div>
    </div>
  );
}
