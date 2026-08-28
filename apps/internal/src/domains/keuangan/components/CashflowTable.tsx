import { useState } from "react";
import type { ChangeEvent } from "react";
import { StickyNote, Trash2 } from "lucide-react";
import { Badge, Skeleton } from "@gbb/ui";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
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
import { useUpdateCashflow } from "../hooks/useKeuangan";
import type { Cashflow, CashflowKategori } from "../services";
import type { DonaturOption } from "@/domains/donatur/services";
import { formatNominal } from "../utils";

const NONE = "none";
const ANON = "anon";

export function StatusKlasifikasiBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "inputted"
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      )}
    >
      {status === "inputted" ? "Inputted" : "? unknown"}
    </Badge>
  );
}

// Sel klasifikasi inline — setiap perubahan langsung PUT (auto-save, backend
// menghitung ulang status). Auto-match dari upload ditandai badge ✓auto;
// badge hilang begitu diedit manual (backend me-reset match_source).
function KlasifikasiCell({
  row,
  kategoris,
  donaturs,
  editable,
  onRowUpdated,
}: {
  row: Cashflow;
  kategoris: CashflowKategori[];
  donaturs: DonaturOption[];
  editable: boolean;
  onRowUpdated?: (row: Cashflow) => void;
}) {
  const updateMutation = useUpdateCashflow();

  const byId = new Map(kategoris.map((k) => [k.id, k]));
  // Auto-match bisa men-set kategori_id langsung ke SUB — normalisasi untuk tampilan
  const stored = row.kategori_id ? byId.get(row.kategori_id) : undefined;
  const parentId = stored?.parent_id ?? row.kategori_id ?? null;
  const subId = stored?.parent_id ? stored.id : row.sub_kategori_id ?? null;

  const parents = kategoris.filter(
    (k) => !k.parent_id && k.aktif && (k.tipe === row.tipe || k.tipe === "both")
  );
  const subs = kategoris.filter((k) => k.parent_id === parentId && k.aktif);

  const save = (body: Parameters<typeof updateMutation.mutate>[0]["body"]) =>
    updateMutation.mutate(
      { id: row.id, body },
      { onSuccess: (updated) => updated && onRowUpdated?.(updated) }
    );

  if (!editable) {
    return (
      <div className="text-sm">
        {row.tipe === "cash_in" ? (
          <span>{row.is_anonymous ? "Anonymous" : row.donatur_nama || "—"}</span>
        ) : null}
        <div className="text-xs text-muted-foreground">
          {row.kategori_nama || "—"}
          {row.sub_kategori_nama ? ` › ${row.sub_kategori_nama}` : ""}
        </div>
      </div>
    );
  }

  const donaturValue = row.is_anonymous ? ANON : row.donatur_id ? String(row.donatur_id) : "";

  return (
    <div className="flex flex-col gap-1 min-w-44">
      {/* Kategori (wajib untuk semua tipe agar status inputted) */}
      <Select
        value={parentId ? String(parentId) : ""}
        onValueChange={(v: string) => save({ kategori_id: Number(v) })}
        disabled={updateMutation.isPending}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Kategori…" />
        </SelectTrigger>
        <SelectContent>
          {parents.map((k) => (
            <SelectItem key={k.id} value={String(k.id)}>
              {k.nama}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {row.tipe === "cash_in" ? (
        <Select
          value={donaturValue}
          onValueChange={(v: string) =>
            v === NONE
              ? // clear_donatur = kosongkan relasi donatur (nil = tidak diubah)
                save({ clear_donatur: true, is_anonymous: false })
              : v === ANON
                ? save({ is_anonymous: true })
                : save({ donatur_id: Number(v), is_anonymous: false })
          }
          disabled={updateMutation.isPending}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Nama donatur…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>— (tanpa donatur)</SelectItem>
            <SelectItem value={ANON}>Anonymous</SelectItem>
            {donaturs.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        subs.length > 0 && (
          <Select
            value={subId ? String(subId) : ""}
            onValueChange={(v: string) =>
              v === NONE
                ? // clear_sub_kategori = kosongkan sub (kategori induk tetap)
                  parentId && save({ kategori_id: parentId, clear_sub_kategori: true })
                : parentId && save({ kategori_id: parentId, sub_kategori_id: Number(v) })
            }
            disabled={updateMutation.isPending || !parentId}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Sub…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>— (tanpa sub)</SelectItem>
              {subs.map((k) => (
                <SelectItem key={k.id} value={String(k.id)}>
                  {k.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      )}
      {row.match_source === "auto" && (
        <span className="text-xs text-primary">✓ auto</span>
      )}
    </div>
  );
}

function CatatanDialog({
  row,
  onClose,
  onRowUpdated,
}: {
  row: Cashflow;
  onClose: () => void;
  onRowUpdated?: (row: Cashflow) => void;
}) {
  const updateMutation = useUpdateCashflow();
  const [catatan, setCatatan] = useState(row.catatan ?? "");

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Catatan Transaksi</DialogTitle>
          <DialogDescription className="truncate">{row.deskripsi}</DialogDescription>
        </DialogHeader>
        <Textarea
          rows={3}
          value={catatan}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCatatan(e.target.value)}
          placeholder="Catatan internal untuk baris ini…"
          disabled={updateMutation.isPending}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
            Batal
          </Button>
          <Button
            onClick={() =>
              updateMutation.mutate(
                { id: row.id, body: { catatan } },
                {
                  onSuccess: (updated) => {
                    if (updated) onRowUpdated?.(updated);
                    onClose();
                  },
                }
              )
            }
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CashflowTable({
  rows,
  kategoris,
  donaturs,
  editable,
  loading,
  onRowUpdated,
  onDelete,
  hiddenIds,
}: {
  rows: Cashflow[];
  kategoris: CashflowKategori[];
  donaturs: DonaturOption[];
  editable: boolean;
  loading?: boolean;
  onRowUpdated?: (row: Cashflow) => void;
  onDelete?: (row: Cashflow) => void;
  hiddenIds?: Set<number>;
}) {
  const [noteRow, setNoteRow] = useState<Cashflow | null>(null);
  const visible = hiddenIds ? rows.filter((r) => !hiddenIds.has(r.id)) : rows;
  const colSpan = editable ? 11 : 10;

  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">#</TableHead>
            <TableHead className="w-16">Sheet</TableHead>
            <TableHead className="w-24">Tanggal</TableHead>
            <TableHead className="w-20">Bulan</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead className="w-28 text-right">Nominal</TableHead>
            <TableHead className="w-16">Tipe</TableHead>
            <TableHead className="w-24">Kat. BSI</TableHead>
            <TableHead className="w-52">Klasifikasi</TableHead>
            <TableHead className="w-28">Status</TableHead>
            {editable && <TableHead className="w-20 text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : visible.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="text-center text-sm text-muted-foreground py-8">
                Tidak ada transaksi
              </TableCell>
            </TableRow>
          ) : (
            visible.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs">{row.id}</TableCell>
                <TableCell className="text-sm">{row.sheet}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">{row.tanggal}</TableCell>
                <TableCell className="font-mono text-xs">{row.bulan}</TableCell>
                <TableCell className="text-sm max-w-64">
                  <div className="truncate" title={row.deskripsi}>
                    {row.deskripsi}
                  </div>
                  {row.catatan && (
                    <div className="text-xs text-muted-foreground truncate" title={row.catatan}>
                      📝 {row.catatan}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                  {formatNominal(row.nominal)}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      row.tipe === "cash_in" ? "text-primary" : "text-destructive"
                    )}
                  >
                    {row.tipe === "cash_in" ? "In" : "Out"}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.kat_bsi || "—"}</TableCell>
                <TableCell>
                  <KlasifikasiCell
                    row={row}
                    kategoris={kategoris}
                    donaturs={donaturs}
                    editable={editable}
                    onRowUpdated={onRowUpdated}
                  />
                </TableCell>
                <TableCell>
                  <StatusKlasifikasiBadge status={row.status_klasifikasi} />
                </TableCell>
                {editable && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        title="Catatan"
                        onClick={() => setNoteRow(row)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <StickyNote className="h-4 w-4" />
                      </button>
                      {onDelete && (
                        <button
                          title="Hapus baris"
                          onClick={() => onDelete(row)}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {noteRow && (
        <CatatanDialog row={noteRow} onClose={() => setNoteRow(null)} onRowUpdated={onRowUpdated} />
      )}
    </div>
  );
}
