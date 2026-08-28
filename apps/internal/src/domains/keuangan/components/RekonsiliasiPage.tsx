import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { ChevronLeft, ChevronRight, Search, Settings2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
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
  useCashflowList,
  useDeleteCashflow,
  useDonaturOptions,
  useKategoriList,
} from "../hooks/useKeuangan";
import type { Cashflow } from "../services";
import { CashflowTable } from "./CashflowTable";
import { UploadWizard } from "./UploadWizard";
import { KategoriManagerDialog } from "./KategoriManager";

const ALL = "all";
const UNDO_DELAY_MS = 5000;

export function RekonsiliasiPage() {
  const role = useAuthStore((s) => s.role);
  // View: admin+finance+anc (route & menu sudah dibatasi); mutasi: admin+finance
  const canMutate = role === "admin" || role === "finance";

  const [wizardOpen, setWizardOpen] = useState(false);
  const [kategoriOpen, setKategoriOpen] = useState(false);
  const [bulan, setBulan] = useState("");
  const [tipe, setTipe] = useState(ALL);
  const [kategoriId, setKategoriId] = useState(ALL);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const { data, isLoading } = useCashflowList({
    page,
    limit,
    bulan: bulan || undefined,
    tipe: tipe === ALL ? undefined : tipe,
    kategori_id: kategoriId === ALL ? undefined : kategoriId,
    search: search || undefined,
  });
  const { data: kategoriData } = useKategoriList({ limit: 100 });
  const { data: donaturData } = useDonaturOptions();
  const deleteMutation = useDeleteCashflow();

  const kategoris = kategoriData?.items ?? [];
  const donaturs = donaturData?.items ?? [];
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  // Hapus dengan Undo optimistic: baris disembunyikan dulu, DELETE beneran
  // ditunda — backend tidak punya restore, jadi undo = membatalkan DELETE.
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const pendingTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const unhide = (id: number) =>
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const handleDelete = (row: Cashflow) => {
    setHiddenIds((prev) => new Set(prev).add(row.id));
    const timer = setTimeout(() => {
      pendingTimers.current.delete(row.id);
      deleteMutation.mutate(row.id, { onSettled: () => unhide(row.id) });
    }, UNDO_DELAY_MS);
    pendingTimers.current.set(row.id, timer);
    toast(`Baris #${row.id} dihapus`, {
      description: row.deskripsi,
      duration: UNDO_DELAY_MS,
      action: {
        label: "Undo",
        onClick: () => {
          const t = pendingTimers.current.get(row.id);
          if (t) clearTimeout(t);
          pendingTimers.current.delete(row.id);
          unhide(row.id);
        },
      },
    });
  };

  if (wizardOpen) {
    return (
      <div className="space-y-4">
        <div className="mb-2">
          <h1 className="text-2xl font-bold tracking-tight">Rekonsiliasi — Upload Mutasi</h1>
        </div>
        <UploadWizard kategoris={kategoris} donaturs={donaturs} onClose={() => setWizardOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rekonsiliasi Keuangan</h1>
          <p className="text-muted-foreground">Catat dan kategorikan mutasi cashflow.</p>
        </div>
        {canMutate && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setKategoriOpen(true)}>
              <Settings2 className="h-4 w-4 mr-2" />
              Kelola Kategori
            </Button>
            <Button size="sm" onClick={() => setWizardOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Mutasi
            </Button>
          </div>
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
            placeholder="Cari deskripsi…"
            className="pl-9 w-64"
          />
        </div>
        <Input
          type="month"
          value={bulan}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setBulan(e.target.value);
            setPage(1);
          }}
          className="w-44"
          title="Filter bulan"
        />
        <Select
          value={tipe}
          onValueChange={(v: string) => {
            setTipe(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Tipe</SelectItem>
            <SelectItem value="cash_in">Cash In</SelectItem>
            <SelectItem value="cash_out">Cash Out</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={kategoriId}
          onValueChange={(v: string) => {
            setKategoriId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Kategori</SelectItem>
            {kategoris.map((k) => (
              <SelectItem key={k.id} value={String(k.id)}>
                {k.parent_id ? `› ${k.nama}` : k.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabel */}
      <CashflowTable
        rows={items}
        kategoris={kategoris}
        donaturs={donaturs}
        editable={canMutate}
        loading={isLoading}
        onDelete={canMutate ? handleDelete : undefined}
        hiddenIds={hiddenIds}
      />

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
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
                {[25, 50, 100].map((n) => (
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

      {kategoriOpen && <KategoriManagerDialog onClose={() => setKategoriOpen(false)} />}
    </div>
  );
}
