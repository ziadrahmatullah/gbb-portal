import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Check, Link2, Search, Trash2, Unlink, X } from "lucide-react";
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
  useRemovePeriode,
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
  const removePeriodeMutation = useRemovePeriode();
  const [removingPeriodeId, setRemovingPeriodeId] = useState<number | null>(null);
  // Baris yang barusan dihapus disembunyikan optimistic — prop `donatur` cuma
  // snapshot saat dialog dibuka, invalidate query tidak me-refresh prop ini.
  const [removedPeriodeIds, setRemovedPeriodeIds] = useState<Set<number>>(new Set());
  const [catatan, setCatatan] = useState("");
  const [isChecked, setIsChecked] = useState(donatur.is_checked);
  // Profil kini bisa dikoreksi manual (UpdateDonaturReq backend menerima field profil)
  const [profil, setProfil] = useState({
    nama: donatur.nama,
    email: donatur.email,
    hp: donatur.hp ?? "",
    organisasi: donatur.organisasi ?? "",
    nominal_default: donatur.nominal_default != null ? String(donatur.nominal_default) : "",
  });
  const [skema, setSkema] = useState(donatur.skema);

  const setP = (k: keyof typeof profil) => (e: ChangeEvent<HTMLInputElement>) =>
    setProfil((prev) => ({ ...prev, [k]: e.target.value }));
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
    // Toggle setelah dihapus = assign ulang (upsert) → baris kembali ada, tombol
    // Hapus boleh muncul lagi.
    setRemovedPeriodeIds((prev) => {
      if (!prev.has(periodeId)) return prev;
      const next = new Set(prev);
      next.delete(periodeId);
      return next;
    });
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
      {
        id: donatur.id,
        body: {
          catatan: catatan || undefined,
          is_checked: isChecked,
          // String kosong = tidak diubah backend, aman dikirim apa adanya
          nama: profil.nama,
          email: profil.email,
          hp: profil.hp,
          organisasi: profil.organisasi,
          skema,
          nominal_default: profil.nominal_default ? Number(profil.nominal_default) : undefined,
        },
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Donatur — {donatur.nama}</DialogTitle>
          <DialogDescription>
            Ubah profil, catatan internal, status verifikasi, dan keikutsertaan per periode.
            Kode: {donatur.kode || "—"}
          </DialogDescription>
        </DialogHeader>

        {/* Matriks keikutsertaan periode */}
        <div className="space-y-2">
          <Label>Keikutsertaan per periode</Label>
          <div className="rounded-lg border divide-y">
            {periodes.map((p) => {
              const info = infoByPeriode.get(p.id);
              const aktif = periodeStatus[p.id] === "aktif";
              const hasAssignment = !!info && !removedPeriodeIds.has(p.id);
              return (
                <div key={p.id} className="flex items-center justify-between px-3 py-2">
                  <div className="text-sm">
                    <div className="font-medium">{p.nama}</div>
                    {info && !removedPeriodeIds.has(p.id) && (
                      <div className="text-xs text-muted-foreground">
                        {info.skema ? skemaLabel(info.skema) : "—"}
                        {info.nominal ? ` · Rp ${new Intl.NumberFormat("id-ID").format(info.nominal)}` : ""}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasAssignment && (
                      <button
                        type="button"
                        title="Hapus keikutsertaan periode ini"
                        onClick={() => setRemovingPeriodeId(p.id)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <Switch
                      checked={aktif}
                      onCheckedChange={(v: boolean) => togglePeriode(p.id, v)}
                      disabled={assignMutation.isPending}
                    />
                  </div>
                </div>
              );
            })}
            {periodes.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">Belum ada periode</div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Switch = ubah status aktif/tidak_aktif (riwayat tetap ada). Ikon hapus = hilangkan
            keikutsertaan periode ini sepenuhnya dari riwayat.
          </p>
        </div>

        {/* Konfirmasi hapus keikutsertaan periode */}
        <Dialog open={removingPeriodeId != null} onOpenChange={(o: boolean) => !o && setRemovingPeriodeId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Hapus Keikutsertaan Periode</DialogTitle>
              <DialogDescription>
                Baris keikutsertaan{" "}
                {removingPeriodeId != null &&
                  (periodes.find((p) => p.id === removingPeriodeId)?.nama ?? `#${removingPeriodeId}`)}{" "}
                akan dihapus sepenuhnya dari riwayat donatur ini. Tindakan ini tidak bisa
                dibatalkan — gunakan switch di atas kalau hanya ingin menonaktifkan sementara.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setRemovingPeriodeId(null)} disabled={removePeriodeMutation.isPending}>
                Batal
              </Button>
              <Button
                variant="destructive"
                disabled={removePeriodeMutation.isPending}
                onClick={() => {
                  if (removingPeriodeId == null) return;
                  removePeriodeMutation.mutate(
                    { id: donatur.id, periodeId: removingPeriodeId },
                    {
                      onSuccess: () => {
                        setRemovedPeriodeIds((prev) => new Set(prev).add(removingPeriodeId));
                        setRemovingPeriodeId(null);
                      },
                    }
                  );
                }}
              >
                {removePeriodeMutation.isPending ? "Menghapus…" : "Ya, Hapus"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profil + catatan + is_checked */}
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-nama">Nama</Label>
              <Input id="d-nama" value={profil.nama} onChange={setP("nama")} required disabled={updateMutation.isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-email">Email</Label>
              <Input id="d-email" type="email" value={profil.email} onChange={setP("email")} disabled={updateMutation.isPending} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-hp">HP</Label>
              <Input id="d-hp" value={profil.hp} onChange={setP("hp")} disabled={updateMutation.isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-org">Organisasi</Label>
              <Input id="d-org" value={profil.organisasi} onChange={setP("organisasi")} disabled={updateMutation.isPending} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-nominal">Nominal default</Label>
              <Input id="d-nominal" type="number" min={0} value={profil.nominal_default} onChange={setP("nominal_default")} disabled={updateMutation.isPending} />
            </div>
            <div className="space-y-1.5">
              <Label>Skema</Label>
              <Select value={skema} onValueChange={setSkema} disabled={updateMutation.isPending}>
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
              {updateMutation.isPending ? "Menyimpan…" : "Simpan Perubahan"}
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
