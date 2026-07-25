import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  GraduationCap,
  Home,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
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
  useMentorList,
  useMentorOptions,
  useMentorStats,
} from "../hooks/useMentor";
import { MentorDetailDialog, MentorFormDialog, UndipBadge } from "./MentorDialogs";

const ALL = "all";

export function MentorListPage() {
  const [search, setSearch] = useState("");
  const [bidang, setBidang] = useState(ALL);
  const [internal, setInternal] = useState(ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

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

  const openCreate = () => {
    setEditingId(null);
    setFormOpen(true);
  };
  const openEdit = (id: number) => {
    setDetailId(null);
    setEditingId(id);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Database Mentor</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
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
        <Select
          value={bidang}
          onValueChange={(v: string) => {
            setBidang(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Bidang</SelectItem>
            {bidangOptions.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      </div>

      {/* Tabel */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
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
                    <div className="h-6 animate-pulse rounded bg-muted" />
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
                <TableRow key={m.id}>
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
                      <button
                        title="Lihat detail"
                        onClick={() => setDetailId(m.id)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        title="Edit"
                        onClick={() => openEdit(m.id)}
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
      <MentorDetailDialog id={detailId} onClose={() => setDetailId(null)} onEdit={openEdit} />
    </div>
  );
}
