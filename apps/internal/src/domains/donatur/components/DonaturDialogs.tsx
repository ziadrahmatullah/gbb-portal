import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Check, Link2, Search, Unlink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePeriodeOptions } from "@/domains/periode/hooks/usePeriode";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  useAddTag,
  useAssignPeriode,
  useLinkUser,
  usePendingLogins,
  useRemoveTag,
  useUnlinkUser,
  useUpdateDonatur,
} from "../hooks/useDonatur";
import { DONATUR_TAGS, SKEMA_OPTIONS, skemaLabel } from "../services";
import type { Donatur } from "../services";

// ─── Edit: catatan + is_checked + matriks keikutsertaan periode ──────────

export function EditDonaturDialog({ donatur, onClose }: { donatur: Donatur; onClose: () => void }) {
  const { data: periodeData } = usePeriodeOptions();
  const updateMutation = useUpdateDonatur();
  const assignMutation = useAssignPeriode();
  const [catatan, setCatatan] = useState("");
  const [isChecked, setIsChecked] = useState(donatur.is_checked);
  // Status keikutsertaan disimpan lokal (seed dari prop) supaya switch langsung
  // mencerminkan perubahan — prop `donatur` cuma snapshot saat dialog dibuka.
  const [periodeStatus, setPeriodeStatus] = useState<Record<number, string>>(() =>
    Object.fromEntries((donatur.periodes ?? []).map((p) => [p.periode_id, p.status]))
  );

  const periodes = periodeData?.items ?? [];
  const infoByPeriode = new Map((donatur.periodes ?? []).map((p) => [p.periode_id, p]));

  const togglePeriode = (periodeId: number, aktif: boolean) => {
    const status = aktif ? "aktif" : "tidak_aktif";
    setPeriodeStatus((prev) => ({ ...prev, [periodeId]: status })); // optimistic
    const existing = infoByPeriode.get(periodeId);
    assignMutation.mutate({
      id: donatur.id,
      body: {
        periode_id: periodeId,
        status,
        nominal: existing?.nominal ?? donatur.nominal_default ?? undefined,
        skema: existing?.skema ?? donatur.skema,
      },
    });
  };

  const handleSaveProfile = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateMutation.mutate(
      { id: donatur.id, body: { catatan: catatan || undefined, is_checked: isChecked } },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Donatur — {donatur.nama}</DialogTitle>
          <DialogDescription>
            Profil (nama/email/HP/skema) di-mirror dari Google Sheets &amp; read-only. Yang bisa
            diubah: catatan internal, status verifikasi, dan keikutsertaan per periode.
          </DialogDescription>
        </DialogHeader>

        {/* Profil read-only */}
        <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-0.5">
          <div><span className="text-muted-foreground">Kode:</span> {donatur.kode || "—"}</div>
          <div><span className="text-muted-foreground">Email:</span> {donatur.email}</div>
          <div><span className="text-muted-foreground">HP:</span> {donatur.hp || "—"}</div>
          <div><span className="text-muted-foreground">Skema:</span> {skemaLabel(donatur.skema)}</div>
        </div>

        {/* Matriks keikutsertaan periode */}
        <div className="space-y-2">
          <Label>Keikutsertaan per periode</Label>
          <div className="rounded-lg border divide-y">
            {periodes.map((p) => {
              const info = infoByPeriode.get(p.id);
              const aktif = periodeStatus[p.id] === "aktif";
              return (
                <div key={p.id} className="flex items-center justify-between px-3 py-2">
                  <div className="text-sm">
                    <div className="font-medium">{p.nama}</div>
                    {info && (
                      <div className="text-xs text-muted-foreground">
                        {info.skema ? skemaLabel(info.skema) : "—"}
                        {info.nominal ? ` · Rp ${new Intl.NumberFormat("id-ID").format(info.nominal)}` : ""}
                      </div>
                    )}
                  </div>
                  <Switch
                    checked={aktif}
                    onCheckedChange={(v: boolean) => togglePeriode(p.id, v)}
                    disabled={assignMutation.isPending}
                  />
                </div>
              );
            })}
            {periodes.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">Belum ada periode</div>
            )}
          </div>
        </div>

        {/* Catatan + is_checked */}
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="d-catatan">Catatan internal</Label>
            <Textarea
              id="d-catatan"
              rows={2}
              value={catatan}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCatatan(e.target.value)}
              placeholder="Catatan tambahan… (kosong = tidak diubah)"
              disabled={updateMutation.isPending}
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Switch
              checked={isChecked}
              onCheckedChange={setIsChecked}
              disabled={updateMutation.isPending}
            />
            Sudah diverifikasi (is_checked)
          </label>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
              Tutup
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Menyimpan…" : "Simpan Catatan & Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tag manager ─────────────────────────────────────────────────────────

