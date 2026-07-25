import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { FileDown, Home, Linkedin, Globe, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { assetUrl } from "@/domains/beswan/services";
import { useCreateMentor, useMentorDetail, useUpdateMentor } from "../hooks/useMentor";

export function UndipBadge({ isInternal }: { isInternal: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isInternal ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}
    >
      {isInternal ? <Home className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
      {isInternal ? "UNDIP" : "non-UNDIP"}
    </span>
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
  const createMutation = useCreateMentor();
  const updateMutation = useUpdateMentor();
  const saving = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [cv, setCv] = useState<File | null>(null);
  // Prefill saat detail edit termuat / dialog dibuka ulang (adjust-during-render)
  const [prevKey, setPrevKey] = useState("");
  const key = editingId != null ? `edit-${editingId}-${detail?.id ?? "loading"}` : `create-${open}`;
  if (open && key !== prevKey) {
    setPrevKey(key);
    setCv(null);
    setForm(
      editingId != null && detail
        ? {
            nama: detail.nama,
            email: detail.email ?? "",
            hp: detail.hp ?? "",
            linkedin_url: detail.linkedin_url ?? "",
            bidang_keahlian: detail.bidang_keahlian,
            is_internal: detail.is_internal,
          }
        : EMPTY_FORM
    );
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("nama", form.nama);
    fd.append("email", form.email);
    if (form.hp) fd.append("hp", form.hp);
    if (form.linkedin_url) fd.append("linkedin_url", form.linkedin_url);
    fd.append("bidang_keahlian", form.bidang_keahlian);
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
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-nama">Nama</Label>
              <Input id="m-nama" value={form.nama} onChange={(e: ChangeEvent<HTMLInputElement>) => set("nama", e.target.value)} required disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-email">Email</Label>
              <Input id="m-email" type="email" value={form.email} onChange={(e: ChangeEvent<HTMLInputElement>) => set("email", e.target.value)} required disabled={saving} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-hp">HP (opsional)</Label>
                <Input id="m-hp" value={form.hp} onChange={(e: ChangeEvent<HTMLInputElement>) => set("hp", e.target.value)} disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-bidang">Bidang keahlian</Label>
                <Input id="m-bidang" value={form.bidang_keahlian} onChange={(e: ChangeEvent<HTMLInputElement>) => set("bidang_keahlian", e.target.value)} required disabled={saving} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-linkedin">LinkedIn URL (opsional)</Label>
              <Input id="m-linkedin" type="url" placeholder="https://linkedin.com/in/…" value={form.linkedin_url} onChange={(e: ChangeEvent<HTMLInputElement>) => set("linkedin_url", e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-cv">CV (opsional, PDF)</Label>
              <Input id="m-cv" type="file" accept="application/pdf" onChange={(e: ChangeEvent<HTMLInputElement>) => setCv(e.target.files?.[0] ?? null)} disabled={saving} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Switch
                checked={form.is_internal}
                onCheckedChange={(v: boolean) => set("is_internal", v)}
                disabled={saving}
              />
              Mentor internal (UNDIP)
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
        )}
      </DialogContent>
    </Dialog>
  );
}

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export function MentorDetailDialog({
  id,
  onClose,
  onEdit,
}: {
  id: number | null;
  onClose: () => void;
  onEdit: (id: number) => void;
}) {
  const { data: detail, isLoading } = useMentorDetail(id);
  const cv = assetUrl(detail?.cv_url);

  return (
    <Dialog open={id != null} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {isLoading || !detail ? (
          <div className="h-56 animate-pulse rounded-lg bg-muted" />
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-2 pr-6">
                <DialogTitle>{detail.nama}</DialogTitle>
                <Button variant="outline" size="sm" onClick={() => onEdit(detail.id)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              </div>
              <DialogDescription className="sr-only">Detail mentor</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{detail.bidang_keahlian}</span>
                <UndipBadge isInternal={detail.is_internal} />
                {detail.linkedin_url && (
                  <a
                    href={detail.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    LinkedIn
                  </a>
                )}
              </div>
              <div className="text-sm text-muted-foreground space-y-0.5">
                {detail.email && <div>Email: {detail.email}</div>}
                {detail.hp && <div>HP: {detail.hp}</div>}
                <div>Total event dibawakan: {detail.jumlah_event} (sepanjang masa)</div>
                <div>
                  Rating rata-rata:{" "}
                  {detail.avg_rating != null ? `★ ${detail.avg_rating.toFixed(1)}` : "belum ada rating"}
                </div>
                {cv && (
                  <a
                    href={cv}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <FileDown className="h-4 w-4" />
                    Download CV
                  </a>
                )}
              </div>
              {/* History event per mentor (avg_feedback null = belum ada feedback) */}
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold">History Event ({detail.event_history.length})</h4>
                {detail.event_history.length === 0 ? (
                  <p className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
                    Belum ada event yang dibawakan
                  </p>
                ) : (
                  <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                    {detail.event_history.map((h) => (
                      <div key={h.event_id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{h.nama_event}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {formatTanggal(h.tanggal)} · {h.peran}
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {h.avg_feedback != null ? `★ ${h.avg_feedback.toFixed(1)}` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Kutipan feedback terbaru (maks 10 dari backend) */}
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold">Feedback Terkumpul</h4>
                {(detail.feedback_kutipan ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
                    Belum ada feedback
                  </p>
                ) : (
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                    {(detail.feedback_kutipan ?? []).map((k, i) => (
                      <li key={i} className="rounded-lg bg-muted/50 px-3 py-2 text-xs italic">
                        “{k}”
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
