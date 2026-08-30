import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { Badge, Skeleton } from "@gbb/ui";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
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
  useCreatePeriode,
  useDeletePeriode,
  usePeriodeList,
  useUpdatePeriode,
} from "../hooks/usePeriode";
import type { Periode } from "../services";

const ALL_STATUS = "all";

// Bulan mulai/selesai TERKUNCI mengikuti pilihan semester — admin hanya
// mengatur tanggal (hari) dan tahun.
const SEMESTER_RANGE = {
  1: { startMonth: 1, startLabel: "Januari", startMaxDay: 31, endMonth: 6, endLabel: "Juni", endMaxDay: 30 },
  2: { startMonth: 7, startLabel: "Juli", startMaxDay: 31, endMonth: 12, endLabel: "Desember", endMaxDay: 31 },
} as const;

interface FormState {
  nama: string;
  goal: string;
  semester: 1 | 2;
  start_day: string; // angka hari sebagai string agar input bisa dikosongkan
  end_day: string;
  year: string; // satu tahun untuk mulai & selesai (periode = 1 semester)
  status: "aktif" | "selesai";
}

const EMPTY_FORM: FormState = {
  nama: "",
  goal: "",
  semester: 1,
  start_day: "1",
  end_day: "30",
  year: String(new Date().getFullYear()),
  status: "aktif",
};

const pad2 = (n: number) => String(n).padStart(2, "0");

// Input angka tanpa spinner atas-bawah bawaan browser — spinner memakan lebar
// kolom sempit sehingga angkanya terpotong
const NUM_INPUT_CLASS =
  "text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

// yyyy-mm-dd dari form; bulan diturunkan dari semester, tahun sama untuk keduanya
function composeDates(form: FormState) {
  const range = SEMESTER_RANGE[form.semester];
  return {
    start: `${form.year}-${pad2(range.startMonth)}-${pad2(Number(form.start_day))}`,
    end: `${form.year}-${pad2(range.endMonth)}-${pad2(Number(form.end_day))}`,
  };
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });

// Auto-suggest dari periode terakhir (id terbesar) sesuai wireframe:
// nama berakhiran angka di-increment, semester dibalik, lanjut ke semester
// berikutnya (sem 1 tahun sama bila terakhir Jul–Des tahun lalu, dst).
function suggestFromLast(items: Periode[]): FormState {
  if (!items.length) return EMPTY_FORM;
  const last = items.reduce((a, b) => (b.id > a.id ? b : a));
  const m = last.nama.match(/^(.*?)(\d+)\s*$/);
  const lastEndYear = Number(last.end_date.slice(0, 4));
  const nextSemester = last.semester === 1 ? 2 : 1;
  const year = last.semester === 1 ? lastEndYear : lastEndYear + 1;
  return {
    nama: m ? `${m[1]}${Number(m[2]) + 1}` : "",
    goal: "",
    semester: nextSemester,
    start_day: "1",
    end_day: String(SEMESTER_RANGE[nextSemester].endMaxDay),
    year: String(year),
    status: "aktif",
  };
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={status === "aktif" ? "default" : "outline"}
      className={status === "aktif" ? "capitalize" : "capitalize text-muted-foreground"}
    >
      {status}
    </Badge>
  );
}

