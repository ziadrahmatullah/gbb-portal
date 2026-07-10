import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { usePeriodeOptions } from "@/domains/periode/hooks/usePeriode";
import { useTopikList } from "@/domains/kurikulum/hooks/useKurikulum";
import { useMentorOptions } from "@/domains/mentor/hooks/useMentor";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
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
import { useCreateEvent, useUpdateEvent } from "../hooks/useEvent";
import type { AssignMentorReq, EventItem } from "../services";

const NO_TOPIK = "none";
const PERAN_OPTIONS = ["speaker", "moderator", "fasilitator"] as const;

interface MentorRow {
  mentor_id: string;
  peran: AssignMentorReq["peran"];
}

export function CreateEventWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const globalPeriode = usePeriodeFilter((s) => s.periodeId);
  const { data: periodeOptions } = usePeriodeOptions();
  const { data: mentorOptions } = useMentorOptions();
  const createMutation = useCreateEvent();

  const [periodeId, setPeriodeId] = useState(globalPeriode ?? "");
  const [topikId, setTopikId] = useState(NO_TOPIK);
  const [form, setForm] = useState({
    nama_event: "",
    tipe: "talkshow",
    format: "online",
    tanggal: "",
    jam_mulai: "",
    jam_selesai: "",
    kapasitas: "",
    lokasi: "",
    deskripsi: "",
  });
  const [mentors, setMentors] = useState<MentorRow[]>([{ mentor_id: "", peran: "speaker" }]);
  const [mentorError, setMentorError] = useState("");

  // Topik mengikuti periode terpilih (pilih topik = event kurikulum; kosong = non-kurikulum)
  const { data: topikOptions } = useTopikList(
    periodeId ? { periode_id: periodeId, limit: 100 } : { limit: 0 }
  );

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const setMentorRow = (i: number, patch: Partial<MentorRow>) =>
    setMentors((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const filled = mentors.filter((m) => m.mentor_id);
    if (filled.length === 0) {
      setMentorError("Minimal 1 mentor harus dipilih");
      return;
    }
    setMentorError("");
    createMutation.mutate(
      {
        periode_id: Number(periodeId),
        topik_id: topikId === NO_TOPIK ? undefined : Number(topikId),
        nama_event: form.nama_event,
        tipe: form.tipe,
        format: form.format,
        lokasi: form.lokasi || undefined,
        tanggal: `${form.tanggal}T00:00:00Z`,
        jam_mulai: form.jam_mulai || undefined,
        jam_selesai: form.jam_selesai || undefined,
        deskripsi: form.deskripsi || undefined,
        kapasitas: form.kapasitas ? Number(form.kapasitas) : undefined,
        mentors: filled.map((m) => ({ mentor_id: Number(m.mentor_id), peran: m.peran })),
      },
      { onSuccess: onClose }
    );
  };

  const saving = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Event</DialogTitle>
          <DialogDescription>
            Kode event di-generate otomatis. Pilih topik untuk event kurikulum, kosongkan untuk
            non-kurikulum.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Periode</Label>
              <Select
                value={periodeId}
                onValueChange={(v: string) => {
                  setPeriodeId(v);
                  setTopikId(NO_TOPIK);
                }}
                disabled={saving}
              >
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
            <div className="space-y-1.5">
              <Label>Topik kurikulum (opsional)</Label>
              <Select
                value={topikId}
                onValueChange={setTopikId}
                disabled={saving || !periodeId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TOPIK}>— (non-kurikulum)</SelectItem>
                  {topikOptions?.items.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.urutan}. {t.judul}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-nama">Nama event</Label>
            <Input id="e-nama" value={form.nama_event} onChange={set("nama_event")} required disabled={saving} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipe</Label>
              <Select value={form.tipe} onValueChange={(v: string) => setForm((p) => ({ ...p, tipe: v }))} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="talkshow">Talkshow</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Format</Label>
              <Select value={form.format} onValueChange={(v: string) => setForm((p) => ({ ...p, format: v }))} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5 col-span-2 lg:col-span-1">
              <Label htmlFor="e-tanggal">Tanggal</Label>
              <Input id="e-tanggal" type="date" value={form.tanggal} onChange={set("tanggal")} required disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-mulai">Jam mulai</Label>
              <Input id="e-mulai" type="time" value={form.jam_mulai} onChange={set("jam_mulai")} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-selesai">Jam selesai</Label>
              <Input id="e-selesai" type="time" value={form.jam_selesai} onChange={set("jam_selesai")} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-kapasitas">Kapasitas</Label>
              <Input id="e-kapasitas" type="number" min={0} value={form.kapasitas} onChange={set("kapasitas")} disabled={saving} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-lokasi">Lokasi / Link</Label>
            <Input id="e-lokasi" value={form.lokasi} onChange={set("lokasi")} placeholder="mis. Zoom Meeting / Aula Kampus" disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-deskripsi">Deskripsi (opsional)</Label>
            <Textarea id="e-deskripsi" rows={2} value={form.deskripsi} onChange={set("deskripsi")} disabled={saving} />
          </div>

          {/* Mentor (≥1) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Mentor (minimal 1)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMentors((prev) => [...prev, { mentor_id: "", peran: "speaker" }])}
                disabled={saving}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Tambah Mentor
              </Button>
            </div>
            {mentors.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={row.mentor_id}
                  onValueChange={(v: string) => setMentorRow(i, { mentor_id: v })}
                  disabled={saving}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Pilih mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentorOptions?.items
                      .filter((m) => m.id === Number(row.mentor_id) || !mentors.some((r) => r.mentor_id === String(m.id)))
                      .map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.nama} — {m.bidang_keahlian}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Select
                  value={row.peran}
                  onValueChange={(v: MentorRow["peran"]) => setMentorRow(i, { peran: v })}
                  disabled={saving}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERAN_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  title="Hapus baris"
                  onClick={() => setMentors((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={saving || mentors.length === 1}
                  className={cn(
                    "p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors",
                    mentors.length === 1 && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {mentorError && <p className="text-sm text-destructive">{mentorError}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving || !periodeId}>
              {saving ? "Menyimpan…" : "Simpan Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditEventDialog({ event, onClose }: { event: EventItem | null; onClose: () => void }) {
  const updateMutation = useUpdateEvent();
  const [form, setForm] = useState({
    nama_event: "",
    tipe: "",
    format: "",
    lokasi: "",
    tanggal: "",
    jam_mulai: "",
    jam_selesai: "",
    deskripsi: "",
  });
  const [prevId, setPrevId] = useState<number | null>(null);
  if (event && event.id !== prevId) {
    setPrevId(event.id);
    setForm({
      nama_event: event.nama_event,
      tipe: event.tipe,
      format: event.format,
      lokasi: event.lokasi ?? "",
      tanggal: event.tanggal.slice(0, 10),
      jam_mulai: event.jam_mulai ?? "",
      jam_selesai: event.jam_selesai ?? "",
      deskripsi: "", // nilai tersimpan tidak bisa dibaca (EventRes tanpa deskripsi)
    });
  }

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) return;
    updateMutation.mutate(
      {
        id: event.id,
        body: {
          nama_event: form.nama_event,
          tipe: form.tipe,
          format: form.format,
          lokasi: form.lokasi || undefined,
          tanggal: `${form.tanggal}T00:00:00Z`,
          jam_mulai: form.jam_mulai || undefined,
          jam_selesai: form.jam_selesai || undefined,
          deskripsi: form.deskripsi || undefined, // kosong = tidak diubah
        },
      },
      { onSuccess: onClose }
    );
  };

  const saving = updateMutation.isPending;

  return (
    <Dialog open={!!event} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event{event ? ` — ${event.kode_event}` : ""}</DialogTitle>
          <DialogDescription>
            Mentor, topik, dan kapasitas tidak dapat diubah lewat edit (belum didukung backend).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ee-nama">Nama event</Label>
            <Input id="ee-nama" value={form.nama_event} onChange={set("nama_event")} required disabled={saving} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipe</Label>
              <Select value={form.tipe} onValueChange={(v: string) => setForm((p) => ({ ...p, tipe: v }))} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="talkshow">Talkshow</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Format</Label>
              <Select value={form.format} onValueChange={(v: string) => setForm((p) => ({ ...p, format: v }))} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ee-tanggal">Tanggal</Label>
              <Input id="ee-tanggal" type="date" value={form.tanggal} onChange={set("tanggal")} required disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ee-mulai">Jam mulai</Label>
              <Input id="ee-mulai" type="time" value={form.jam_mulai} onChange={set("jam_mulai")} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ee-selesai">Jam selesai</Label>
              <Input id="ee-selesai" type="time" value={form.jam_selesai} onChange={set("jam_selesai")} disabled={saving} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ee-lokasi">Lokasi / Link</Label>
            <Input id="ee-lokasi" value={form.lokasi} onChange={set("lokasi")} disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ee-deskripsi">Deskripsi</Label>
            <Textarea id="ee-deskripsi" rows={2} value={form.deskripsi} onChange={set("deskripsi")} placeholder="Kosongkan bila tidak ingin mengubah" disabled={saving} />
            <p className="text-xs text-muted-foreground">
              Nilai deskripsi tersimpan belum bisa dibaca dari backend — kosong = tidak diubah.
            </p>
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
