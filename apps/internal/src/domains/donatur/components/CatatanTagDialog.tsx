import { useState } from "react";
import type { ChangeEvent } from "react";
import { Save } from "lucide-react";
import { Badge } from "@gbb/ui";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { useAddTag, useRemoveTag, useUpdateDonatur } from "../hooks/useDonatur";
import { MANUAL_TAGS, ROW_COLORS, tagMeta } from "../services";
import type { DonaturMonitoring } from "../services";

const NO_COLOR = "none";

export function CatatanTagDialog({
  row,
  onClose,
}: {
  row: DonaturMonitoring;
  onClose: () => void;
}) {
  const updateMutation = useUpdateDonatur();
  const addTagMutation = useAddTag();
  const removeTagMutation = useRemoveTag();

  const initialTags = row.tags ?? [];
  const [catatan, setCatatan] = useState(row.catatan ?? "");
  const [tags, setTags] = useState<string[]>(initialTags);
  const [warna, setWarna] = useState(row.warna || NO_COLOR);

  const saving =
    updateMutation.isPending || addTagMutation.isPending || removeTagMutation.isPending;

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const handleSave = async () => {
    // Tag tidak punya endpoint "set semua" — selisihnya dihitung di sini lalu
    // dikirim satu per satu lewat POST/DELETE tag
    const added = tags.filter((t) => !initialTags.includes(t));
    const removed = initialTags.filter((t) => !tags.includes(t));

    try {
      await Promise.all([
        ...added.map((tag) => addTagMutation.mutateAsync({ id: row.id, tag })),
        ...removed.map((tag) => removeTagMutation.mutateAsync({ id: row.id, tag })),
      ]);
      await updateMutation.mutateAsync({
        id: row.id,
        // "" = kosongkan warna, backend menyimpannya sebagai NULL
        body: { catatan, warna: warna === NO_COLOR ? "" : warna },
      });
      onClose();
    } catch {
      // Pesannya sudah di-toast interceptor; dialog sengaja dibiarkan terbuka
      // supaya isian user tidak hilang dan bisa langsung dicoba lagi
    }
  };

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📝 Catatan &amp; Tag — {row.nama}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Badge variant="outline" className="font-mono text-xs">
            {row.kode || "—"}
          </Badge>

          <div className="grid gap-2">
            <Label htmlFor="ct-catatan">Catatan</Label>
            <Textarea
              id="ct-catatan"
              rows={3}
              value={catatan}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCatatan(e.target.value)}
              placeholder="Tulis catatan untuk donatur ini…"
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label>Tag Manual</Label>
            {MANUAL_TAGS.map((t) => {
              const meta = tagMeta(t);
              return (
                <label
                  key={t}
                  className="flex cursor-pointer items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm transition-colors hover:bg-muted/60"
                >
                  <input
                    type="checkbox"
                    checked={tags.includes(t)}
                    onChange={() => toggleTag(t)}
                    disabled={saving}
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  <span>{meta?.icon}</span>
                  {meta?.label ?? t}
                </label>
              );
            })}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ct-warna">Warna Baris</Label>
            <Select value={warna} onValueChange={setWarna} disabled={saving}>
              <SelectTrigger id="ct-warna">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_COLOR}>— Tidak ada —</SelectItem>
                {ROW_COLORS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Kosongkan untuk ikut warna tag otomatis
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
