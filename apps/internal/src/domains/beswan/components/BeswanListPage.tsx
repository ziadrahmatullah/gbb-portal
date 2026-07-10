import { useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
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
import { StatCard } from "@/shared/components/StatCard";
import { useBeswanList, useBeswanStats } from "../hooks/useBeswan";
import { assetUrl } from "../services";
import type { BeswanListItem } from "../services";
import { CreateBeswanDialog, EditBeswanDialog } from "./BeswanFormDialogs";

const ALL_STATUS = "all";

export function BeswanAvatar({
  beswan,
  className,
}: {
  beswan: Pick<BeswanListItem, "nama_lengkap" | "foto_url">;
  className?: string;
}) {
  const foto = assetUrl(beswan.foto_url);
  const initials = beswan.nama_lengkap
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return foto ? (
    <img src={foto} alt={beswan.nama_lengkap} className={cn("rounded-full object-cover", className)} />
  ) : (
    <div
      className={cn(
        "rounded-full bg-accent flex items-center justify-center text-xs font-bold select-none",
        className
      )}
    >
      {initials}
    </div>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        status === "aktif" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}

export function BeswanListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL_STATUS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<BeswanListItem | null>(null);

  // Mengikuti filter periode global di sidebar
  const periodeId = usePeriodeFilter((s) => s.periodeId) ?? undefined;

  const { data: stats, isLoading: statsLoading } = useBeswanStats(periodeId);
  const { data, isLoading } = useBeswanList({
    page,
    limit,
    periode_id: periodeId,
    search: search || undefined,
    status: status === ALL_STATUS ? undefined : status,
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Database Beswan</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total" value={String(stats?.total ?? "—")} loading={statsLoading} />
        <StatCard icon={CheckCircle2} label="Aktif" value={String(stats?.aktif ?? "—")} loading={statsLoading} />
        <StatCard icon={GraduationCap} label="Alumni" value={String(stats?.alumni ?? "—")} loading={statsLoading} />
        <StatCard icon={BarChart3} label="Avg IPK" value={stats ? stats.avg_ipk.toFixed(2) : "—"} loading={statsLoading} />
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
            placeholder="Cari nama/NIM…"
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
            <SelectItem value="alumni">Alumni</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabel */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Foto</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>NIM</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-8 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada beswan ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <BeswanAvatar beswan={b} className="h-9 w-9" />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{b.nama_lengkap}</div>
                    <div className="text-xs text-muted-foreground">{b.email}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{b.nim}</TableCell>
                  <TableCell className="text-sm">{b.batch ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/panel/beswan/${b.id}`}
                        title="Lihat detail"
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        title="Edit"
                        onClick={() => setEditing(b)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
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

      <CreateBeswanDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditBeswanDialog beswan={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
