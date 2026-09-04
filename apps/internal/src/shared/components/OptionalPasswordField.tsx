import type { ChangeEvent } from "react";
import { MailCheck } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";

// Field password untuk form "tambah akun" oleh admin (user internal, beswan,
// donatur manual). Sejak FEpromt26: password OPSIONAL — kalau kosong, BE
// mengirim email selamat datang berisi tautan buat-password (7 hari), jadi
// admin tidak perlu lagi menyampaikan password lewat WA. Toggle default MATI.
export function OptionalPasswordField({
  id,
  manual,
  onManualChange,
  value,
  onChange,
  disabled,
  subjek = "pengguna",
}: {
  id: string;
  manual: boolean;
  onManualChange: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  // "beswan" | "donatur" | "user" — untuk kalimat bantuan
  subjek?: string;
}) {
  return (
    <div className="grid gap-2 rounded-lg border bg-muted/30 p-3">
      <label className="flex items-center justify-between gap-2 text-sm cursor-pointer">
        <span className="font-medium">Set password manual (opsional)</span>
        <Switch checked={manual} onCheckedChange={onManualChange} disabled={disabled} />
      </label>
      {manual ? (
        <div className="grid gap-2">
          <Label htmlFor={id}>Password awal (min 8 karakter)</Label>
          <Input
            id={id}
            type="password"
            minLength={8}
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            required
            disabled={disabled}
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">
            Email selamat datang tetap dikirim; tautan buat-password di dalamnya jadi jalan
            alternatif.
          </p>
        </div>
      ) : (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MailCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            {subjek.charAt(0).toUpperCase() + subjek.slice(1)} akan menerima email berisi tautan
            untuk membuat password sendiri (berlaku 7 hari). Pastikan alamat emailnya benar —
            email dikirim sungguhan.
          </span>
        </p>
      )}
    </div>
  );
}
