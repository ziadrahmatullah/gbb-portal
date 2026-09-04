import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button, Input, Label, LoginShowcase } from "@gbb/ui";
import { apiClient } from "@/shared/lib/apiClient";

// Portal ini: ganti tiga konstanta di bawah saat menyalin ke app lain.
const PORTAL = "donatur";
const PORTAL_LABEL = "Portal Donatur";
const LOGIN_PATH = "/";

// POST /auth/{portal}/forgot-password — SELALU 200 dengan pesan generik, email
// terdaftar atau tidak (FEpromt25 §8). Email dikirim BE di background.
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiClient.post(`/auth/${PORTAL}/forgot-password`, { email });
      setSent(res.message || "Jika email terdaftar, tautan reset password sudah dikirim.");
    } catch (err) {
      // /auth/* tidak di-toast interceptor → tampil inline (400 format email, 429 rate limit)
      setError(err instanceof Error ? err.message : "Gagal mengirim permintaan. Coba lagi.");
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
              <h1 className="text-2xl font-bold tracking-tight">Lupa Password</h1>
              <p className="text-sm text-muted-foreground">
                Masukkan email akun {PORTAL_LABEL}. Kami kirim tautan untuk membuat password baru
                (berlaku 1 jam).
              </p>
            </div>
          </div>

          {sent ? (
            <div className="space-y-4 rounded-lg border bg-card p-5 text-center">
              <MailCheck className="mx-auto size-8 text-primary" />
              <p className="text-sm">{sent}</p>
              <p className="text-xs text-muted-foreground">
                Tidak ada email? Periksa folder spam, atau pastikan alamat yang dipakai memang
                terdaftar. Tautan lama otomatis batal kalau kamu meminta yang baru.
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link to={LOGIN_PATH}>
                  <ArrowLeft className="size-4" />
                  Kembali ke login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              {error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="fp-email">Email</Label>
                <Input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                {loading ? "Mengirim…" : "Kirim tautan reset"}
              </Button>
              <Link to={LOGIN_PATH} className="text-center text-sm text-muted-foreground hover:text-foreground">
                Kembali ke login
              </Link>
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
