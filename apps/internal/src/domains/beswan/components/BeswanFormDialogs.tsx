import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { FileDropzone } from "@gbb/ui";
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
import { OptionalPasswordField } from "@/shared/components/OptionalPasswordField";
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
  const [form, setForm] = useState({ nama_lengkap: "", nim: "", email: "", hp: "", jurusan: "", tahun_masuk: "" });
  const [periodeId, setPeriodeId] = useState("");
  const [manualPassword, setManualPassword] = useState(false);
  const [password, setPassword] = useState("");

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!periodeId) return;
    createMutation.mutate(
      {
        nama_lengkap: form.nama_lengkap,
        nim: form.nim,
        email: form.email,
        hp: form.hp,
        periode_id: Number(periodeId),
        jurusan: form.jurusan || undefined,
        tahun_masuk: form.tahun_masuk ? Number(form.tahun_masuk) : undefined,
        password: manualPassword && password ? password : undefined,
      },
      {
        onSuccess: () => {
          setForm({ nama_lengkap: "", nim: "", email: "", hp: "", jurusan: "", tahun_masuk: "" });
          setManualPassword(false);
          setPassword("");
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
          <DialogDescription>
            Daftarkan penerima beasiswa baru ke sebuah periode. Beswan menerima email untuk
            membuat password login-nya sendiri.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="b-nama">Nama lengkap</Label>
            <Input id="b-nama" value={form.nama_lengkap} onChange={set("nama_lengkap")} required disabled={createMutation.isPending} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-nim">NIM</Label>
            <Input id="b-nim" value={form.nim} onChange={set("nim")} required disabled={createMutation.isPending} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-email">Email</Label>
            <Input id="b-email" type="email" value={form.email} onChange={set("email")} required disabled={createMutation.isPending} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-hp">HP</Label>
            <Input id="b-hp" value={form.hp} onChange={set("hp")} required disabled={createMutation.isPending} />
          </div>
          {/* Profil akademik (masukan tim: analitik per jurusan & tingkat). Simpan
              TAHUN MASUK, semester diturunkan BE — angka semester yang disimpan
              mentah akan basi tiap 6 bulan. */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="b-jurusan">Jurusan</Label>
              <Input id="b-jurusan" value={form.jurusan} onChange={set("jurusan")} placeholder="Teknik Informatika" disabled={createMutation.isPending} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="b-tahun">Tahun masuk kuliah</Label>
              <Input id="b-tahun" type="number" min={2000} max={new Date().getFullYear() + 1} value={form.tahun_masuk} onChange={set("tahun_masuk")} placeholder="2022" disabled={createMutation.isPending} />
            </div>
          </div>
          <div className="grid gap-2">
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
          <OptionalPasswordField
            id="b-password"
            manual={manualPassword}
            onManualChange={setManualPassword}
            value={password}
            onChange={setPassword}
            disabled={createMutation.isPending}
            subjek="beswan"
          />
          <DialogFooter className="pt-2">
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
  beswan: Pick<BeswanListItem, "id" | "nama_lengkap" | "email" | "hp" | "jurusan" | "tahun_masuk"> | null;
  onClose: () => void;
}) {
  const updateMutation = useUpdateBeswan();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [hp, setHp] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [tahunMasuk, setTahunMasuk] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  // Prefill saat beswan berubah (adjust-during-render, bukan effect)
  const [prevId, setPrevId] = useState<number | null>(null);
  if (beswan && beswan.id !== prevId) {
    setPrevId(beswan.id);
    setNama(beswan.nama_lengkap);
    setEmail(beswan.email);
    setEmailError("");
    setHp(beswan.hp);
    setJurusan(beswan.jurusan ?? "");
    setTahunMasuk(beswan.tahun_masuk ? String(beswan.tahun_masuk) : "");
    setFoto(null);
    setCv(null);
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!beswan) return;
    setEmailError("");
    updateMutation.mutate(
      {
        id: beswan.id,
        // Partial: hanya field terisi yang dikirim; email hanya bila BERUBAH
        // dari nilai awal (string kosong / tak dikirim = email tidak diubah)
        body: {
          nama_lengkap: nama || undefined,
          hp: hp || undefined,
          email: email && email !== beswan.email ? email : undefined,
          // Kirim hanya bila berubah; tahun kosong → 0 = dikosongkan di BE
          jurusan: jurusan !== (beswan.jurusan ?? "") ? jurusan : undefined,
          tahun_masuk:
            (tahunMasuk ? Number(tahunMasuk) : 0) !== (beswan.tahun_masuk ?? 0)
              ? tahunMasuk
                ? Number(tahunMasuk)
                : 0
              : undefined,
          foto: foto ?? undefined,
          cv: cv ?? undefined,
        },
      },
      {
        onSuccess: onClose,
        onError: (err: Error) => {
          // 400 validasi email (format salah / sudah dipakai beswan lain)
          // ditampilkan inline di bawah input email
          if (/email/i.test(err.message)) setEmailError(err.message);
        },
      }
    );
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
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="be-nama">Nama lengkap</Label>
            <Input id="be-nama" value={nama} onChange={(e: ChangeEvent<HTMLInputElement>) => setNama(e.target.value)} required disabled={updateMutation.isPending} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="be-email">Email</Label>
            <Input
              id="be-email"
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              required
              aria-invalid={!!emailError}
              disabled={updateMutation.isPending}
            />
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            <p className="text-xs text-muted-foreground">
              Email ini dipakai beswan untuk login — mengubahnya berarti mengubah kredensial
              login mereka.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="be-hp">HP</Label>
            <Input id="be-hp" value={hp} onChange={(e: ChangeEvent<HTMLInputElement>) => setHp(e.target.value)} required disabled={updateMutation.isPending} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="be-jurusan">Jurusan</Label>
              <Input id="be-jurusan" value={jurusan} onChange={(e: ChangeEvent<HTMLInputElement>) => setJurusan(e.target.value)} placeholder="Teknik Informatika" disabled={updateMutation.isPending} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="be-tahun">Tahun masuk kuliah</Label>
              <Input id="be-tahun" type="number" min={2000} max={new Date().getFullYear() + 1} value={tahunMasuk} onChange={(e: ChangeEvent<HTMLInputElement>) => setTahunMasuk(e.target.value)} placeholder="2022" disabled={updateMutation.isPending} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="be-foto">Foto (opsional, gambar)</Label>
            <FileDropzone id="be-foto" accept="image/*" value={foto} onChange={(f: File | null) => setFoto(f)} disabled={updateMutation.isPending} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="be-cv">CV (opsional, PDF)</Label>
            <FileDropzone id="be-cv" accept="application/pdf" value={cv} onChange={(f: File | null) => setCv(f)} disabled={updateMutation.isPending} />
          </div>
          <DialogFooter className="pt-2">
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
