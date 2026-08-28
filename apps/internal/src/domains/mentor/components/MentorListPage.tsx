import { useMemo, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Globe,
  GraduationCap,
  Home,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { SearchableSelect, Skeleton } from "@gbb/ui";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  useDeleteMentor,
  useMentorList,
  useMentorOptions,
  useMentorStats,
} from "../hooks/useMentor";
import { downloadMentorExcel } from "../services";
import type { Mentor } from "../services";
import { MentorFormDialog, UndipBadge } from "./MentorDialogs";

const ALL = "all";

export function MentorListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [bidang, setBidang] = useState(ALL);
  const [internal, setInternal] = useState(ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Mentor | null>(null);

  const deleteMutation = useDeleteMentor();
  const { data: stats, isLoading: statsLoading } = useMentorStats();
  const { data: options } = useMentorOptions();
  const { data, isLoading } = useMentorList({
    page,
    limit,
    search: search || undefined,
    // Filter backend exact match — opsi diambil dari data yang ada
    bidang_keahlian: bidang === ALL ? undefined : bidang,
    is_internal: internal === ALL ? undefined : internal,
  });

  const bidangOptions = useMemo(
    () => [...new Set((options?.items ?? []).map((m) => m.bidang_keahlian))].sort(),
    [options]
  );

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  // Export Excel dengan filter yang sedang aktif (tanpa page/limit — backend
  // mengabaikannya dan mengekspor semua baris yang cocok)
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await downloadMentorExcel({
        search: search || undefined,
        bidang_keahlian: bidang === ALL ? undefined : bidang,
        is_internal: internal === ALL ? undefined : internal,
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

  const openCreate = () => {
    setEditingId(null);
    setFormOpen(true);
  };
  const openEdit = (id: number) => {
    setEditingId(id);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Database Mentor</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4 mr-2" />
          Tambah
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={GraduationCap} label="Total" value={String(stats?.total ?? "—")} loading={statsLoading} />
        <StatCard icon={Home} label="UNDIP" value={String(stats?.undip ?? "—")} loading={statsLoading} />
        <StatCard icon={Globe} label="non-UNDIP" value={String(stats?.non_undip ?? "—")} loading={statsLoading} />
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
            placeholder="Cari nama…"
            className="pl-9 w-64"
          />
        </div>
        {/* Filter bidang dengan pencarian di dalam daftarnya */}
        <div className="w-56">
          <SearchableSelect
            value={bidang}
            onChange={(v: string) => {
              setBidang(v || ALL);
              setPage(1);
            }}
            options={[
              { id: ALL, name: "Semua Bidang" },
              ...bidangOptions.map((b) => ({ id: b, name: b })),
            ]}
            placeholder="Semua Bidang"
            searchPlaceholder="Cari bidang…"
            emptyMessage="Bidang tidak ditemukan"
            hideClear
          />
        </div>
        <Select
          value={internal}
          onValueChange={(v: string) => {
            setInternal(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>UNDIP & non-UNDIP</SelectItem>
            <SelectItem value="true">UNDIP</SelectItem>
            <SelectItem value="false">non-UNDIP</SelectItem>
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
              <TableHead className="w-14">#</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Bidang</TableHead>
              <TableHead className="w-24">Event</TableHead>
              <TableHead className="w-16">Avg</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada mentor ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((m) => (
                // Row klik-able ke halaman detail; kontrol di dalam row wajib
                // stopPropagation supaya tidak ikut memicu navigasi
                <TableRow
                  key={m.id}
                  onClick={() => navigate(`/panel/mentor/${m.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-mono text-xs">{m.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.nama}</span>
                      <UndipBadge isInternal={m.is_internal} />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{m.bidang_keahlian}</TableCell>
                  <TableCell className="text-sm">{m.jumlah_event} event</TableCell>
                  <TableCell>
                    {m.avg_rating != null ? (
                      <span className="font-medium">★ {m.avg_rating.toFixed(1)}</span>
                    ) : (
                      <span className="text-muted-foreground" title="Belum ada rating">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/panel/mentor/${m.id}`}
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
                          openEdit(m.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        title="Hapus"
                        onClick={(e: MouseEvent) => {
                          e.stopPropagation();
                          setDeleting(m);
                        }}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
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
                Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, totalItems)} dari {totalItems}
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

      <MentorFormDialog
        open={formOpen}
        editingId={editingId}
        onClose={() => {
          setFormOpen(false);
          setEditingId(null);
        }}
      />

      {/* Dialog konfirmasi hapus */}
      <Dialog open={!!deleting} onOpenChange={(o: boolean) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Mentor</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus mentor <strong>{deleting?.nama}</strong>? History event dan
              feedback-nya tidak akan tampil lagi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
              }
            >
              {deleteMutation.isPending ? "Menghapus…" : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
