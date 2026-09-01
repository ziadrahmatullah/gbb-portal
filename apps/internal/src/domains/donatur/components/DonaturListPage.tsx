import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Search,
  Square,
  SquareCheck,
  SquareX,
  Tag as TagIcon,
  Users,
} from "lucide-react";
import { Badge, Skeleton } from "@gbb/ui";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { useColumnWindow } from "@/shared/hooks/useColumnWindow";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { usePeriodeOptions } from "@/domains/periode/hooks/usePeriode";
import { StatCard } from "@/shared/components/StatCard";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
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
  useAssignPeriode,
  useCreateDonatur,
  useDonaturList,
  useDonaturStats,
  useRemovePeriode,
} from "../hooks/useDonatur";
import { SKEMA_OPTIONS, skemaLabel, tagMeta } from "../services";
import type { Donatur } from "../services";
import { CreateDonaturDialog, EditDonaturDialog, ResetPasswordDialog, TagDialog } from "./DonaturDialogs";

const ALL = "all";
// Kolom periode tumbuh terus tiap semester — tampilkan sepotong saja lalu
// geser dengan panah, supaya kolom identitas (nama/kode/skema) dan aksi tidak
// terdorong keluar layar. Panah baru muncul kalau periodenya memang lebih
// banyak dari window ini, jadi jangan set sebesar jumlah periode saat ini.
const PERIODE_WINDOW = 4;

function DonaturNameCell({ donatur }: { donatur: Donatur }) {
  const tags = donatur.tags ?? [];
  return (
    <div>
      <div className="font-medium flex items-center gap-1.5">
        {donatur.nama}
        {tags.map((t) => {
          const m = tagMeta(t);
          return m ? (
            <span key={t} title={m.label} className="text-sm">
              {m.icon}
            </span>
          ) : null;
        })}
      </div>
      <div className="text-xs text-muted-foreground">{donatur.email}</div>
    </div>
  );
}

