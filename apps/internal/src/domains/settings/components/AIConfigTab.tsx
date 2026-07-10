import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Lock, Pencil, Plug, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  useAIConfigList,
  useCreateAIConfig,
  useDeleteAIConfig,
  useSetActiveAIConfig,
  useUpdateAIConfig,
} from "../hooks/useSettings";
import type { AIConfig } from "../services";

function AIConfigFormDialog({
  editing,
  onClose,
}: {
  editing: AIConfig | null;
  onClose: () => void;
}) {
  const createMutation = useCreateAIConfig();
  const updateMutation = useUpdateAIConfig();
  const saving = createMutation.isPending || updateMutation.isPending;

  const [provider, setProvider] = useState(editing?.provider ?? "anthropic");
  const [label, setLabel] = useState(editing?.label ?? "");
  const [model, setModel] = useState(editing?.model ?? "");
  const [baseUrl, setBaseUrl] = useState(editing?.base_url ?? "");
  // API key TIDAK PERNAH dikirim server ke client — form edit selalu mulai kosong;
  // placeholder statis, dan hanya dikirim di body kalau user mengetik nilai baru.
  const [apiKey, setApiKey] = useState("");
  const [keyError, setKeyError] = useState("");

  const needBaseUrl = provider === "openai_compatible";

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate(
        {
          id: editing.id,
          body: {
            label,
            model,
            base_url: needBaseUrl ? baseUrl : undefined,
            // OMIT api_key saat kosong = pertahankan key lama (jangan kirim "")
            ...(apiKey ? { api_key: apiKey } : {}),
          },
        },
        { onSuccess: onClose }
      );
    } else {
      if (!apiKey) {
        setKeyError("API key wajib diisi saat menambah provider baru");
        return;
      }
      createMutation.mutate(
        {
          provider,
          label,
          model,
          base_url: needBaseUrl ? baseUrl : undefined,
          api_key: apiKey,
        },
        { onSuccess: onClose }
      );
    }
  };

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit Provider — ${editing.label}` : "Tambah Provider AI"}</DialogTitle>
          <DialogDescription>
            API key disimpan terenkripsi di server dan tidak pernah ditampilkan kembali.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider} disabled={saving || !!editing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anthropic">anthropic</SelectItem>
                <SelectItem value="openai_compatible">openai_compatible</SelectItem>
              </SelectContent>
            </Select>
            {editing && (
              <p className="text-xs text-muted-foreground">Provider tidak dapat diubah setelah dibuat.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-label">Label</Label>
            <Input id="ai-label" value={label} onChange={(e: ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)} placeholder="mis. Claude Opus 4.8" required disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-model">Model</Label>
            <Input id="ai-model" value={model} onChange={(e: ChangeEvent<HTMLInputElement>) => setModel(e.target.value)} placeholder="mis. claude-opus-4-8" required disabled={saving} />
          </div>
          {needBaseUrl && (
            <div className="space-y-1.5">
              <Label htmlFor="ai-baseurl">Base URL (wajib untuk openai_compatible)</Label>
              <Input id="ai-baseurl" type="url" value={baseUrl} onChange={(e: ChangeEvent<HTMLInputElement>) => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" required disabled={saving} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="ai-key" className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              API Key {editing && "(kosongkan untuk mempertahankan key lama)"}
            </Label>
            <Input
              id="ai-key"
              type="password"
              value={apiKey}
              onChange={(e: ChangeEvent<HTMLInputElement>) => { setApiKey(e.target.value); setKeyError(""); }}
              placeholder="••••••••••••••••"
              autoComplete="new-password"
              disabled={saving}
            />
            {keyError && <p className="text-sm text-destructive">{keyError}</p>}
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

export function AIConfigTab() {
  const { data, isLoading } = useAIConfigList();
  const setActiveMutation = useSetActiveAIConfig();
  const deleteMutation = useDeleteAIConfig();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AIConfig | null>(null);
  const [deleting, setDeleting] = useState<AIConfig | null>(null);

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Provider AI untuk auto-summary &amp; auto-tag Library. Satu provider aktif dipakai
          fitur AI (fitur pemanggilan AI-nya sendiri belum tersedia).
        </p>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Aktif</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="w-40">Provider</TableHead>
              <TableHead className="w-32 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <div className="h-6 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  Belum ada provider AI
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => (
                <TableRow key={c.id} className={cn(!c.aktif && "text-muted-foreground")}>
                  <TableCell>
                    <input
                      type="radio"
                      name="ai-aktif"
                      checked={c.aktif}
                      onChange={() => setActiveMutation.mutate(c.id)}
                      disabled={setActiveMutation.isPending}
                      title={c.aktif ? "Provider aktif" : "Jadikan aktif"}
                      className="h-4 w-4 accent-primary cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className={cn("font-medium", c.aktif && "text-foreground")}>{c.label}</TableCell>
                  <TableCell className="font-mono text-xs">{c.model}</TableCell>
                  <TableCell className="text-sm">
                    {c.provider}
                    {c.base_url && (
                      <div className="text-xs text-muted-foreground truncate max-w-40" title={c.base_url}>
                        {c.base_url}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* Belum ada endpoint test koneksi; JANGAN panggil provider AI
                          dari browser (akan meng-expose API key ke client) */}
                      <button
                        title="Test Koneksi — fitur belum tersedia"
                        disabled
                        className="p-1.5 rounded-lg text-muted-foreground opacity-40 cursor-not-allowed"
                      >
                        <Plug className="h-4 w-4" />
                      </button>
                      <button
                        title="Edit"
                        onClick={() => { setFormOpen(false); setEditing(c); }}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        title="Hapus"
                        onClick={() => setDeleting(c)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {(formOpen || editing) && (
        <AIConfigFormDialog
          key={editing?.id ?? "create"}
          editing={editing}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}

      <Dialog open={!!deleting} onOpenChange={(o: boolean) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Provider AI</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus provider <strong>{deleting?.label}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
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