export function TagDialog({ donatur, onClose }: { donatur: Donatur; onClose: () => void }) {
  const addMutation = useAddTag();
  const removeMutation = useRemoveTag();
  // Set tag lokal (seed dari prop) — supaya toggle langsung tercermin & tidak
  // dobel-add saat diklik cepat (prop `donatur` hanya snapshot saat buka).
  const [current, setCurrent] = useState<Set<string>>(() => new Set(donatur.tags ?? []));

  const toggle = (tag: string) => {
    if (current.has(tag)) {
      setCurrent((prev) => {
        const next = new Set(prev);
        next.delete(tag);
        return next;
      });
      removeMutation.mutate({ id: donatur.id, tag });
    } else {
      setCurrent((prev) => new Set(prev).add(tag));
      addMutation.mutate({ id: donatur.id, tag });
    }
  };

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tag — {donatur.nama}</DialogTitle>
          <DialogDescription>Klik untuk menambah/menghapus tag donatur.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {DONATUR_TAGS.map((t) => {
            const active = current.has(t.value);
            const pending = addMutation.isPending || removeMutation.isPending;
            return (
              <button
                key={t.value}
                disabled={pending}
                onClick={() => toggle(t.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                <span>{t.icon}</span>
                {t.label}
                {active && <Check className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Link akun (dari pending-logins) ─────────────────────────────────────

export function LinkAkunDialog({ donatur, onClose }: { donatur: Donatur; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const { data: pending, isLoading } = usePendingLogins(search, true);
  const linkMutation = useLinkUser();
  const unlinkMutation = useUnlinkUser();

  if (donatur.linked_email) {
    return (
      <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Akun ter-link — {donatur.nama}</DialogTitle>
            <DialogDescription>Donatur ini bisa login dengan email Google di bawah.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border bg-primary/5 px-3 py-2 text-sm">
            <Check className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium">{donatur.linked_email}</span>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
            <Button
              variant="destructive"
              disabled={unlinkMutation.isPending}
              onClick={() => unlinkMutation.mutate(donatur.id, { onSuccess: onClose })}
            >
              <Unlink className="h-4 w-4 mr-2" />
              {unlinkMutation.isPending ? "Meng-unlink…" : "Unlink Akun"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const items = pending ?? [];

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link Akun — {donatur.nama}</DialogTitle>
          <DialogDescription>
            Pilih percobaan login Google (email berbeda dari data donatur) untuk di-link ke
            donatur ini.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Cari nama/email…"
            className="pl-9"
          />
        </div>
        <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Memuat…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Belum ada percobaan login yang menunggu di-link.
              <div className="mt-1 text-xs">
                (Muncul saat ada login Google dengan email di luar data donatur.)
              </div>
            </div>
          ) : (
            items.map((p) => (
              <div key={p.email} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.nama || "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.email} · {p.attempt_count}× percobaan
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={linkMutation.isPending}
                  onClick={() =>
                    linkMutation.mutate({ id: donatur.id, email: p.email }, { onSuccess: onClose })
                  }
                >
                  <Link2 className="h-3.5 w-3.5 mr-1.5" />
                  Link
                </Button>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Batal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tambah donatur manual ───────────────────────────────────────────────

export function CreateDonaturDialog({
  onClose,
  onSubmit,
  saving,
}: {
  onClose: () => void;
  onSubmit: (body: { nama: string; email: string; hp?: string; organisasi?: string; nominal_default?: number; skema: string }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({ nama: "", email: "", hp: "", organisasi: "", nominal_default: "" });
  const [skema, setSkema] = useState("belum_bersedia");

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      nama: form.nama,
      email: form.email,
      hp: form.hp || undefined,
      organisasi: form.organisasi || undefined,
      nominal_default: form.nominal_default ? Number(form.nominal_default) : undefined,
      skema,
    });
  };

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Donatur</DialogTitle>
          <DialogDescription>Entry manual untuk donatur yang belum ada di sistem.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nd-nama">Nama</Label>
            <Input id="nd-nama" value={form.nama} onChange={set("nama")} required disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nd-email">Email</Label>
            <Input id="nd-email" type="email" value={form.email} onChange={set("email")} required disabled={saving} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nd-hp">HP</Label>
              <Input id="nd-hp" value={form.hp} onChange={set("hp")} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nd-org">Organisasi</Label>
              <Input id="nd-org" value={form.organisasi} onChange={set("organisasi")} disabled={saving} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nd-nominal">Nominal default</Label>
              <Input id="nd-nominal" type="number" min={0} value={form.nominal_default} onChange={set("nominal_default")} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label>Skema</Label>
              <Select value={skema} onValueChange={setSkema} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKEMA_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
