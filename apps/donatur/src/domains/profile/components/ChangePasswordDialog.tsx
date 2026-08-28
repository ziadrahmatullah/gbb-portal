import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@gbb/ui";
import { useChangeMyPassword } from "../hooks/useProfile";

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
          <DialogDescription>Ubah password akun donatur Anda sendiri.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="cp-old">Password Lama *</Label>
            <Input
              id="cp-old"
              type="password"
              value={oldPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value)}
              required
              disabled={saving}
              autoComplete="current-password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cp-new">Password Baru * (min. 8 karakter)</Label>
            <Input
              id="cp-new"
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              required
              disabled={saving}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cp-confirm">Konfirmasi Password Baru *</Label>
            <Input
              id="cp-confirm"
              type="password"
              minLength={8}
              value={confirm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
              required
              disabled={saving}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
