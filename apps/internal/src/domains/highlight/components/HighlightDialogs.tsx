import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { toast } from "sonner";
import { FileDropzone } from "@gbb/ui";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
import { useCreateHighlight, useUpdateHighlight } from "../hooks/useHighlight";
import { HIGHLIGHT_KATEGORI, highlightImageUrl } from "../services";
import type { HighlightPost } from "../services";

// Batas BE: upload.SaveUploadedImage → png/jpeg, MaxImageSize 2MB
const IMAGE_ACCEPT = ".png,.jpg,.jpeg";
const IMAGE_MAX_MB = 2;

function HighlightForm({
  editing,
  nextUrutan,
  onClose,
}: {
  editing: HighlightPost | null;
  // Urutan default untuk post baru = paling belakang. 1-based — BE mengabaikan 0.
  nextUrutan: number;
  onClose: () => void;
}) {
  const createMutation = useCreateHighlight();
  const updateMutation = useUpdateHighlight();
  const saving = createMutation.isPending || updateMutation.isPending;

  const [judul, setJudul] = useState(editing?.judul ?? "");
  const [linkIg, setLinkIg] = useState(editing?.link_ig ?? "");
  const [kategori, setKategori] = useState(editing?.kategori || "recap");
  const [tanggal, setTanggal] = useState(editing?.tanggal ?? "");
  const [urutan, setUrutan] = useState(String(editing?.urutan || nextUrutan));
  const [aktif, setAktif] = useState(editing?.aktif ?? true);
  const [gambar, setGambar] = useState<File | null>(null);

  const currentImage = highlightImageUrl(editing?.gambar_url);
  // Gambar wajib untuk post baru — highlight tanpa poster tidak ada gunanya
  // di grid donatur (kartunya cuma ikon placeholder)
  const needImage = !editing && !gambar;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const n = Number(urutan);
    if (!Number.isInteger(n) || n < 1) {
      toast.error("Urutan harus bilangan bulat mulai dari 1");
      return;
    }
    const form = new FormData();
    form.append("judul", judul.trim());
    // link_ig & tanggal: dikirim kosong = dihapus (semantik BE) — sesuai isi form
    form.append("link_ig", linkIg.trim());
    form.append("kategori", kategori);
    form.append("tanggal", tanggal);
    form.append("urutan", String(n));
    form.append("aktif", String(aktif));
    if (gambar) form.append("gambar", gambar);

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, form },
        {
          onSuccess: () => {
            toast.success("Highlight diperbarui");
            onClose();
          },
        }
      );
    } else {
      createMutation.mutate(form, { onSuccess: onClose });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="h-judul">Judul</Label>
        <Input
          id="h-judul"
          value={judul}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setJudul(e.target.value)}
          placeholder="Recap GBB 2024 Genap"
          required
          disabled={saving}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Kategori</Label>
          <Select value={kategori} onValueChange={setKategori} disabled={saving}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HIGHLIGHT_KATEGORI.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="h-tanggal">Tanggal publikasi</Label>
          <Input
            id="h-tanggal"
            type="date"
            value={tanggal}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTanggal(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="h-link">Link post Instagram (opsional)</Label>
        <Input
          id="h-link"
          type="url"
          value={linkIg}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setLinkIg(e.target.value)}
          placeholder="https://instagram.com/p/…"
          disabled={saving}
        />
        <p className="text-xs text-muted-foreground">
          Kalau diisi, kartu di portal donatur menautkan ke post ini. Kosongkan untuk
          poster tanpa post IG (mis. pengumuman oprec).
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="h-gambar">
          Poster / infografis {editing ? "(kosongkan bila tidak diganti)" : "(wajib)"}
        </Label>
        {editing && currentImage && !gambar && (
          <img
            src={currentImage}
            alt={editing.judul}
            className="h-32 w-full rounded-md border object-cover"
          />
        )}
        <FileDropzone
          id="h-gambar"
          accept={IMAGE_ACCEPT}
          maxSizeMb={IMAGE_MAX_MB}
          value={gambar}
          onChange={(f: File | null) => setGambar(f)}
          disabled={saving}
          hint="PNG/JPG, maks 2 MB — pakai file yang sama dengan post Instagram"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 items-end">
        <div className="grid gap-2">
          <Label htmlFor="h-urutan">Urutan tampil</Label>
          <Input
            id="h-urutan"
            type="number"
            min={1}
            step={1}
            value={urutan}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setUrutan(e.target.value)}
            required
            disabled={saving}
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
          <Switch checked={aktif} onCheckedChange={setAktif} disabled={saving} />
          Tampil di portal donatur
        </label>
      </div>
      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Batal
        </Button>
        <Button type="submit" disabled={saving || needImage}>
          {saving ? "Menyimpan…" : editing ? "Simpan" : "Tambah Highlight"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function HighlightFormDialog({
  editing,
  nextUrutan,
  onClose,
}: {
  editing: HighlightPost | null;
  nextUrutan: number;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Highlight" : "Tambah Highlight"}</DialogTitle>
          <DialogDescription>
            Poster/infografis yang sama dengan yang di-post ke Instagram GBB — tampil di
            Beranda Portal Donatur bagian &quot;Highlight GBB&quot;.
          </DialogDescription>
        </DialogHeader>
        <HighlightForm editing={editing} nextUrutan={nextUrutan} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
