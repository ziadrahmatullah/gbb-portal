import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Button, Input, Label, LoginShowcase } from "@gbb/ui";
import { Loader2, Eye, EyeOff } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/panel", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal. Silakan coba lagi.");
    }
  };

  return (
    <div className="flex min-h-svh gap-4 bg-background p-4">
      {/* Panel kiri: showcase program GBB (desktop saja) */}
      <div className="hidden w-1/2 lg:block">
        <LoginShowcase />
      </div>

      {/* Panel kanan: form login */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-8">
          {/* Brand */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary p-3 shadow-lg">
              <img
                src="/assets/logo/gbb-logo-mark-white.png"
                alt="Baik Berdampak"
                className="size-full object-contain"
              />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight">Selamat Datang Kembali di GBB!</h1>
              <p className="text-sm text-muted-foreground">
                Masuk ke Portal Internal untuk mengelola program beasiswa Baik Berdampak.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-1">
              <Link
                to="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Lupa password?
              </Link>
            </div>

            <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin mr-2" />}
              {loading ? "Memproses…" : "Masuk"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Hak Cipta © {new Date().getFullYear()} Baik Berdampak
          </p>
        </div>
      </div>
    </div>
  );
}
