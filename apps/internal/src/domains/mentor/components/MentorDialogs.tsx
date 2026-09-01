import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Home, Globe } from "lucide-react";
import { Badge, FileDropzone, SearchableSelect, Skeleton } from "@gbb/ui";
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
  useCreateMentor,
  useMentorDetail,
  useMentorOptions,
  useUpdateMentor,
} from "../hooks/useMentor";

export function UndipBadge({ isInternal }: { isInternal: boolean }) {
  return (
    <Badge
      variant={isInternal ? "default" : "outline"}
      className={isInternal ? undefined : "text-muted-foreground"}
    >
      {isInternal ? <Home className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
      {isInternal ? "UNDIP" : "non-UNDIP"}
    </Badge>
  );
}

interface FormState {
  nama: string;
  email: string;
  hp: string;
  linkedin_url: string;
  bidang_keahlian: string;
  is_internal: boolean;
}

const EMPTY_FORM: FormState = {
  nama: "",
  email: "",
  hp: "",
  linkedin_url: "",
  bidang_keahlian: "",
  is_internal: false,
};

// Nilai dropdown bidang untuk "buat bidang baru" (user mengetik sendiri)
const NEW_BIDANG = "__new__";

// Satu dialog untuk create (editingId=null) dan edit (prefill dari detail).
export function MentorFormDialog({
  open,
  editingId,
  onClose,
}: {
  open: boolean;
  editingId: number | null;
  onClose: () => void;
}) {
  const { data: detail, isLoading: detailLoading } = useMentorDetail(open ? editingId : null);
  const { data: options } = useMentorOptions();
  const createMutation = useCreateMentor();
  const updateMutation = useUpdateMentor();
  const saving = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [cv, setCv] = useState<File | null>(null);
  // Pilihan dropdown bidang: nama bidang yang sudah ada, atau NEW_BIDANG
  // (form.bidang_keahlian dipakai untuk mengetik bidang baru)
  const [bidangChoice, setBidangChoice] = useState("");
  // Daftar bidang unik dari data mentor yang ada; bidang mentor yang sedang
  // diedit selalu disertakan supaya tetap muncul di dropdown
  const bidangOptions = useMemo(() => {
    const set = new Set(
      (options?.items ?? []).map((m) => m.bidang_keahlian).filter(Boolean)
    );
    if (detail?.bidang_keahlian) set.add(detail.bidang_keahlian);
    return [...set].sort();
  }, [options, detail]);
  // Prefill saat detail edit termuat / dialog dibuka ulang (adjust-during-render)
  const [prevKey, setPrevKey] = useState("");
  const key = editingId != null ? `edit-${editingId}-${detail?.id ?? "loading"}` : `create-${open}`;
  if (open && key !== prevKey) {
    setPrevKey(key);
    setCv(null);
    setBidangChoice(editingId != null && detail ? detail.bidang_keahlian : "");
    setForm(
      editingId != null && detail
        ? {
            nama: detail.nama,
            email: detail.email ?? "",
            hp: detail.hp ?? "",
            linkedin_url: detail.linkedin_url ?? "",
            bidang_keahlian: "",
            is_internal: detail.is_internal,
          }
        : EMPTY_FORM
    );
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const bidang = bidangChoice === NEW_BIDANG ? form.bidang_keahlian.trim() : bidangChoice;
    if (!bidang) return;
    const fd = new FormData();
    fd.append("nama", form.nama);
    fd.append("email", form.email);
    if (form.hp) fd.append("hp", form.hp);
    if (form.linkedin_url) fd.append("linkedin_url", form.linkedin_url);
    fd.append("bidang_keahlian", bidang);
    // WAJIB selalu dikirim: backend menimpa is_internal dengan zero-value bool
    // kalau field ini tidak ada di request update
    fd.append("is_internal", String(form.is_internal));
    if (cv) fd.append("cv", cv);
    if (editingId != null) {
      updateMutation.mutate({ id: editingId, form: fd }, { onSuccess: onClose });
    } else {
      createMutation.mutate(fd, { onSuccess: onClose });
    }
  };

  const loading = editingId != null && detailLoading;

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingId != null ? "Edit Mentor" : "Tambah Mentor"}</DialogTitle>
          <DialogDescription>
            {editingId != null
              ? "Ubah data mentor. CV hanya terganti bila file baru dipilih."
              : "Daftarkan mentor baru."}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="m-nama">Nama</Label>
              <Input id="m-nama" value={form.nama} onChange={(e: ChangeEvent<HTMLInputElement>) => set("nama", e.target.value)} required disabled={saving} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-email">Email</Label>
              <Input id="m-email" type="email" value={form.email} onChange={(e: ChangeEvent<HTMLInputElement>) => set("email", e.target.value)} required disabled={saving} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="m-hp">HP (opsional)</Label>
                <Input id="m-hp" value={form.hp} onChange={(e: ChangeEvent<HTMLInputElement>) => set("hp", e.target.value)} disabled={saving} />
              </div>
              <div className="grid gap-2">
                <Label>Bidang keahlian</Label>
                <SearchableSelect
                  value={bidangChoice}
                  onChange={(v: string) => setBidangChoice(v)}
                  options={[
                    { id: NEW_BIDANG, name: "+ Buat bidang baru…" },
                    ...bidangOptions.map((b) => ({ id: b, name: b })),
                  ]}
                  placeholder="Pilih bidang"
                  searchPlaceholder="Cari bidang…"
                  emptyMessage="Bidang tidak ditemukan"
                  disabled={saving}
                  hideClear
                />
              </div>
            </div>
            {bidangChoice === NEW_BIDANG && (
              <div className="grid gap-2">
                <Label htmlFor="m-bidang-baru">Nama bidang baru</Label>
                <Input
                  id="m-bidang-baru"
                  placeholder="mis. Data Science"
                  value={form.bidang_keahlian}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => set("bidang_keahlian", e.target.value)}
                  required
                  disabled={saving}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="m-linkedin">LinkedIn URL (opsional)</Label>
              <Input id="m-linkedin" type="url" placeholder="https://linkedin.com/in/…" value={form.linkedin_url} onChange={(e: ChangeEvent<HTMLInputElement>) => set("linkedin_url", e.target.value)} disabled={saving} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-cv">CV (opsional, PDF)</Label>
              <FileDropzone id="m-cv" accept="application/pdf" value={cv} onChange={(f: File | null) => setCv(f)} disabled={saving} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Switch
                checked={form.is_internal}
                onCheckedChange={(v: boolean) => set("is_internal", v)}
                disabled={saving}
              />
              Mentor internal (UNDIP)
            </label>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  !bidangChoice ||
                  (bidangChoice === NEW_BIDANG && !form.bidang_keahlian.trim())
                }
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

