import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
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
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { usePeriodeOptions } from "@/domains/periode/hooks/usePeriode";
import { useEventList } from "@/domains/event/hooks/useEvent";
import { useCreatePenugasan, useUpdatePenugasan } from "../hooks/usePenugasan";
import type { Penugasan } from "../services";

const NO_EVENT = "none";

const toDatetimeParts = (iso: string) => ({
  date: iso.slice(0, 10),
  time: new Date(iso).toTimeString().slice(0, 5),
});

// Dirender kondisional oleh parent (mount ulang tiap buka → state selalu segar)
export function CreatePenugasanDialog({ onClose }: { onClose: () => void }) {
  const globalPeriode = usePeriodeFilter((s) => s.periodeId);
  const { data: periodeOptions } = usePeriodeOptions();
  const createMutation = useCreatePenugasan();

  const [periodeId, setPeriodeId] = useState(globalPeriode ?? "");
  const [eventId, setEventId] = useState(NO_EVENT);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jam, setJam] = useState("23:59");
  const [nilaiMaks, setNilaiMaks] = useState("");
  const [lampiran, setLampiran] = useState<File | null>(null);

  // Event sumber mengikuti periode terpilih
  const { data: eventOptions } = useEventList(
    periodeId ? { periode_id: periodeId, limit: 100 } : { limit: 0 }
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData();
    form.append("periode_id", periodeId);
    if (eventId !== NO_EVENT) form.append("event_id", eventId);
    form.append("judul", judul);
    form.append("deskripsi", deskripsi);
    form.append("deadline", `${tanggal}T${jam || "23:59"}:00Z`);
    if (nilaiMaks) form.append("nilai_maks", nilaiMaks); // kosong = default 100 (backend)
    if (lampiran) form.append("lampiran", lampiran);
    createMutation.mutate(form, { onSuccess: onClose });
  };

  const saving = createMutation.isPending;

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Penugasan</DialogTitle>
          <DialogDescription>
            Kode tugas di-generate otomatis setelah tersimpan. Publish memunculkan tugas ke
            semua beswan periode.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Batch/Periode</Label>
              <Select
                value={periodeId}
                onValueChange={(v: string) => {
                  setPeriodeId(v);
                  setEventId(NO_EVENT);
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
              <Label>Event sumber (opsional)</Label>
              <Select value={eventId} onValueChange={setEventId} disabled={saving || !periodeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_EVENT}>— (non-event)</SelectItem>
                  {eventOptions?.items.map((ev) => (
                    <SelectItem key={ev.id} value={String(ev.id)}>
                      {ev.kode_event} · {ev.nama_event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-judul">Judul</Label>
            <Input id="p-judul" value={judul} onChange={(e: ChangeEvent<HTMLInputElement>) => setJudul(e.target.value)} required disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-deskripsi">Soal / Deskripsi</Label>
            <Textarea id="p-deskripsi" rows={3} value={deskripsi} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDeskripsi(e.target.value)} required disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-lampiran">Lampiran soal (opsional, PDF/DOCX/PPTX)</Label>
            <Input id="p-lampiran" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(e: ChangeEvent<HTMLInputElement>) => setLampiran(e.target.files?.[0] ?? null)} disabled={saving} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-tanggal">Deadline</Label>
              <Input id="p-tanggal" type="date" value={tanggal} onChange={(e: ChangeEvent<HTMLInputElement>) => setTanggal(e.target.value)} required disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-jam">Jam</Label>
              <Input id="p-jam" type="time" value={jam} onChange={(e: ChangeEvent<HTMLInputElement>) => setJam(e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-nilai-maks">Nilai maksimum</Label>
              <Input id="p-nilai-maks" type="number" min={1} placeholder="100" value={nilaiMaks} onChange={(e: ChangeEvent<HTMLInputElement>) => setNilaiMaks(e.target.value)} disabled={saving} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving || !periodeId}>
              {saving ? "Menyimpan…" : "Publish Tugas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditPenugasanDialog({
  penugasan,
  onClose,
}: {
  penugasan: Penugasan;
  onClose: () => void;
}) {
  const updateMutation = useUpdatePenugasan();
  const parts = toDatetimeParts(penugasan.deadline);
  const [judul, setJudul] = useState(penugasan.judul);
  const [deskripsi, setDeskripsi] = useState(penugasan.deskripsi);
  const [tanggal, setTanggal] = useState(parts.date);
  const [jam, setJam] = useState(parts.time);
  const [status, setStatus] = useState(penugasan.status);
  const [lampiran, setLampiran] = useState<File | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData();
    form.append("judul", judul);
    form.append("deskripsi", deskripsi);
    form.append("deadline", `${tanggal}T${jam}:00Z`);
    form.append("status", status);
    if (lampiran) form.append("lampiran", lampiran); // replace file bila dipilih
    updateMutation.mutate({ id: penugasan.id, form }, { onSuccess: onClose });
  };

  const saving = updateMutation.isPending;

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Penugasan — {penugasan.kode_penugasan}</DialogTitle>
          <DialogDescription>
            Periode, event sumber, dan nilai maksimum tidak dapat diubah setelah dibuat.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pe-judul">Judul</Label>
            <Input id="pe-judul" value={judul} onChange={(e: ChangeEvent<HTMLInputElement>) => setJudul(e.target.value)} required disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pe-deskripsi">Soal / Deskripsi</Label>
            <Textarea id="pe-deskripsi" rows={3} value={deskripsi} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDeskripsi(e.target.value)} required disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pe-lampiran">Ganti lampiran (opsional)</Label>
            <Input id="pe-lampiran" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(e: ChangeEvent<HTMLInputElement>) => setLampiran(e.target.files?.[0] ?? null)} disabled={saving} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pe-tanggal">Deadline</Label>
              <Input id="pe-tanggal" type="date" value={tanggal} onChange={(e: ChangeEvent<HTMLInputElement>) => setTanggal(e.target.value)} required disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pe-jam">Jam</Label>
              <Input id="pe-jam" type="time" value={jam} onChange={(e: ChangeEvent<HTMLInputElement>) => setJam(e.target.value)} required disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="selesai">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
