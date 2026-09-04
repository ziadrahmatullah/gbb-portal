import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { hasAnyRole } from "@/shared/constants/roles";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@gbb/ui";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  useCreatePesanTemplate,
  useDeletePesanTemplate,
  usePesanTemplateList,
  useUpdatePesanTemplate,
} from "../hooks/useSettings";
import type { PesanTemplate } from "@/domains/donatur/services";

// Format resmi placeholder: double brace (dipakai Kirim WA di Monitoring Donatur)
const PLACEHOLDERS = ["{{nama}}", "{{kode}}", "{{bulan}}", "{{bulan_berikutnya}}", "{{nominal}}"];

// Emoji cepat untuk pesan WA donatur (permintaan AnC, Sep 2026). Emoji lain
// tetap bisa diketik langsung (Win + . / Cmd + Ctrl + Space) — semua lapisan
// (Postgres UTF-8, JSON, encodeURIComponent → wa.me) mendukungnya.
const QUICK_EMOJI = [
  "🙏", "😊", "🤲", "❤️", "🌟", "✨", "🎉", "👋",
  "💪", "🙌", "🥰", "🌱", "📌", "📅", "💳", "✅",
];

// Siapa yang boleh mengubah template: admin + AnC (BE: FEpromt31). Role lain
// melihat daftar read-only — sebelumnya tombol tampil untuk semua role dan
// berujung 403 "error" saat Simpan.
const TEMPLATE_EDITOR_ROLES = ["admin", "anc"] as const;

function TemplateEditor({
  editing,
  onDone,
}: {
  editing: PesanTemplate | null;
  onDone: () => void;
}) {
  const createMutation = useCreatePesanTemplate();
  const updateMutation = useUpdatePesanTemplate();
  const saving = createMutation.isPending || updateMutation.isPending;

  const [nama, setNama] = useState(editing?.nama ?? "");
  const [konteks, setKonteks] = useState(editing?.konteks ?? "donatur");
  const [isi, setIsi] = useState(editing?.isi ?? "");
  const [isDefault, setIsDefault] = useState(editing?.is_default ?? false);
  const [aktif, setAktif] = useState(editing?.aktif ?? true);
  const [urutan, setUrutan] = useState(editing ? String(editing.urutan) : "");
  const isiRef = useRef<HTMLTextAreaElement>(null);

  // Sisipkan placeholder/emoji di posisi kursor (bukan selalu di akhir), lalu
  // kembalikan fokus + kursor tepat setelah sisipan
  const insertAtCursor = (snippet: string) => {
    const el = isiRef.current;
    const start = el?.selectionStart ?? isi.length;
    const end = el?.selectionEnd ?? start;
    setIsi(isi.slice(0, start) + snippet + isi.slice(end));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = {
      nama,
      konteks,
      isi,
      urutan: urutan ? Number(urutan) : undefined,
      is_default: isDefault,
      aktif,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, body }, { onSuccess: onDone });
    } else {
      createMutation.mutate(body, { onSuccess: onDone });
    }
  };

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">
          {editing ? `Edit Template — ${editing.nama}` : "Tambah Template"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
      <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="t-nama">Nama template</Label>
          <Input id="t-nama" value={nama} onChange={(e: ChangeEvent<HTMLInputElement>) => setNama(e.target.value)} required disabled={saving} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="t-konteks">Konteks</Label>
          <Input id="t-konteks" value={konteks} onChange={(e: ChangeEvent<HTMLInputElement>) => setKonteks(e.target.value)} placeholder="mis. donatur" disabled={saving} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="t-isi">Isi pesan (emoji didukung)</Label>
        <Textarea
          id="t-isi"
          ref={isiRef}
          rows={3}
          value={isi}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setIsi(e.target.value)}
          required
          disabled={saving}
        />
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          Placeholder:
          {PLACEHOLDERS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => insertAtCursor(p)}
              className="rounded bg-muted px-1.5 py-0.5 font-mono hover:bg-accent transition-colors"
              disabled={saving}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          Emoji:
          {QUICK_EMOJI.map((em) => (
            <button
              key={em}
              type="button"
              title={`Sisipkan ${em}`}
              onClick={() => insertAtCursor(em)}
              className="rounded px-1 py-0.5 text-base leading-none hover:bg-accent transition-colors"
              disabled={saving}
            >
              {em}
            </button>
          ))}
          <span className="ml-1">· emoji lain bisa diketik langsung di kotak pesan</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Label htmlFor="t-urutan" className="text-sm">Urutan</Label>
          <Input id="t-urutan" type="number" min={1} value={urutan} onChange={(e: ChangeEvent<HTMLInputElement>) => setUrutan(e.target.value)} className="w-20 h-8" disabled={saving} />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Switch checked={isDefault} onCheckedChange={setIsDefault} disabled={saving} />
          Jadikan default
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Switch checked={aktif} onCheckedChange={setAktif} disabled={saving} />
          Aktif
        </label>
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
      </CardContent>
    </Card>
  );
}

export function TemplatesTab() {
  const role = useAuthStore((s) => s.role);
  const canEdit = hasAnyRole(role, TEMPLATE_EDITOR_ROLES);
  const { data, isLoading } = usePesanTemplateList();
  const deleteMutation = useDeletePesanTemplate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PesanTemplate | null>(null);
  const [deleting, setDeleting] = useState<PesanTemplate | null>(null);

  const items = [...(data?.items ?? [])].sort((a, b) => a.urutan - b.urutan);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Template dipakai tombol Kirim WA di Monitoring Donatur. Urutan menentukan posisi di
          dropdown (re-order via field Urutan).
          {!canEdit && " Hanya admin dan tim AnC yang bisa mengubah template."}
        </p>
        {canEdit && (
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah
          </Button>
        )}
      </div>

      {(formOpen || editing) && (
        <TemplateEditor
          key={editing?.id ?? "create"}
          editing={editing}
          onDone={() => { setFormOpen(false); setEditing(null); }}
        />
      )}

      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Urut</TableHead>
              <TableHead>Nama Template</TableHead>
              <TableHead className="w-28">Konteks</TableHead>
              <TableHead className="w-20">Default</TableHead>
              <TableHead className="w-20">Aktif</TableHead>
              {canEdit && <TableHead className="w-24 text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={canEdit ? 6 : 5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 6 : 5} className="text-center text-sm text-muted-foreground py-8">
                  Belum ada template
                </TableCell>
              </TableRow>
            ) : (
              items.map((t) => (
                <TableRow key={t.id} className={cn(!t.aktif && "opacity-50")}>
                  <TableCell className="font-mono text-xs">{t.urutan}</TableCell>
                  <TableCell>
                    <div className="font-medium">{t.nama}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-md" title={t.isi}>
                      {t.isi}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{t.konteks || "—"}</TableCell>
                  <TableCell>{t.is_default ? "◉" : "○"}</TableCell>
                  <TableCell>{t.aktif ? "✅" : "❌"}</TableCell>
                  {canEdit && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        title="Edit"
                        onClick={() => { setFormOpen(false); setEditing(t); }}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        title="Hapus"
                        onClick={() => setDeleting(t)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleting} onOpenChange={(o: boolean) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Template</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus template <strong>{deleting?.nama}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
              }
            >
              {deleteMutation.isPending ? "Menghapus…" : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