function PeriodeForm({
  initial,
  saving,
  onCancel,
  onSubmit,
}: {
  initial: FormState;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (form: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [dateError, setDateError] = useState("");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const range = SEMESTER_RANGE[form.semester];

  // Ganti semester = bulan ikut pindah; hari di-clamp ke maksimum bulan baru
  const setSemester = (s: 1 | 2) =>
    setForm((prev) => {
      const r = SEMESTER_RANGE[s];
      const clamp = (v: string, max: number) => (Number(v) > max ? String(max) : v);
      return {
        ...prev,
        semester: s,
        start_day: clamp(prev.start_day, r.startMaxDay),
        end_day: clamp(prev.end_day, r.endMaxDay),
      };
    });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sd = Number(form.start_day);
    const ed = Number(form.end_day);
    if (!sd || sd < 1 || sd > range.startMaxDay) {
      setDateError(`Tanggal mulai harus 1–${range.startMaxDay} ${range.startLabel}`);
      return;
    }
    if (!ed || ed < 1 || ed > range.endMaxDay) {
      setDateError(`Tanggal selesai harus 1–${range.endMaxDay} ${range.endLabel}`);
      return;
    }
    const year = Number(form.year);
    if (!year || year < 2000 || year > 2100) {
      setDateError("Tahun harus antara 2000–2100");
      return;
    }
    setDateError("");
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="periode-nama">Nama batch</Label>
            <Input
              id="periode-nama"
              value={form.nama}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set("nama", e.target.value)}
              placeholder="mis. GBB 2026 Ganjil"
              required
              disabled={saving}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="periode-goal">Goal (opsional)</Label>
            <Input
              id="periode-goal"
              value={form.goal}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set("goal", e.target.value)}
              placeholder="Deskripsi goal periode"
              disabled={saving}
            />
          </div>
          <div className="grid gap-2">
            <Label>Semester</Label>
            <div className="flex items-center gap-6 h-9">
              {([
                { value: 1, label: "Jan–Jun" },
                { value: 2, label: "Jul–Des" },
              ] as const).map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="semester"
                    checked={form.semester === opt.value}
                    onChange={() => setSemester(opt.value)}
                    disabled={saving}
                    className="accent-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v: "aktif" | "selesai") => set("status", v)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Bulan terkunci mengikuti semester; tahun satu nilai untuk mulai &
              selesai (diedit di Mulai, tampil terkunci di Selesai). Kedua baris
              memakai template grid yang sama agar kolomnya sejajar rapi. */}
          <div className="grid gap-2">
            <Label htmlFor="periode-mulai-tgl">Mulai</Label>
            <div className="grid grid-cols-[3.5rem_1fr_4.5rem] items-center gap-2">
              <Input
                id="periode-mulai-tgl"
                type="number"
                min={1}
                max={range.startMaxDay}
                value={form.start_day}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set("start_day", e.target.value)}
                className={NUM_INPUT_CLASS}
                aria-label="Tanggal mulai"
                required
                disabled={saving}
              />
              <span className="flex h-9 items-center justify-center truncate rounded-md border bg-muted px-2 text-sm text-muted-foreground">
                {range.startLabel}
              </span>
              <Input
                type="number"
                min={2000}
                max={2100}
                value={form.year}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set("year", e.target.value)}
                className={NUM_INPUT_CLASS}
                aria-label="Tahun periode"
                required
                disabled={saving}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="periode-selesai-tgl">Selesai</Label>
            <div className="grid grid-cols-[3.5rem_1fr_4.5rem] items-center gap-2">
              <Input
                id="periode-selesai-tgl"
                type="number"
                min={1}
                max={range.endMaxDay}
                value={form.end_day}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set("end_day", e.target.value)}
                className={NUM_INPUT_CLASS}
                aria-label="Tanggal selesai"
                required
                disabled={saving}
              />
              <span className="flex h-9 items-center justify-center truncate rounded-md border bg-muted px-2 text-sm text-muted-foreground">
                {range.endLabel}
              </span>
              {/* Tahun selesai selalu sama dengan tahun mulai */}
              <span
                className="flex h-9 items-center justify-center rounded-md border bg-muted px-2 text-sm text-muted-foreground"
                title="Tahun mengikuti tanggal mulai"
              >
                {form.year || "—"}
              </span>
            </div>
          </div>
        </div>
      {dateError && <p className="text-sm text-destructive">{dateError}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Batal
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PeriodePage() {
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === "admin";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL_STATUS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  // null = form tertutup; { editing: null } = create; { editing: Periode } = edit
  const [formOpen, setFormOpen] = useState<{ editing: Periode | null; initial: FormState } | null>(
    null
  );
  const [deleting, setDeleting] = useState<Periode | null>(null);

  const { data, isLoading } = usePeriodeList({
    page,
    limit,
    search: search || undefined,
    status: status === ALL_STATUS ? undefined : status,
  });
  const createMutation = useCreatePeriode();
  const updateMutation = useUpdatePeriode();
  const deleteMutation = useDeletePeriode();
  const saving = createMutation.isPending || updateMutation.isPending;

  // Toggle status langsung dari tabel (tanpa buka dialog edit) — instance
  // mutation terpisah supaya pending state tidak tercampur dengan form dialog
  const statusMutation = useUpdatePeriode();
  const togglingId = statusMutation.isPending ? statusMutation.variables?.id : null;
  const toggleStatus = (p: Periode) => {
    statusMutation.mutate({
      id: p.id,
      body: { status: p.status === "aktif" ? "selesai" : "aktif" },
    });
  };

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  const toBody = (form: FormState) => {
    const { start, end } = composeDates(form);
    return {
      nama: form.nama,
      goal: form.goal || undefined,
      semester: form.semester,
      start_date: `${start}T00:00:00Z`,
      end_date: `${end}T00:00:00Z`,
      status: form.status,
    };
  };

  const handleSubmit = (form: FormState) => {
    if (formOpen?.editing) {
      updateMutation.mutate(
        { id: formOpen.editing.id, body: toBody(form) },
        { onSuccess: () => setFormOpen(null) }
      );
    } else {
      createMutation.mutate(toBody(form), { onSuccess: () => setFormOpen(null) });
    }
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Konfigurasi Periode</h1>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setFormOpen({ editing: null, initial: suggestFromLast(items) })}
          >
            <Plus className="size-4 mr-2" />
            Tambah
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama periode…"
            className="pl-9 w-64"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v: string) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS}>Semua Status</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="selesai">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabel */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Mulai</TableHead>
              <TableHead>Selesai</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-24 text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={isAdmin ? 6 : 5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 6 : 5}
                  className="text-center text-sm text-muted-foreground py-8"
                >
                  Tidak ada periode ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{p.nama}</div>
                    {p.goal && <div className="text-xs text-muted-foreground">{p.goal}</div>}
                  </TableCell>
                  <TableCell>{formatDate(p.start_date)}</TableCell>
                  <TableCell>{formatDate(p.end_date)}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          title={p.status === "aktif" ? "Tandai selesai" : "Aktifkan kembali"}
                          onClick={() => toggleStatus(p)}
                          disabled={togglingId === p.id}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
                        >
                          {p.status === "aktif" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          title="Edit"
                          onClick={() =>
                            // Bulan tersimpan tidak dibawa ke form — saat
                            // disimpan, bulan dinormalisasi mengikuti semester
                            setFormOpen({
                              editing: p,
                              initial: {
                                nama: p.nama,
                                goal: p.goal ?? "",
                                semester: p.semester === 2 ? 2 : 1,
                                start_day: String(Number(p.start_date.slice(8, 10))),
                                end_day: String(Number(p.end_date.slice(8, 10))),
                                year: p.start_date.slice(0, 4),
                                status: p.status === "selesai" ? "selesai" : "aktif",
                              },
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Hapus"
                          onClick={() => setDeleting(p)}
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

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>
                Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, totalItems)} dari{" "}
                {totalItems}
              </span>
              <Select
                value={String(limit)}
                onValueChange={(v: string) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                Hal {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Form tambah/edit sebagai dialog pop-up */}
      {isAdmin && (
        <Dialog
          open={!!formOpen}
          onOpenChange={(open: boolean) => {
            if (!open && !saving) setFormOpen(null);
          }}
        >
          <DialogContent className="sm:max-w-xl">
            {formOpen && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {formOpen.editing ? `Edit Periode — ${formOpen.editing.nama}` : "Tambah Periode"}
                  </DialogTitle>
                  <DialogDescription>
                    {formOpen.editing
                      ? "Ubah data periode lalu simpan."
                      : "Isi data periode baru lalu simpan."}
                  </DialogDescription>
                </DialogHeader>
                <PeriodeForm
                  key={formOpen.editing?.id ?? "create"}
                  initial={formOpen.initial}
                  saving={saving}
                  onCancel={() => setFormOpen(null)}
                  onSubmit={handleSubmit}
                />
              </>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog konfirmasi hapus */}
      <Dialog open={!!deleting} onOpenChange={(open: boolean) => !open && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Periode</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus periode <strong>{deleting?.nama}</strong>? Tindakan ini tidak
              bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Menghapus…" : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
