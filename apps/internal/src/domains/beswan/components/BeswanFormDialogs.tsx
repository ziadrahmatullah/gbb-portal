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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { usePeriodeOptions } from "@/domains/periode/hooks/usePeriode";
import { useCreateBeswan, useUpdateBeswan } from "../hooks/useBeswan";
import type { BeswanListItem } from "../services";

export function CreateBeswanDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: periodeOptions } = usePeriodeOptions();
  const createMutation = useCreateBeswan();
  const [form, setForm] = useState({ nama_lengkap: "", nim: "", email: "", hp: "" });
  const [periodeId, setPeriodeId] = useState("");

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!periodeId) return;
    createMutation.mutate(
      { ...form, periode_id: Number(periodeId) },
      {
        onSuccess: () => {
          setForm({ nama_lengkap: "", nim: "", email: "", hp: "" });
          setPeriodeId("");
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Beswan</DialogTitle>
          <DialogDescription>Daftarkan penerima beasiswa baru ke sebuah periode.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="b-nama">Nama lengkap</Label>
            <Input id="b-nama" value={form.nama_lengkap} onChange={set("nama_lengkap")} required disabled={createMutation.isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-nim">NIM</Label>
            <Input id="b-nim" value={form.nim} onChange={set("nim")} required disabled={createMutation.isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-email">Email</Label>
            <Input id="b-email" type="email" value={form.email} onChange={set("email")} required disabled={createMutation.isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-hp">HP</Label>
            <Input id="b-hp" value={form.hp} onChange={set("hp")} required disabled={createMutation.isPending} />
          </div>
          <div className="space-y-1.5">
            <Label>Periode</Label>
            <Select value={periodeId} onValueChange={setPeriodeId} disabled={createMutation.isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                {periodeOptions?.items.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={createMutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !periodeId}>
              {createMutation.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditBeswanDialog({
  beswan,
  onClose,
}: {
  beswan: Pick<BeswanListItem, "id" | "nama_lengkap" | "hp"> | null;
  onClose: () => void;
}) {
  const updateMutation = useUpdateBeswan();
  const [nama, setNama] = useState("");
  const [hp, setHp] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  // Prefill saat beswan berubah (adjust-during-render, bukan effect)
  const [prevId, setPrevId] = useState<number | null>(null);
  if (beswan && beswan.id !== prevId) {
    setPrevId(beswan.id);
    setNama(beswan.nama_lengkap);
    setHp(beswan.hp);
    setFoto(null);
    setCv(null);
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!beswan) return;
    // PUT multipart — hanya field terisi yang dikirim (partial)
    const form = new FormData();
    if (nama) form.append("nama_lengkap", nama);
    if (hp) form.append("hp", hp);
    if (foto) form.append("foto", foto);
    if (cv) form.append("cv", cv);
    updateMutation.mutate({ id: beswan.id, form }, { onSuccess: onClose });
  };

  return (
    <Dialog open={!!beswan} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Beswan{beswan ? ` — ${beswan.nama_lengkap}` : ""}</DialogTitle>
          <DialogDescription>
            Ubah data profil. Foto dan CV hanya terganti bila file baru dipilih.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="be-nama">Nama lengkap</Label>
            <Input id="be-nama" value={nama} onChange={(e: ChangeEvent<HTMLInputElement>) => setNama(e.target.value)} required disabled={updateMutation.isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="be-hp">HP</Label>
            <Input id="be-hp" value={hp} onChange={(e: ChangeEvent<HTMLInputElement>) => setHp(e.target.value)} required disabled={updateMutation.isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="be-foto">Foto (opsional, gambar)</Label>
            <Input id="be-foto" type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setFoto(e.target.files?.[0] ?? null)} disabled={updateMutation.isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="be-cv">CV (opsional, PDF)</Label>
            <Input id="be-cv" type="file" accept="application/pdf" onChange={(e: ChangeEvent<HTMLInputElement>) => setCv(e.target.files?.[0] ?? null)} disabled={updateMutation.isPending} />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
