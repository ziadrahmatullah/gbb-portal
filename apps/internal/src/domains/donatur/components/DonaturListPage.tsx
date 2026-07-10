import { useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Link2,
  Pencil,
  Plus,
  Search,
  Tag as TagIcon,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
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
import { useCreateDonatur, useDonaturList, useDonaturStats } from "../hooks/useDonatur";
import { SKEMA_OPTIONS, skemaLabel, tagMeta } from "../services";
import type { Donatur } from "../services";
import { CreateDonaturDialog, EditDonaturDialog, LinkAkunDialog, TagDialog } from "./DonaturDialogs";

const ALL = "all";

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

export function DonaturListPage() {
  const role = useAuthStore((s) => s.role);
  const canMutate = role === "admin" || role === "anc";

  const globalPeriode = usePeriodeFilter((s) => s.periodeId) ?? undefined;
  const { data: periodeData } = usePeriodeOptions();
  const periodeColumns = periodeData?.items ?? [];

  const [search, setSearch] = useState("");
  const [skema, setSkema] = useState(ALL);
  const [belumKlasif, setBelumKlasif] = useState(false);
  const [belumTerlink, setBelumTerlink] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Donatur | null>(null);
  const [tagging, setTagging] = useState<Donatur | null>(null);
  const [linking, setLinking] = useState<Donatur | null>(null);

  const { data: stats, isLoading: statsLoading } = useDonaturStats();
  const { data, isLoading } = useDonaturList({
    page,
    limit,
    periode_id: globalPeriode,
    skema: skema === ALL ? undefined : skema,
    search: search || undefined,
  });
  const createMutation = useCreateDonatur();

  const raw = data?.items ?? [];
  // Filter belum-klasifikasi (skema belum_bersedia) & belum-terlink di FE
  const items = raw.filter((d) => {
    if (belumKlasif && d.skema !== "belum_bersedia") return false;
    if (belumTerlink && d.linked_email) return false;
    return true;
  });
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  const periodeStatus = (d: Donatur, periodeId: number) =>
    (d.periodes ?? []).find((p) => p.periode_id === periodeId)?.status;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Database Donatur</h1>
        {canMutate && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Donatur" value={String(stats?.total ?? "—")} loading={statsLoading} />
        <StatCard icon={CheckCircle2} label="Aktif Periode" value={String(stats?.aktif_periode ?? "—")} loading={statsLoading} />
        <StatCard icon={AlertTriangle} label="Belum Diklasif." value={String(stats?.belum_diklasifikasi ?? "—")} loading={statsLoading} />
        <StatCard icon={Link2} label="Belum Ter-link" value={String(stats?.belum_terlink ?? "—")} loading={statsLoading} />
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
          variant={belumTerlink ? "default" : "outline"}
          size="sm"
          onClick={() => setBelumTerlink((v) => !v)}
        >
          Belum Ter-link
        </Button>
      </div>

      {/* Tabel dengan matriks periode */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="w-28">Kode</TableHead>
              <TableHead className="w-40">Skema</TableHead>
              {periodeColumns.map((p) => (
                <TableHead key={p.id} className="w-16 text-center" title={p.nama}>
                  {p.nama.replace(/^GBB\s*/, "").slice(0, 8)}
                </TableHead>
              ))}
              <TableHead className="w-28">Akun</TableHead>
              {canMutate && <TableHead className="w-20 text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5 + periodeColumns.length + (canMutate ? 1 : 0)}>
                    <div className="h-6 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5 + periodeColumns.length + (canMutate ? 1 : 0)} className="text-center text-sm text-muted-foreground py-8">
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                        <AlertTriangle className="h-3 w-3" /> blm diklasif.
                      </span>
                    ) : (
                      skemaLabel(d.skema)
                    )}
                  </TableCell>
                  {periodeColumns.map((p) => {
                    const st = periodeStatus(d, p.id);
                    return (
                      <TableCell key={p.id} className="text-center">
                        {st === "aktif" ? (
                          <span className="text-primary" title="Aktif">☑</span>
                        ) : st === "tidak_aktif" ? (
                          <span className="text-muted-foreground" title="Tidak aktif">☒</span>
                        ) : (
                          <span className="text-muted-foreground/40" title="Belum diassign">☐</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    {d.linked_email ? (
                      <button
                        onClick={() => canMutate && setLinking(d)}
                        disabled={!canMutate}
                        title={d.linked_email}
                        className={cn(
                          "inline-flex items-center gap-1 text-xs",
                          canMutate ? "text-primary hover:underline" : "text-primary"
                        )}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="max-w-24 truncate">{d.linked_email}</span>
                      </button>
                    ) : canMutate ? (
                      <Button variant="outline" size="sm" className="h-7" onClick={() => setLinking(d)}>
                        <Link2 className="h-3.5 w-3.5 mr-1" />
                        Link
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

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm">
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
      </div>

      {createOpen && (
        <CreateDonaturDialog
          saving={createMutation.isPending}
          onClose={() => setCreateOpen(false)}
          onSubmit={(body) => createMutation.mutate(body, { onSuccess: () => setCreateOpen(false) })}
        />
      )}
      {editing && <EditDonaturDialog donatur={editing} onClose={() => setEditing(null)} />}
      {tagging && <TagDialog donatur={tagging} onClose={() => setTagging(null)} />}
      {linking && <LinkAkunDialog donatur={linking} onClose={() => setLinking(null)} />}
    </div>
  );
}