// Sel matriks: sekali klik memutar status keikutsertaan.
//   belum diassign → aktif → tidak aktif → belum diassign
// "aktif"/"tidak aktif" adalah upsert baris donatur_periode (POST), sedangkan
// kembali ke "belum diassign" menghapus barisnya (DELETE) — dua endpoint beda
// yang memang sudah disediakan backend.
function PeriodeCell({
  status,
  editable,
  busy,
  onClick,
}: {
  status?: string;
  editable: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  const view =
    status === "aktif"
      ? { Icon: SquareCheck, cls: "text-primary", label: "Aktif", next: "set Tidak Aktif" }
      : status === "tidak_aktif"
        ? { Icon: SquareX, cls: "text-destructive", label: "Tidak aktif", next: "hapus assignment" }
        : { Icon: Square, cls: "text-muted-foreground/40", label: "Belum diassign", next: "set Aktif" };
  const Icon = busy ? Loader2 : view.Icon;

  if (!editable) {
    return (
      <span title={view.label} className={cn("inline-flex", view.cls)}>
        <Icon className="h-4 w-4" />
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={`${view.label} — klik untuk ${view.next}`}
      aria-label={`${view.label}. Klik untuk ${view.next}`}
      className={cn(
        "inline-flex rounded p-1 transition-colors hover:bg-accent disabled:cursor-wait",
        busy ? "text-muted-foreground" : view.cls
      )}
    >
      <Icon className={cn("h-4 w-4", busy && "animate-spin")} />
    </button>
  );
}

export function DonaturListPage() {
  const role = useAuthStore((s) => s.role);
  const canMutate = role === "admin" || role === "anc";

  const globalPeriode = usePeriodeFilter((s) => s.periodeId) ?? undefined;
  const { data: periodeData } = usePeriodeOptions();
  // Urutkan sendiri secara kronologis — daftar dari backend tidak dijamin urut,
  // dan window default menempel ke periode terbaru (paling sering dipakai)
  const periodeColumns = useMemo(
    () =>
      [...(periodeData?.items ?? [])].sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [periodeData]
  );
  const win = useColumnWindow(periodeColumns.length, PERIODE_WINDOW);
  const visiblePeriodes = win.slice(periodeColumns);

  const [search, setSearch] = useState("");
  const [skema, setSkema] = useState(ALL);
  const [belumKlasif, setBelumKlasif] = useState(false);
  const [belumSetPassword, setBelumSetPassword] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Donatur | null>(null);
  const [tagging, setTagging] = useState<Donatur | null>(null);
  const [resettingPassword, setResettingPassword] = useState<Donatur | null>(null);

  const { data: stats, isLoading: statsLoading } = useDonaturStats();
  const { data, isLoading } = useDonaturList({
    page,
    limit,
    periode_id: globalPeriode,
    skema: skema === ALL ? undefined : skema,
    search: search || undefined,
  });
  const createMutation = useCreateDonatur();
  const assignMutation = useAssignPeriode();
  const removeMutation = useRemovePeriode();
  // Satu sel yang sedang diproses — dipakai untuk spinner per-sel
  const [busyCell, setBusyCell] = useState<string | null>(null);

  const raw = data?.items ?? [];
  // Filter belum-klasifikasi (skema belum_bersedia) & belum-set-password di FE
  const items = raw.filter((d) => {
    if (belumKlasif && d.skema !== "belum_bersedia") return false;
    if (belumSetPassword && d.has_password) return false;
    return true;
  });
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  const periodeStatus = (d: Donatur, periodeId: number) =>
    (d.periodes ?? []).find((p) => p.periode_id === periodeId)?.status;

  // Nama + Kode + Skema + Akun, plus kolom periode, panah, dan Aksi
  const colCount =
    4 + visiblePeriodes.length + (win.showArrows ? 2 : 0) + (canMutate ? 1 : 0);

  const cyclePeriode = (d: Donatur, periodeId: number) => {
    const st = periodeStatus(d, periodeId);
    const key = `${d.id}-${periodeId}`;
    setBusyCell(key);
    const settled = { onSettled: () => setBusyCell(null) };
    if (!st) {
      // Assign pertama kali: bawa skema & nominal default donatur sebagai
      // nilai awal periode ini
      assignMutation.mutate(
        {
          id: d.id,
          body: {
            periode_id: periodeId,
            status: "aktif",
            skema: d.skema || undefined,
            nominal: d.nominal_default ?? undefined,
          },
        },
        settled
      );
    } else if (st === "aktif") {
      // Nominal/skema sengaja tidak dikirim — backend mempertahankan nilai
      // yang sudah ada kalau field-nya absen
      assignMutation.mutate(
        { id: d.id, body: { periode_id: periodeId, status: "tidak_aktif" } },
        settled
      );
    } else {
      removeMutation.mutate({ id: d.id, periodeId }, settled);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Database Donatur</h1>
          <p className="text-muted-foreground">Data donatur beserta skema dan status per periode.</p>
        </div>
        {canMutate && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Donatur" value={String(stats?.total ?? "—")} loading={statsLoading} />
        <StatCard icon={CheckCircle2} label="Aktif Periode" value={String(stats?.aktif_periode ?? "—")} loading={statsLoading} />
        <StatCard icon={AlertTriangle} label="Belum Diklasif." value={String(stats?.belum_diklasifikasi ?? "—")} loading={statsLoading} />
        <StatCard icon={KeyRound} label="Belum Set Password" value={String(stats?.belum_set_password ?? "—")} loading={statsLoading} />
      </div>

      {/* Alert belum diklasifikasi */}
      {stats && stats.belum_diklasifikasi > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {stats.belum_diklasifikasi} donatur belum menentukan skema/periode — segera assign.
        </div>
      )}

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
            placeholder="Cari nama/kode/email…"
            className="pl-9 w-64"
          />
        </div>
        <Select value={skema} onValueChange={(v: string) => { setSkema(v); setPage(1); }}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Skema</SelectItem>
            {SKEMA_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={belumKlasif ? "default" : "outline"}
          size="sm"
          onClick={() => setBelumKlasif((v) => !v)}
        >
          Belum Diklasifikasi
        </Button>
        <Button
          variant={belumSetPassword ? "default" : "outline"}
          size="sm"
          onClick={() => setBelumSetPassword((v) => !v)}
        >
          Belum Set Password
        </Button>
      </div>

      {/* Tabel dengan matriks periode */}
      {win.showArrows && (
        <div className="flex justify-end text-xs text-muted-foreground">
          Periode {win.offset + 1}–{win.offset + visiblePeriodes.length} dari{" "}
          {periodeColumns.length} — geser dengan panah di kepala tabel
        </div>
      )}
      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="w-28">Kode</TableHead>
              <TableHead className="w-40">Skema</TableHead>
              {win.showArrows && (
                <TableHead className="w-8 px-0 text-center">
                  <button
                    type="button"
                    onClick={win.prev}
                    disabled={!win.canPrev}
                    title="Periode sebelumnya"
                    aria-label="Geser ke periode sebelumnya"
                    className="rounded p-1 transition-colors hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </TableHead>
              )}
              {visiblePeriodes.map((p) => (
                <TableHead key={p.id} className="w-16 text-center" title={p.nama}>
                  {p.nama.replace(/^GBB\s*/, "").slice(0, 8)}
                </TableHead>
              ))}
              {win.showArrows && (
                <TableHead className="w-8 px-0 text-center">
                  <button
                    type="button"
                    onClick={win.next}
                    disabled={!win.canNext}
                    title="Periode berikutnya"
                    aria-label="Geser ke periode berikutnya"
                    className="rounded p-1 transition-colors hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </TableHead>
              )}
              <TableHead className="w-28">Akun</TableHead>
              {canMutate && <TableHead className="w-20 text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={colCount}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada donatur ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <DonaturNameCell donatur={d} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{d.kode || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {d.skema === "belum_bersedia" ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                      >
                        <AlertTriangle className="h-3 w-3" /> blm diklasif.
                      </Badge>
                    ) : (
                      skemaLabel(d.skema)
                    )}
                  </TableCell>
                  {win.showArrows && <TableCell className="px-0" />}
                  {visiblePeriodes.map((p) => (
                    <TableCell key={p.id} className="text-center">
                      <PeriodeCell
                        status={periodeStatus(d, p.id)}
                        editable={canMutate}
                        busy={busyCell === `${d.id}-${p.id}`}
                        onClick={() => cyclePeriode(d, p.id)}
                      />
                    </TableCell>
                  ))}
                  {win.showArrows && <TableCell className="px-0" />}
                  <TableCell>
                    {canMutate ? (
                      <Button variant="outline" size="sm" className="h-7" onClick={() => setResettingPassword(d)}>
                        <KeyRound className="h-3.5 w-3.5 mr-1" />
                        Reset Password
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {canMutate && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          title="Edit"
                          onClick={() => setEditing(d)}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Tag"
                          onClick={() => setTagging(d)}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <TagIcon className="h-4 w-4" />
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

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>
                {raw.length === items.length
                  ? `Menampilkan ${(page - 1) * limit + 1}–${Math.min(page * limit, totalItems)} dari ${totalItems}`
                  : `${items.length} dari ${raw.length} baris (difilter) · total ${totalItems}`}
              </span>
              <Select value={String(limit)} onValueChange={(v: string) => { setLimit(Number(v)); setPage(1); }}>
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
              <span className="text-muted-foreground">Hal {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
        </div>
      )}

      {createOpen && (
        <CreateDonaturDialog
          saving={createMutation.isPending}
          onClose={() => setCreateOpen(false)}
          onSubmit={(body) => createMutation.mutate(body, { onSuccess: () => setCreateOpen(false) })}
        />
      )}
      {editing && <EditDonaturDialog donatur={editing} onClose={() => setEditing(null)} />}
      {tagging && <TagDialog donatur={tagging} onClose={() => setTagging(null)} />}
      {resettingPassword && (
        <ResetPasswordDialog donatur={resettingPassword} onClose={() => setResettingPassword(null)} />
      )}
    </div>
  );
}
