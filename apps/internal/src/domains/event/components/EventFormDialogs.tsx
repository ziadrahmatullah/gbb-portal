import { useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { ChevronDown, Plus, Search, X } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { DateInput, SearchableSelect } from "@gbb/ui";
import { useCreateEvent, useUpdateEvent } from "../hooks/useEvent";
import type { AssignMentorReq, EventItem } from "../services";

const NO_TOPIK = "none";
const PERAN_OPTIONS = ["speaker", "moderator", "fasilitator"] as const;

const KAPASITAS_HINT =
  "0/kosong = event terbuka tanpa pendaftaran; >0 = beswan harus join, kuota siapa cepat";

// Kotak pencarian di dalam DropdownMenuContent. stopPropagation di keydown
// wajib: tanpa itu ketikan dicegat typeahead/navigasi menu Radix.
function DropdownSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="p-1 pb-1.5">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={value}
          placeholder={placeholder}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
          className="h-8 pl-8"
        />
      </div>
    </div>
  );
}

// Multi-select periode dengan URUTAN pilihan dipertahankan — elemen pertama
// menjadi periode utama event (menentukan topik & selalu disertakan backend).
// Dipakai form create DAN edit supaya cukup satu field periode.
function PeriodeMultiSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: { id: number; nama: string }[];
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const visible = search
    ? options.filter((p) => p.nama.toLowerCase().includes(search.toLowerCase()))
    : options;
  const first = options.find((p) => String(p.id) === value[0]);
  const label =
    value.length === 0
      ? "Pilih periode"
      : `${first?.nama ?? value[0]}${value.length > 1 ? ` +${value.length - 1}` : ""}`;
  return (
    // modal={false}: di dalam Dialog, dropdown modal membuat klik di luar menu
    // dianggap klik di luar dialog → dialognya ikut tertutup
    <DropdownMenu modal={false} onOpenChange={(o: boolean) => !o && setSearch("")}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button type="button" variant="outline" className="w-full justify-between font-normal">
          <span className={cn("truncate", value.length === 0 && "text-muted-foreground")}>
            {label}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownSearchInput value={search} onChange={setSearch} placeholder="Cari periode…" />
        <div className="max-h-60 overflow-auto">
          {visible.length === 0 && (
            <div className="py-3 text-center text-sm text-muted-foreground">
              Periode tidak ditemukan
            </div>
          )}
          {visible.map((p) => {
            const id = String(p.id);
            return (
              <DropdownMenuCheckboxItem
                key={p.id}
                checked={value.includes(id)}
                // preventDefault: menu jangan menutup tiap kali centang
                onSelect={(e: Event) => e.preventDefault()}
                onCheckedChange={(c: boolean) =>
                  onChange(c ? [...value, id] : value.filter((v) => v !== id))
                }
              >
                {p.nama}
                {value[0] === id && (
                  <span className="ml-1 text-xs text-muted-foreground">(utama)</span>
                )}
              </DropdownMenuCheckboxItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface MentorRow {
  mentor_id: string;
  peran: AssignMentorReq["peran"];
}

export function CreateEventWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const globalPeriode = usePeriodeFilter((s) => s.periodeId);
  const { data: periodeOptions } = usePeriodeOptions();
  const { data: mentorOptions } = useMentorOptions();
  const createMutation = useCreateEvent();

  // Satu field periode multi-select; urutan pilih dipertahankan, elemen
  // PERTAMA = periode utama (periode_id di payload)
  const [periodeIds, setPeriodeIds] = useState<string[]>(globalPeriode ? [globalPeriode] : []);
  const periodeId = periodeIds[0] ?? "";
  const [topikId, setTopikId] = useState(NO_TOPIK);
  const handlePeriodeChange = (v: string[]) => {
    // Periode utama berganti → topik lama tidak valid lagi
    if (v[0] !== periodeIds[0]) setTopikId(NO_TOPIK);
    setPeriodeIds(v);
  };
  const [form, setForm] = useState({
    nama_event: "",
    tipe: "talkshow",
    tipe_lain: "",
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
        periode_ids: periodeIds.map(Number),
        topik_id: topikId === NO_TOPIK ? undefined : Number(topikId),
        nama_event: form.nama_event,
        tipe: form.tipe,
        // Label kustom hanya bermakna untuk tipe "other" (FEpromt29)
        tipe_lain:
          form.tipe === "other" && form.tipe_lain.trim() ? form.tipe_lain.trim() : undefined,
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Event</DialogTitle>
          <DialogDescription>
            Kode event di-generate otomatis. Pilih topik untuk event kurikulum, kosongkan untuk
            non-kurikulum.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Periode</Label>
              <PeriodeMultiSelect
                value={periodeIds}
                onChange={handlePeriodeChange}
                options={periodeOptions?.items ?? []}
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label>Topik kurikulum (opsional)</Label>
              {/* Tetap bisa dibuka walau periode belum dipilih — sebelumnya
                  disabled diam-diam dan dilaporkan PCM sebagai "tidak bisa
                  diklik". Tanpa periode: daftar kosong + pesan alasannya. */}
              <SearchableSelect
                value={topikId}
                onChange={(v: string) => setTopikId(v || NO_TOPIK)}
                options={
                  periodeId
                    ? [
                        { id: NO_TOPIK, name: "— (non-kurikulum)" },
                        ...(topikOptions?.items ?? []).map((t) => ({
                          id: String(t.id),
                          name: `${t.urutan}. ${t.judul}`,
                        })),
                      ]
                    : []
                }
                placeholder={periodeId ? "— (non-kurikulum)" : "Pilih periode dulu"}
                searchPlaceholder="Cari topik…"
                emptyMessage={
                  periodeId
                    ? "Topik tidak ditemukan"
                    : "Pilih periode di sebelah kiri dulu — daftar topik mengikuti periode utama"
                }
                disabled={saving}
                hideClear
              />
            </div>
          </div>
          {/* Di luar sel grid supaya kedua kontrol di atas tetap sejajar */}
          <p className="-mt-2 text-xs text-muted-foreground">
            Periode bisa dipilih lebih dari satu — pilihan pertama jadi periode utama (menentukan
            topik).
          </p>
          <div className="grid gap-2">
            <Label htmlFor="e-nama">Nama event</Label>
            <Input id="e-nama" value={form.nama_event} onChange={set("nama_event")} required disabled={saving} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
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
            <div className="grid gap-2">
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
          {/* Tipe "Other": nama tipe bebas (opsional) — masukan PCM Sep 2026 */}
          {form.tipe === "other" && (
            <div className="grid gap-2">
              <Label htmlFor="e-tipe-lain">Nama tipe kustom (opsional)</Label>
              <Input
                id="e-tipe-lain"
                value={form.tipe_lain}
                onChange={set("tipe_lain")}
                placeholder="mis. Sharing Session, Bootcamp"
                maxLength={50}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Menggantikan label “Other” di daftar event &amp; portal beswan. Kosongkan bila
                tidak perlu.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="col-span-2 grid gap-2 lg:col-span-1">
              <Label htmlFor="e-tanggal">Tanggal</Label>
              <DateInput id="e-tanggal" value={form.tanggal} onChange={set("tanggal")} required disabled={saving} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="e-mulai">Jam mulai</Label>
              <Input id="e-mulai" type="time" value={form.jam_mulai} onChange={set("jam_mulai")} disabled={saving} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="e-selesai">Jam selesai</Label>
              <Input id="e-selesai" type="time" value={form.jam_selesai} onChange={set("jam_selesai")} disabled={saving} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="e-kapasitas">Kapasitas</Label>
              <Input id="e-kapasitas" type="number" min={0} value={form.kapasitas} onChange={set("kapasitas")} disabled={saving} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">Kapasitas: {KAPASITAS_HINT}.</p>
          <div className="grid gap-2">
            <Label htmlFor="e-lokasi">Lokasi / Link</Label>
            <Input id="e-lokasi" value={form.lokasi} onChange={set("lokasi")} placeholder="mis. Zoom Meeting / Aula Kampus" disabled={saving} />
          </div>
          <div className="grid gap-2">
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
                <div className="flex-1">
                  <SearchableSelect
                    value={row.mentor_id}
                    onChange={(v: string) => setMentorRow(i, { mentor_id: v })}
                    options={(mentorOptions?.items ?? [])
                      .filter((m) => m.id === Number(row.mentor_id) || !mentors.some((r) => r.mentor_id === String(m.id)))
                      .map((m) => ({ id: String(m.id), name: `${m.nama} — ${m.bidang_keahlian}` }))}
                    placeholder="Pilih mentor"
                    searchPlaceholder="Cari mentor…"
                    emptyMessage="Mentor tidak ditemukan"
                    disabled={saving}
                    hideClear
                  />
                </div>
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

          <DialogFooter className="pt-2">
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
  const { data: mentorOptions } = useMentorOptions();
  const { data: periodeOptions } = usePeriodeOptions();
  const [form, setForm] = useState({
    nama_event: "",
    tipe: "",
    tipe_lain: "",
    format: "",
    lokasi: "",
    tanggal: "",
    jam_mulai: "",
    jam_selesai: "",
    deskripsi: "",
    kapasitas: "",
  });
  const [mentors, setMentors] = useState<MentorRow[]>([]);
  // Satu field periode multi-select (sama seperti create): urutan pilih
  // dipertahankan, elemen PERTAMA = periode utama. periode_id/periode_ids
  // dikirim ke payload hanya bila berubah dari nilai awal event.
  const [periodeIds, setPeriodeIds] = useState<string[]>([]);
  const periodeId = periodeIds[0] ?? "";
  // Topik event; opsi mengikuti periode utama yang SEDANG dipilih di form ini
  const [topikId, setTopikId] = useState(NO_TOPIK);
  const { data: topikOptions } = useTopikList(
    periodeId ? { periode_id: periodeId, limit: 100 } : { limit: 0 }
  );
  const handlePeriodeChange = (v: string[]) => {
    // Periode utama berganti → topik lama tidak valid lagi
    if (v[0] !== periodeIds[0]) setTopikId(NO_TOPIK);
    setPeriodeIds(v);
    updateMutation.reset();
  };
  // Roster mentor cuma disertakan di payload PUT kalau memang disentuh user —
  // backend mengganti SELURUH roster begitu key "mentors" ada di body (lihat
  // catatan di UpdateEventReq), jadi edit lain (nama/tanggal/dst) tidak boleh
  // ikut mengosongkan/mengubah mentor kalau tidak dimaksudkan.
  const [mentorsTouched, setMentorsTouched] = useState(false);
  const [prevId, setPrevId] = useState<number | null>(null);
  if (event && event.id !== prevId) {
    setPrevId(event.id);
    setPeriodeIds([
      String(event.periode_id),
      ...(event.periode_ids ?? []).filter((pid) => pid !== event.periode_id).map(String),
    ]);
    setTopikId(event.topik_id ? String(event.topik_id) : NO_TOPIK);
    setForm({
      nama_event: event.nama_event,
      tipe: event.tipe,
      tipe_lain: event.tipe_lain ?? "",
      format: event.format,
      lokasi: event.lokasi ?? "",
      tanggal: event.tanggal.slice(0, 10),
      jam_mulai: event.jam_mulai ?? "",
      jam_selesai: event.jam_selesai ?? "",
      deskripsi: event.deskripsi ?? "",
      kapasitas: event.kapasitas > 0 ? String(event.kapasitas) : "",
    });
    setMentors(
      (event.mentors ?? []).map((m) => ({
        mentor_id: String(m.mentor_id),
        peran: m.peran as MentorRow["peran"],
      }))
    );
    setMentorsTouched(false);
  }

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const setMentorRow = (i: number, patch: Partial<MentorRow>) => {
    setMentorsTouched(true);
    setMentors((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  };
  const addMentorRow = () => {
    setMentorsTouched(true);
    setMentors((prev) => [...prev, { mentor_id: "", peran: "speaker" }]);
  };
  const removeMentorRow = (i: number) => {
    setMentorsTouched(true);
    setMentors((prev) => prev.filter((_, idx) => idx !== i));
  };

  const periodeChanged = !!event && !!periodeId && periodeId !== String(event.periode_id);
  // Nilai awal topik (NO_TOPIK = non-kurikulum); topik_id dikirim hanya bila berubah
  const initialTopik = event?.topik_id ? String(event.topik_id) : NO_TOPIK;
  const topikChanged = !!event && topikId !== initialTopik;
  // periode_ids dikirim = ganti SELURUH daftar — kirim hanya bila daftar
  // (atau periode utamanya) benar-benar berubah
  const initialList = [
    ...new Set([event?.periode_id ?? 0, ...(event?.periode_ids ?? [])]),
  ]
    .sort((a, b) => a - b)
    .join(",");
  const currentList = [...new Set(periodeIds.map(Number))].sort((a, b) => a - b).join(",");
  const pesertaChanged = !!event && (periodeChanged || initialList !== currentList);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) return;
    const filledMentors = mentors.filter((m) => m.mentor_id);
    updateMutation.mutate(
      {
        id: event.id,
        body: {
          // periode_id hanya dikirim bila berubah — tidak dikirim = tidak diubah
          ...(periodeChanged ? { periode_id: Number(periodeId) } : {}),
          // topik_id: 0 = lepas tautan; pindah periode tanpa topik baru pun
          // otomatis dilepas backend, jadi aman
          ...(topikChanged ? { topik_id: topikId === NO_TOPIK ? 0 : Number(topikId) } : {}),
          ...(pesertaChanged ? { periode_ids: periodeIds.map(Number) } : {}),
          nama_event: form.nama_event,
          tipe: form.tipe,
          // Dikirim selalu saat "other" (termasuk "" = kosongkan; BE pakai *string,
          // FEpromt29). Tipe lain → backend mengosongkan tipe_lain sendiri.
          ...(form.tipe === "other" ? { tipe_lain: form.tipe_lain.trim() } : {}),
          format: form.format,
          lokasi: form.lokasi || undefined,
          tanggal: `${form.tanggal}T00:00:00Z`,
          jam_mulai: form.jam_mulai || undefined,
          jam_selesai: form.jam_selesai || undefined,
          deskripsi: form.deskripsi || undefined, // kosong = tidak diubah
          kapasitas: form.kapasitas ? Number(form.kapasitas) : undefined,
          ...(mentorsTouched
            ? { mentors: filledMentors.map((m) => ({ mentor_id: Number(m.mentor_id), peran: m.peran })) }
            : {}),
        },
      },
      { onSuccess: onClose }
    );
  };

  const saving = updateMutation.isPending;

  return (
    <Dialog open={!!event} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event{event ? ` — ${event.kode_event}` : ""}</DialogTitle>
          <DialogDescription>
            Topik harus milik periode event; memindah periode melepas tautan topik lama. Kode
            event tidak berubah.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Periode</Label>
              <PeriodeMultiSelect
                value={periodeIds}
                onChange={handlePeriodeChange}
                options={periodeOptions?.items ?? []}
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label>Topik</Label>
              <SearchableSelect
                value={topikId}
                onChange={(v: string) => {
                  setTopikId(v || NO_TOPIK);
                  updateMutation.reset();
                }}
                options={[
                  { id: NO_TOPIK, name: "Tanpa Topik (non-kurikulum)" },
                  ...(topikOptions?.items ?? []).map((t) => ({
                    id: String(t.id),
                    name: `${t.urutan}. ${t.judul}`,
                  })),
                ]}
                placeholder="Tanpa Topik (non-kurikulum)"
                searchPlaceholder="Cari topik…"
                emptyMessage="Topik tidak ditemukan"
                disabled={saving || !periodeId}
                hideClear
              />
            </div>
          </div>
          {/* Di luar sel grid supaya kedua kontrol di atas tetap sejajar */}
          <p className="-mt-2 text-xs text-muted-foreground">
            Periode bisa dipilih lebih dari satu — pilihan pertama jadi periode utama (menentukan
            topik).
          </p>
          {periodeChanged && (
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Memindah periode utama akan melepas tautan topik event ini — Anda bisa langsung
              memilih topik baru dari periode tujuan di dropdown Topik.
            </p>
          )}
          {/* Pesan 400/404 backend, mis. "topik bukan milik periode event ini" */}
          {updateMutation.error && (
            <p className="text-sm text-destructive">{updateMutation.error.message}</p>
          )}
          <div className="grid gap-2">
            <Label htmlFor="ee-nama">Nama event</Label>
            <Input id="ee-nama" value={form.nama_event} onChange={set("nama_event")} required disabled={saving} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
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
            <div className="grid gap-2">
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
          {form.tipe === "other" && (
            <div className="grid gap-2">
              <Label htmlFor="ee-tipe-lain">Nama tipe kustom (opsional)</Label>
              <Input
                id="ee-tipe-lain"
                value={form.tipe_lain}
                onChange={set("tipe_lain")}
                placeholder="mis. Sharing Session, Bootcamp"
                maxLength={50}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Menggantikan label “Other” di daftar event &amp; portal beswan. Kosongkan bila
                tidak perlu.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="col-span-2 grid gap-2 lg:col-span-1">
              <Label htmlFor="ee-tanggal">Tanggal</Label>
              <DateInput id="ee-tanggal" value={form.tanggal} onChange={set("tanggal")} required disabled={saving} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ee-mulai">Jam mulai</Label>
              <Input id="ee-mulai" type="time" value={form.jam_mulai} onChange={set("jam_mulai")} disabled={saving} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ee-selesai">Jam selesai</Label>
              <Input id="ee-selesai" type="time" value={form.jam_selesai} onChange={set("jam_selesai")} disabled={saving} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ee-kapasitas">Kapasitas</Label>
              <Input id="ee-kapasitas" type="number" min={0} value={form.kapasitas} onChange={set("kapasitas")} disabled={saving} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">Kapasitas: {KAPASITAS_HINT}.</p>
          <div className="grid gap-2">
            <Label htmlFor="ee-lokasi">Lokasi / Link</Label>
            <Input id="ee-lokasi" value={form.lokasi} onChange={set("lokasi")} disabled={saving} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ee-deskripsi">Deskripsi</Label>
            <Textarea id="ee-deskripsi" rows={2} value={form.deskripsi} onChange={set("deskripsi")} disabled={saving} />
            {/* PUT partial: string kosong dilewati backend, jadi deskripsi tidak bisa dikosongkan */}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Mentor</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMentorRow} disabled={saving}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Tambah Mentor
              </Button>
            </div>
            {mentors.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada mentor di event ini.</p>
            )}
            {mentors.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    value={row.mentor_id}
                    onChange={(v: string) => setMentorRow(i, { mentor_id: v })}
                    options={(mentorOptions?.items ?? [])
                      .filter((m) => m.id === Number(row.mentor_id) || !mentors.some((r) => r.mentor_id === String(m.id)))
                      .map((m) => ({ id: String(m.id), name: `${m.nama} — ${m.bidang_keahlian}` }))}
                    placeholder="Pilih mentor"
                    searchPlaceholder="Cari mentor…"
                    emptyMessage="Mentor tidak ditemukan"
                    disabled={saving}
                    hideClear
                  />
                </div>
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
                  onClick={() => removeMentorRow(i)}
                  disabled={saving}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving || periodeIds.length === 0}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
