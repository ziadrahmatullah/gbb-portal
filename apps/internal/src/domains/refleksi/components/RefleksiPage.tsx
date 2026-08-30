import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Skeleton } from "@gbb/ui";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { Button } from "@/shared/components/ui/button";
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
import { useRefleksiList } from "../hooks/useRefleksi";

const ALL = "all";

export const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export function RefleksiStatusBadge({ status }: { status: string }) {
  return status === "submitted" ? (
    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
      Terkumpul
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Draft
    </Badge>
  );
}

// Tabel refleksi reusable: dipakai halaman Refleksi Beswan (filter periode
// global) dan tab Refleksi di detail beswan (beswanId di-set, kolom Beswan
// disembunyikan, periode global tidak dikirim supaya semua bulan tampil).
export function RefleksiTable({ beswanId }: { beswanId?: number }) {
  const navigate = useNavigate();
  const periodeId = usePeriodeFilter((s) => s.periodeId) ?? undefined;
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useRefleksiList({
    page,
    limit,
    periode_id: beswanId ? undefined : periodeId,
    beswan_id: beswanId,
    status: status === ALL ? undefined : (status as "draft" | "submitted"),
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;
  const colSpan = beswanId ? 3 : 4;

  return (
    <div className="space-y-4">
      {/* Filter status */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={status}
          onValueChange={(v: string) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Terkumpul</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {!beswanId && <TableHead>Beswan</TableHead>}
              <TableHead className="w-44">Bulan Refleksi</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-32">Disubmit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada refleksi ditemukan
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow
                  key={r.id}
                  onClick={() => navigate(`/panel/refleksi/${r.id}`)}
                  className="cursor-pointer"
                >
                  {!beswanId && <TableCell className="font-medium">{r.beswan_nama}</TableCell>}
                  <TableCell className="font-medium">
                    {BULAN[r.bulan - 1]} {r.tahun}
                  </TableCell>
                  <TableCell>
                    <RefleksiStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.submitted_at ? formatTanggal(r.submitted_at) : "—"}
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
                <SelectTrigger className="h-8 w-20">
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
    </div>
  );
}

export function RefleksiPage() {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Refleksi Beswan</h1>
        <p className="text-muted-foreground">
          Pantau refleksi bulanan yang dikirim beswan dari portalnya.
        </p>
      </div>
      <RefleksiTable />
    </div>
  );
}
