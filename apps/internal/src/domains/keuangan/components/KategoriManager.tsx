import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Pencil, Plus } from "lucide-react";
import { Skeleton } from "@gbb/ui";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useCreateKategori, useKategoriList, useUpdateKategori } from "../hooks/useKeuangan";
import type { CashflowKategori } from "../services";

const NO_PARENT = "none";

function KategoriForm({
  editing,
  parents,
  onDone,
}: {
  editing: CashflowKategori | null;
  parents: CashflowKategori[];
  onDone: () => void;
}) {
  const createMutation = useCreateKategori();
  const updateMutation = useUpdateKategori();
  const saving = createMutation.isPending || updateMutation.isPending;

  const [nama, setNama] = useState(editing?.nama ?? "");
  const [tipe, setTipe] = useState(editing?.tipe ?? "cash_out");
  const [parentId, setParentId] = useState(
    editing?.parent_id ? String(editing.parent_id) : NO_PARENT
  );
  const [urutan, setUrutan] = useState(editing ? String(editing.urutan) : "");
  const [keywords, setKeywords] = useState(editing?.keywords ?? "");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editing) {
      // parent tidak bisa diubah lewat UpdateKategoriReq
      updateMutation.mutate(
        {
          id: editing.id,
          body: { nama, tipe, urutan: urutan ? Number(urutan) : undefined, keywords },
        },
        { onSuccess: onDone }
      );
    } else {
      createMutation.mutate(
        {
          nama,
          tipe,
          parent_id: parentId === NO_PARENT ? undefined : Number(parentId),
          urutan: urutan ? Number(urutan) : undefined,
          keywords: keywords || undefined,
        },
        { onSuccess: onDone }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4 shadow-sm">
      <h4 className="text-sm font-semibold">{editing ? `Edit — ${editing.nama}` : "Tambah Kategori"}</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="k-nama">Nama</Label>
          <Input id="k-nama" value={nama} onChange={(e: ChangeEvent<HTMLInputElement>) => setNama(e.target.value)} required disabled={saving} />
        </div>
        <div className="grid gap-2">
          <Label>Tipe</Label>
          <Select value={tipe} onValueChange={setTipe} disabled={saving}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash_in">Cash In</SelectItem>
              <SelectItem value="cash_out">Cash Out</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!editing && (
          <div className="grid gap-2">
            <Label>Induk (kosong = kategori utama)</Label>
            <Select value={parentId} onValueChange={setParentId} disabled={saving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PARENT}>— (kategori utama)</SelectItem>
                {parents.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="k-urutan">Urutan</Label>
          <Input id="k-urutan" type="number" min={1} value={urutan} onChange={(e: ChangeEvent<HTMLInputElement>) => setUrutan(e.target.value)} disabled={saving} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="k-keywords">Keywords auto-match (opsional)</Label>
        <Input
          id="k-keywords"
          value={keywords}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setKeywords(e.target.value)}
          placeholder="contoh: Pajak, Biaya Adm, Administrasi"
          disabled={saving}
        />
        <p className="text-xs text-muted-foreground">
          Pisahkan dengan koma, case-insensitive — dicocokkan ke deskripsi transaksi & kolom
          Kat. BSI mentah dari file bank saat upload.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone} disabled={saving}>
          Batal
        </Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

// Konten manager (tanpa Dialog wrapper) — dipakai dialog di Rekonsiliasi dan
// inline di tab Settings › Master Kategori Cashflow.
export function KategoriManagerContent() {
  const { data, isLoading } = useKategoriList({ limit: 100 });
  const updateMutation = useUpdateKategori();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CashflowKategori | null>(null);

  const items = data?.items ?? [];
  const parents = items.filter((k) => !k.parent_id);
  // urutkan: induk lalu anak-anaknya
  const ordered = parents.flatMap((p) => [p, ...items.filter((k) => k.parent_id === p.id)]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Keywords dipakai backend untuk auto-klasifikasi saat upload mutasi. Nonaktifkan
          kategori yang tidak dipakai (tidak ada hapus permanen).
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Tambah
        </Button>
      </div>

      {(formOpen || editing) && (
          <KategoriForm
            editing={editing}
            parents={parents}
            onDone={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        )}

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="w-24">Tipe</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead className="w-16">Aktif</TableHead>
                <TableHead className="w-14 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : (
                ordered.map((k) => (
                  <TableRow key={k.id} className={cn(!k.aktif && "opacity-50")}>
                    <TableCell className={cn("font-medium text-sm", k.parent_id && "pl-8 font-normal")}>
                      {k.parent_id ? `› ${k.nama}` : k.nama}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{k.tipe}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-56 truncate" title={k.keywords ?? ""}>
                      {k.keywords || "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={k.aktif}
                        onCheckedChange={(v: boolean) =>
                          updateMutation.mutate({ id: k.id, body: { aktif: v } })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        title="Edit"
                        onClick={() => {
                          setFormOpen(false);
                          setEditing(k);
                        }}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
    </div>
  );
}

export function KategoriManagerDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Master Kategori Cashflow</DialogTitle>
          <DialogDescription className="sr-only">Kelola kategori cashflow</DialogDescription>
        </DialogHeader>
        <KategoriManagerContent />
      </DialogContent>
    </Dialog>
  );
}
