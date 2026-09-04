import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button, Input, Label, LoginShowcase } from "@gbb/ui";
import { apiClient } from "@/shared/lib/apiClient";

// Portal ini: ganti tiga konstanta di bawah saat menyalin ke app lain.
const PORTAL = "beswan";
const PORTAL_LABEL = "Portal Beswan";
const LOGIN_PATH = "/";

// Tujuan tautan di email reset: /reset-password?token=… (passwordResetPath BE).
// POST /auth/{portal}/reset-password { token, new_password } — token sekali
// pakai, 1 jam; salah/kedaluwarsa/sudah dipakai → 400 dengan pesan yang sama.
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiClient.post(`/auth/${PORTAL}/reset-password`, {
        token,
        new_password: password,
      });
      setDone(res.message || "Password berhasil direset.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset password. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh gap-4 bg-background p-4">
      <div className="hidden w-1/2 lg:block">
        <LoginShowcase />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary p-3 shadow-lg">
              <img src="/assets/logo/gbb-logo-mark-white.png" alt="Baik Berdampak" className="size-full object-contain" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight">Buat Password Baru</h1>
              <p className="text-sm text-muted-foreground">{PORTAL_LABEL}</p>
            </div>
          </div>

          {!token ? (
            <div className="space-y-4 rounded-lg border bg-card p-5 text-center text-sm">
              <p>Tautan tidak lengkap — buka kembali tautan dari email reset password kamu.</p>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/forgot-password">Minta tautan baru</Link>
              </Button>
            </div>
          ) : done ? (
            <div className="space-y-4 rounded-lg border bg-card p-5 text-center">
              <CheckCircle2 className="mx-auto size-8 text-primary" />
              <p className="text-sm">{done}</p>
              <Button asChild variant="secondary" className="w-full">
                <Link to={LOGIN_PATH}>Masuk dengan password baru</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              {error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                  {/token|tautan|kedaluwarsa/i.test(error) && (
                    <>
                      {" "}
                      <Link to="/forgot-password" className="underline">
                        Minta tautan baru
                      </Link>
                    </>
                  )}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="rp-new">Password baru (min. 8 karakter)</Label>
                <div className="relative">
                  <Input
                    id="rp-new"
                    type={show ? "text" : "password"}
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rp-confirm">Konfirmasi password baru</Label>
                <Input
                  id="rp-confirm"
                  type={show ? "text" : "password"}
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                {loading ? "Menyimpan…" : "Simpan password baru"}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Hak Cipta © {new Date().getFullYear()} Baik Berdampak
          </p>
        </div>
      </div>
    </div>
  );
}
