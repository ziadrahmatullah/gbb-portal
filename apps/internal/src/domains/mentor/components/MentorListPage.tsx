import { useMemo, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  Badge,
  SearchableSelect,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@gbb/ui";
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
  useMentorRequestList,
  useMentorStats,
} from "../hooks/useMentor";
import { downloadMentorExcel } from "../services";
import type { Mentor } from "../services";
import { MentorFormDialog, UndipBadge } from "./MentorDialogs";
import { MentorRequestsTab } from "./MentorRequestsTab";
import { MentorPendaftaranTab } from "./MentorPendaftaranTab";

const ALL = "all";

function MentorListTab() {
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
      {/* Tombol tambah (judul halaman ada di MentorListPage ber-tab) */}
      <div className="flex justify-end">
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
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
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

// "Pendaftaran Mentor Baru" (self-signup donatur → verifikasi) sengaja jadi
// TAB TERPISAH, bukan filter di Daftar Mentor: dua antrean "pending" bernama
// mirip (Request Mentor = beswan minta dicarikan mentor) akan tertukar kalau
// digabung di satu tabel.
const MENTOR_TABS = [
  { key: "daftar", label: "Daftar Mentor" },
  { key: "pendaftaran", label: "Pendaftaran Mentor Baru" },
  { key: "request", label: "Request Mentor" },
] as const;

type MentorTabKey = (typeof MENTOR_TABS)[number]["key"];

const isTabKey = (v: string | null): v is MentorTabKey =>
  MENTOR_TABS.some((t) => t.key === v);

export function MentorListPage() {
  // Tab dari query string (?tab=request) supaya notifikasi bell & tautan bisa
  // deep-link langsung ke tab yang benar; state tidak hilang saat refresh.
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: MentorTabKey = isTabKey(rawTab) ? rawTab : "daftar";
  const setTab = (next: MentorTabKey) =>
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next === "daftar") p.delete("tab");
        else p.set("tab", next);
        return p;
      },
      { replace: true }
    );
  // Badge jumlah request pending di label tab (limit 1 — cuma butuh totalItems)
  const { data: pending } = useMentorRequestList({ limit: 1, status: "pending" });
  const pendingCount = pending?.totalItems ?? 0;
  // Antrean verifikasi pendaftar baru — dari stats yang sudah dipanggil tab Daftar
  const { data: stats } = useMentorStats();
  const menungguCount = stats?.pendaftaran_menunggu ?? 0;

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Database Mentor</h1>
      </div>

      {/* Banner di ATAS tabs supaya terlihat dari tab mana pun; klik → pindah tab */}
      {menungguCount > 0 && tab !== "pendaftaran" && (
        <button
          type="button"
          onClick={() => setTab("pendaftaran")}
          className="flex w-full items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-left text-sm text-amber-900 transition-colors hover:bg-amber-500/15 dark:text-amber-200"
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            <strong>{menungguCount}</strong> pendaftaran mentor baru menunggu verifikasi kamu —
            klik untuk membuka.
          </span>
        </button>
      )}

      <Tabs value={tab} onValueChange={(v: string) => setTab(v as MentorTabKey)} className="space-y-4">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            {MENTOR_TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
                {t.key === "request" && pendingCount > 0 && (
                  <Badge className="ml-1.5 h-5 min-w-5 rounded-full px-1.5 text-xs">
                    {pendingCount}
                  </Badge>
                )}
                {t.key === "pendaftaran" && menungguCount > 0 && (
                  <Badge className="ml-1.5 h-5 min-w-5 rounded-full bg-amber-500 px-1.5 text-xs text-white">
                    {menungguCount}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="daftar" className="space-y-4">
          <MentorListTab />
        </TabsContent>
        <TabsContent value="pendaftaran" className="space-y-4">
          <MentorPendaftaranTab />
        </TabsContent>
        <TabsContent value="request" className="space-y-4">
          <MentorRequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
