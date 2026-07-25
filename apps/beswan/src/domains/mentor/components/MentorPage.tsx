import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Calendar, Info, Linkedin, Search, Send, Star, Users } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@gbb/ui";
import { useMentorList, useRequestMentor } from "../hooks/useMentor";
import type { Mentor } from "../services";

const ALL_BIDANG = "all";

function RequestDialog({ mentors, initialMentorId, onClose }: {
  mentors: Mentor[];
  initialMentorId?: number;
  onClose: () => void;
}) {
  const mutation = useRequestMentor();
  const [mode, setMode] = useState<"pilih" | "curhat">(initialMentorId ? "pilih" : "pilih");
  const [mentorId, setMentorId] = useState(initialMentorId ? String(initialMentorId) : "");
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
      mode === "pilih" ? { mentor_id: Number(mentorId) } : { curhat_text: curhat.trim() },
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-start gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
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
                )}
              </div>
            </label>
            <label className="flex items-start gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
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
                  <div className="space-y-1.5">
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
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {mutation.isPending ? "Mengirim…" : "Kirim Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MentorCard({ mentor, onRequest }: { mentor: Mentor; onRequest: () => void }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium truncate" title={mentor.nama}>{mentor.nama}</div>
          <div className="text-sm text-muted-foreground truncate">{mentor.bidang_keahlian}</div>
        </div>
        {mentor.is_internal && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            🏠 Tim GBB
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {mentor.jumlah_event} event
        </span>
        {mentor.avg_rating != null ? (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {mentor.avg_rating.toFixed(1)}
          </span>
        ) : (
          <span className="text-xs">Belum ada rating</span>
        )}
        {mentor.linkedin_url && (
          <a
            href={mentor.linkedin_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Linkedin className="h-3.5 w-3.5" />
            LinkedIn
          </a>
        )}
      </div>
      <Button size="sm" variant="outline" className="mt-auto" onClick={onRequest}>
        Request 1-on-1
      </Button>
    </div>
  );
}

export function MentorPage() {
  const [search, setSearch] = useState("");
  const [bidang, setBidang] = useState(ALL_BIDANG);
  const [requestFor, setRequestFor] = useState<{ open: boolean; mentorId?: number }>({ open: false });

  const { data, isLoading } = useMentorList();
  const mentors = useMemo(() => data?.items ?? [], [data]);

  // Filter bidang diturunkan dari data ter-load (tidak ada endpoint daftar bidang)
  const bidangOptions = useMemo(
    () => [...new Set(mentors.map((m) => m.bidang_keahlian).filter(Boolean))].sort(),
    [mentors]
  );
  const q = search.trim().toLowerCase();
  const visible = mentors.filter(
    (m) =>
      (bidang === ALL_BIDANG || m.bidang_keahlian === bidang) &&
      (!q || m.nama.toLowerCase().includes(q) || m.bidang_keahlian.toLowerCase().includes(q))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Mentor</h1>
        <Button size="sm" onClick={() => setRequestFor({ open: true })}>
          <Users className="h-4 w-4 mr-2" />
          Request 1-on-1
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Kontak mentor tidak dibagikan langsung. Untuk terhubung dengan mentor, gunakan tombol
          Request 1-on-1 — Tim Program GBB yang akan menjadwalkan.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Cari mentor…"
            className="pl-9 w-64"
          />
        </div>
        <Select value={bidang} onValueChange={setBidang}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_BIDANG}>Semua Bidang</SelectItem>
            {bidangOptions.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Tidak ada mentor ditemukan</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((m) => (
            <MentorCard
              key={m.id}
              mentor={m}
              onRequest={() => setRequestFor({ open: true, mentorId: m.id })}
            />
          ))}
        </div>
      )}

      {requestFor.open && (
        <RequestDialog
          mentors={mentors}
          initialMentorId={requestFor.mentorId}
          onClose={() => setRequestFor({ open: false })}
        />
      )}
    </div>
  );
}
