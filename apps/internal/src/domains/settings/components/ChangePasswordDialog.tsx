import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useChangeMyPassword } from "../hooks/useSettings";

// Ganti password self-service — dipakai semua role login, dibuka dari dropdown
// user di topbar (bukan halaman Settings admin).
export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const mutation = useChangeMyPassword();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Konfirmasi hanya divalidasi di FE, tidak dikirim ke backend
    if (newPassword !== confirm) {
      setError("Konfirmasi password baru tidak cocok");
      return;
    }
    setError("");
    mutation.mutate({ oldPassword, newPassword }, { onSuccess: onClose });
  };

  const saving = mutation.isPending;

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ganti Password</DialogTitle>
          <DialogDescription>Ubah password akun Anda sendiri.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cp-old">Password lama</Label>
            <Input id="cp-old" type="password" value={oldPassword} onChange={(e: ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value)} required disabled={saving} autoComplete="current-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-new">Password baru (min 8 karakter)</Label>
            <Input id="cp-new" type="password" minLength={8} value={newPassword} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} required disabled={saving} autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-confirm">Konfirmasi password baru</Label>
            <Input id="cp-confirm" type="password" minLength={8} value={confirm} onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)} required disabled={saving} autoComplete="new-password" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-0 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
