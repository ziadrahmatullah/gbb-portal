import { useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Download,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Skeleton } from "@gbb/ui";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { PeriodeFilterSelect } from "@/shared/components/PeriodeFilterSelect";
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
import { useBeswanList, useBeswanStats, useUpdateBeswanStatus } from "../hooks/useBeswan";
import { assetUrl, downloadBeswanExcel } from "../services";
import type { BeswanListItem, BeswanStatus } from "../services";
import { CreateBeswanDialog, EditBeswanDialog } from "./BeswanFormDialogs";

const ALL_STATUS = "all";

type StatusFilter = "aktif" | "alumni" | typeof ALL_STATUS;
type SortOrder = "asc" | "desc";

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
    <Badge
      variant={status === "aktif" ? "default" : "outline"}
      className={status === "aktif" ? "capitalize" : "capitalize text-muted-foreground"}
    >
      {status}
    </Badge>
  );
}

// Segmented slider aktif/alumni: kedua label di dalam kontrol, thumb geser
// kanan-kiri menutupi status yang sedang aktif. Satu tombol toggle (bukan dua
// tombol per sisi) supaya tetap terasa seperti switch geser.
function StatusSlider({
  status,
  disabled,
  onChange,
}: {
  status: string;
  disabled?: boolean;
  onChange: (status: BeswanStatus) => void;
}) {
  const aktif = status === "aktif";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={aktif}
      disabled={disabled}
      title={aktif ? "Aktif — klik untuk jadikan alumni" : "Alumni — klik untuk aktifkan kembali"}
      onClick={(e: MouseEvent) => {
        // Row-nya klik-able ke halaman detail — jangan ikut ternavigasi
        e.stopPropagation();
        onChange(aktif ? "alumni" : "aktif");
      }}
      className="relative grid grid-cols-2 items-center rounded-full border bg-muted p-0.5 text-xs font-medium select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full transition-transform duration-200",
          aktif ? "translate-x-0 bg-primary" : "translate-x-full bg-background border shadow-sm"
        )}
      />
      <span
        className={cn(
          "relative z-10 px-2.5 py-0.5 transition-colors",
          aktif ? "text-primary-foreground" : "text-muted-foreground"
        )}
      >
        Aktif
      </span>
      <span
        className={cn(
          "relative z-10 px-2.5 py-0.5 transition-colors",
          aktif ? "text-muted-foreground" : "text-foreground"
        )}
      >
        Alumni
      </span>
    </button>
  );
}

export function BeswanListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>(ALL_STATUS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  // null = sort nama nonaktif (jangan kirim sort_by/order ke API)
  const [sortNama, setSortNama] = useState<SortOrder | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<BeswanListItem | null>(null);
  const statusMutation = useUpdateBeswanStatus();

  // Mengikuti filter periode global di sidebar
  const periodeId = usePeriodeFilter((s) => s.periodeId) ?? undefined;

  const { data: stats, isLoading: statsLoading } = useBeswanStats(periodeId);
  const { data, isLoading } = useBeswanList({
    page,
    limit,
    periode_id: periodeId,
    search: search || undefined,
    status: status === ALL_STATUS ? undefined : status,
    sort_by: sortNama ? "nama" : undefined,
    order: sortNama ?? undefined,
  });

  // Siklus klik header Nama: nonaktif → asc → desc → nonaktif
  const toggleSortNama = () => {
    setSortNama((s) => (s === null ? "asc" : s === "asc" ? "desc" : null));
    setPage(1);
  };

  // Export Excel dengan filter & sort yang sedang aktif (tanpa page/limit —
  // backend mengabaikannya dan mengekspor semua baris yang cocok)
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await downloadBeswanExcel({
        periode_id: periodeId,
        search: search || undefined,
        status: status === ALL_STATUS ? undefined : status,
        sort_by: sortNama ? "nama" : undefined,
        order: sortNama ?? undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Pesan error sudah di-toast oleh interceptor apiClient
    } finally {
      setExporting(false);
    }
  };

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Database Beswan</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-2" />
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
        <PeriodeFilterSelect onChange={() => setPage(1)} />
        <Select
          value={status}
          onValueChange={(v: StatusFilter) => {
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
        <Button
          variant="outline"
          className="ms-auto"
          onClick={handleExport}
          disabled={exporting || isLoading}
        >
          <Download />
          {exporting ? "Mengekspor…" : "Export Excel"}
        </Button>
      </div>

      {/* Tabel */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Foto</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSortNama}
                  className={cn("-ms-3 h-8", sortNama && "text-foreground")}
                >
                  Nama
                  {sortNama === "asc" ? (
                    <ArrowUp className="size-3.5" />
                  ) : sortNama === "desc" ? (
                    <ArrowDown className="size-3.5" />
                  ) : (
                    <ChevronsUpDown className="size-3.5 text-muted-foreground/60" />
                  )}
                </Button>
              </TableHead>
              <TableHead>NIM</TableHead>
              <TableHead>Jurusan · Smt</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada beswan ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((b) => (
                // Seluruh row klik-able ke detail; tombol di dalam row wajib
                // stopPropagation supaya tidak ikut memicu navigasi
                <TableRow
                  key={b.id}
                  onClick={() => navigate(`/panel/beswan/${b.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <BeswanAvatar beswan={b} className="h-9 w-9" />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{b.nama_lengkap}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="truncate">{b.email}</span>
                      <button
                        title="Salin email"
                        onClick={(e: MouseEvent) => {
                          e.stopPropagation();
                          navigator.clipboard
                            .writeText(b.email)
                            .then(() => toast.success("Email disalin"))
                            .catch(() => toast.error("Gagal menyalin email"));
                        }}
                        className="rounded p-0.5 transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Copy className="size-3" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{b.nim}</TableCell>
                  <TableCell className="text-sm">
                    {b.jurusan || b.semester ? (
                      <>
                        {b.jurusan || "—"}
                        {b.semester ? <span className="text-muted-foreground"> · Smt {b.semester}</span> : null}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{b.batch ?? "—"}</TableCell>
                  <TableCell>
                    {b.status ? (
                      <StatusSlider
                        status={b.status}
                        disabled={statusMutation.isPending}
                        onChange={(status) => statusMutation.mutate({ id: b.id, status })}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/panel/beswan/${b.id}`}
                        title="Lihat detail"
                        onClick={(e: MouseEvent) => e.stopPropagation()}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        title="Edit"
                        onClick={(e: MouseEvent) => {
                          e.stopPropagation();
                          setEditing(b);
                        }}
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
