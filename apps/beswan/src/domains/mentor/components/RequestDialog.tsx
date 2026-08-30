import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Send } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@gbb/ui";
import { useRequestMentor } from "../hooks/useMentor";
import type { Mentor } from "../services";

// Dialog request 1-on-1 — dipakai tab Daftar Mentor & tab Request Mentor
export function RequestDialog({
  mentors,
  initialMentorId,
  onClose,
}: {
  mentors: Mentor[];
  initialMentorId?: number;
  onClose: () => void;
}) {
  const mutation = useRequestMentor();
  const [mode, setMode] = useState<"pilih" | "curhat">(initialMentorId ? "pilih" : "pilih");
  const [mentorId, setMentorId] = useState(initialMentorId ? String(initialMentorId) : "");
  // Note pendamping saat request mentor spesifik — dikirim sebagai curhat_text
  // (backend menerima mentor_id + curhat_text bersamaan) supaya tim GBB punya
  // konteks saat matching/menjadwalkan
  const [note, setNote] = useState("");
  const [curhat, setCurhat] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // FE wajib validasi: salah satu mode harus terisi (backend menerima keduanya opsional)
    if (mode === "pilih" && !mentorId) {
      setValidationError("Pilih mentor terlebih dahulu");
      return;
    }
    if (mode === "curhat" && !curhat.trim()) {
      setValidationError("Ceritakan dulu kebutuhanmu agar tim GBB bisa memilihkan mentor");
      return;
    }
    setValidationError("");
    mutation.mutate(
      mode === "pilih"
        ? { mentor_id: Number(mentorId), curhat_text: note.trim() || undefined }
        : { curhat_text: curhat.trim() },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Sesi 1-on-1</DialogTitle>
          <DialogDescription>
            Tim GBB akan menghubungkanmu dengan mentor sesuai kebutuhanmu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors has-checked:border-primary">
              <input
                type="radio"
                name="req-mode"
                className="mt-1"
                checked={mode === "pilih"}
                onChange={() => setMode("pilih")}
              />
              <div className="flex-1 space-y-2">
                <div className="text-sm font-medium">Saya sudah tahu mentor yang saya mau</div>
                {mode === "pilih" && (
                  <>
                    <Select value={mentorId} onValueChange={setMentorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih mentor…" />
                      </SelectTrigger>
                      <SelectContent>
                        {mentors.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.nama} — {m.bidang_keahlian}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid gap-2">
                      <Label htmlFor="req-note" className="text-xs text-muted-foreground">
                        Note untuk tim GBB (opsional)
                      </Label>
                      <Textarea
                        id="req-note"
                        rows={3}
                        value={note}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                        placeholder="mis. topik yang ingin didiskusikan, preferensi jadwal…"
                      />
                    </div>
                  </>
                )}
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors has-checked:border-primary">
              <input
                type="radio"
                name="req-mode"
                className="mt-1"
                checked={mode === "curhat"}
                onChange={() => setMode("curhat")}
              />
              <div className="flex-1 space-y-2">
                <div className="text-sm font-medium">
                  Saya butuh mentor, tapi belum tahu siapa — bantu pilihkan
                </div>
                {mode === "curhat" && (
                  <div className="grid gap-2">
                    <Label htmlFor="req-curhat" className="sr-only">Ceritakan kebutuhanmu</Label>
                    <Textarea
                      id="req-curhat"
                      rows={4}
                      value={curhat}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCurhat(e.target.value)}
                      placeholder="Ceritakan apa yang sedang kamu hadapi / ingin didiskusikan…"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>
          {validationError && <p className="text-sm text-destructive">{validationError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <Send className="size-4" />
              {mutation.isPending ? "Mengirim…" : "Kirim Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
