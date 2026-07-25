import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
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
import { useCreateLaporan, useUpdateLaporan } from "../hooks/useLaporan";
import { LAPORAN_TIPE_OPTIONS } from "../services";
import type { Laporan, LaporanTipe } from "../services";

const NO_PERIODE = "none";

// `tipe` enum tertutup backend (oneof booklet|keuangan|internal) — dropdown tetap
function TipeSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: LaporanTipe) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Pilih tipe" />
      </SelectTrigger>
      <SelectContent>
        {LAPORAN_TIPE_OPTIONS.map((t) => (
          <SelectItem key={t} value={t} className="capitalize">
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function UploadLaporanDialog({ onClose }: { onClose: () => void }) {
  const { data: periodeOptions } = usePeriodeOptions();
  const createMutation = useCreateLaporan();
  const [judul, setJudul] = useState("");
  const [tipe, setTipe] = useState<LaporanTipe | "">("");
  const [periodeId, setPeriodeId] = useState(NO_PERIODE);
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !tipe) return;
    const form = new FormData();
    form.append("judul", judul);
    form.append("tipe", tipe);
    if (periodeId !== NO_PERIODE) form.append("periode_id", periodeId);
    form.append("is_public", String(isPublic));
    form.append("file", file);
    createMutation.mutate(form, { onSuccess: onClose });
  };

  const saving = createMutation.isPending;

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Laporan</DialogTitle>
          <DialogDescription>Unggah dokumen laporan/booklet baru.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="l-judul">Judul</Label>
            <Input id="l-judul" value={judul} onChange={(e: ChangeEvent<HTMLInputElement>) => setJudul(e.target.value)} required disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipe</Label>
            <TipeSelect value={tipe} onChange={setTipe} disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label>Periode (opsional)</Label>
            <Select value={periodeId} onValueChange={setPeriodeId} disabled={saving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PERIODE}>— (tanpa periode)</SelectItem>
                {periodeOptions?.items.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="l-file">File (wajib — PDF/DOCX/PPTX/XLS)</Label>
            <Input
              id="l-file"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
              required
              disabled={saving}
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} disabled={saving} />
            Tampilkan sebagai publik
          </label>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving || !file || !tipe}>
              {saving ? "Mengupload…" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditLaporanDialog({ laporan, onClose }: { laporan: Laporan; onClose: () => void }) {
  const updateMutation = useUpdateLaporan();
  const [judul, setJudul] = useState(laporan.judul);
  const [tipe, setTipe] = useState<LaporanTipe>(laporan.tipe);
  const [isPublic, setIsPublic] = useState(laporan.is_public);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateMutation.mutate(
      { id: laporan.id, body: { judul, tipe, is_public: isPublic } },
      { onSuccess: onClose }
    );
  };

  const saving = updateMutation.isPending;

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Laporan</DialogTitle>
          <DialogDescription>
            File tidak dapat diganti lewat edit — hapus &amp; upload ulang bila perlu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="le-judul">Judul</Label>
            <Input id="le-judul" value={judul} onChange={(e: ChangeEvent<HTMLInputElement>) => setJudul(e.target.value)} required disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipe</Label>
            <TipeSelect value={tipe} onChange={setTipe} disabled={saving} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} disabled={saving} />
            Tampilkan sebagai publik
          </label>
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
