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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useUpdateCashflow } from "../hooks/useKeuangan";
import { DONATUR_ANON, DONATUR_NONE, DonaturCombobox } from "./DonaturCombobox";
import type { Cashflow, CashflowDraft, CashflowKategori, UpdateCashflowReq } from "../services";
import type { DonaturOption } from "@/domains/donatur/services";
import { formatNominal } from "../utils";

// Tabel dipakai dua mode: baris tersimpan (punya id, edit langsung PUT) dan
// baris draft hasil preview upload (punya row_key, edit hanya di state lokal
// sampai user klik Simpan). `"id" in row` jadi diskriminan union-nya.
export type CashflowRow = Cashflow | CashflowDraft;

const rowKeyOf = (row: CashflowRow) => ("id" in row ? `id-${row.id}` : row.row_key);

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

// Sel klasifikasi inline. Mode tersimpan: setiap perubahan langsung PUT
// (auto-save, backend menghitung ulang status). Mode draft (`onDraftChange`
// terisi): perubahan hanya diteruskan ke state pemanggil, tidak ada request.
// Auto-match dari upload ditandai badge ✓auto; badge hilang begitu diedit
// manual (backend — dan applyKlasifikasiPatch — me-reset match_source).
function KlasifikasiCell({
  row,
  kategoris,
  donaturs,
  editable,
  onRowUpdated,
  onDraftChange,
}: {
  row: CashflowRow;
  kategoris: CashflowKategori[];
  donaturs: DonaturOption[];
  editable: boolean;
  onRowUpdated?: (row: Cashflow) => void;
  onDraftChange?: (row: CashflowRow, patch: UpdateCashflowReq) => void;
}) {
  const updateMutation = useUpdateCashflow();

  const byId = new Map(kategoris.map((k) => [k.id, k]));
  // Auto-match bisa men-set kategori_id langsung ke SUB — normalisasi untuk tampilan
  const stored = row.kategori_id ? byId.get(row.kategori_id) : undefined;
  const parentId = stored?.parent_id ?? row.kategori_id ?? null;
  const subId = stored?.parent_id ? stored.id : row.sub_kategori_id ?? null;

  // Kategori mengikuti hasil pembacaan file (auto-match) dan tidak bisa diubah
  // dari tabel — nama diambil dari master kategori supaya tetap akurat meski
  // kategori_nama di baris menunjuk sub.
  const parentNama = (parentId ? byId.get(parentId)?.nama : undefined) ?? row.kategori_nama ?? "";
  const subNama = (subId ? byId.get(subId)?.nama : undefined) ?? row.sub_kategori_nama ?? "";

  const save = (body: UpdateCashflowReq) => {
    if (onDraftChange || !("id" in row)) {
      onDraftChange?.(row, body);
      return;
    }
    updateMutation.mutate(
      { id: row.id, body },
      { onSuccess: (updated) => updated && onRowUpdated?.(updated) }
    );
  };

  const busy = updateMutation.isPending && !onDraftChange;

  const kategoriTeks = (
    <div className="min-w-0">
      <div className="truncate text-sm">{parentNama || "—"}</div>
      {subNama && <div className="truncate text-xs text-muted-foreground">{subNama}</div>}
    </div>
  );

  if (!editable) {
    return (
      <div className="text-sm">
        {row.tipe === "cash_in" ? (
          <span>{row.is_anonymous ? "Anonim" : row.donatur_nama || "—"}</span>
        ) : null}
        <div className="text-xs text-muted-foreground">
          {parentNama || "—"}
          {subNama ? ` › ${subNama}` : ""}
        </div>
      </div>
    );
  }

  const donaturValue = row.is_anonymous
    ? DONATUR_ANON
    : row.donatur_id
      ? String(row.donatur_id)
      : "";

  return (
    // Sejajar satu baris (bukan ditumpuk) agar tinggi row tabel tetap ramping
    <div className="flex items-center gap-2">
      {/* Kategori: read-only, murni hasil bacaan file */}
      <div className="w-32 shrink-0">{kategoriTeks}</div>
      {row.tipe === "cash_in" && (
        <DonaturCombobox
          className="min-w-0 flex-1"
          value={donaturValue}
          donaturs={donaturs}
          disabled={busy}
          // Cash In wajib punya donatur atau ditandai anonim agar status inputted
          invalid={!row.donatur_id && !row.is_anonymous}
          onChange={(v: string) =>
            v === DONATUR_NONE
              ? // clear_donatur = kosongkan relasi donatur (nil = tidak diubah)
                save({ clear_donatur: true, is_anonymous: false })
              : v === DONATUR_ANON
                ? save({ is_anonymous: true })
                : save({ donatur_id: Number(v), is_anonymous: false })
          }
        />
      )}
      {row.match_source === "auto" && (
        <span className="shrink-0 whitespace-nowrap text-xs text-primary">✓ auto</span>
      )}
    </div>
  );
}

function CatatanDialog({
  row,
  onClose,
  onRowUpdated,
  onDraftChange,
}: {
  row: CashflowRow;
  onClose: () => void;
  onRowUpdated?: (row: Cashflow) => void;
  onDraftChange?: (row: CashflowRow, patch: UpdateCashflowReq) => void;
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
            onClick={() => {
              if (onDraftChange || !("id" in row)) {
                onDraftChange?.(row, { catatan });
                onClose();
                return;
              }
              updateMutation.mutate(
                { id: row.id, body: { catatan } },
                {
                  onSuccess: (updated) => {
                    if (updated) onRowUpdated?.(updated);
                    onClose();
                  },
                }
              );
            }}
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
  onDraftChange,
  onDelete,
  hiddenIds,
  invalidRowKeys,
}: {
  rows: CashflowRow[];
  kategoris: CashflowKategori[];
  donaturs: DonaturOption[];
  editable: boolean;
  loading?: boolean;
  onRowUpdated?: (row: Cashflow) => void;
  onDraftChange?: (row: CashflowRow, patch: UpdateCashflowReq) => void;
  onDelete?: (row: CashflowRow) => void;
  hiddenIds?: Set<number>;
  // row_key baris yang ditolak backend saat commit — disorot merah
  invalidRowKeys?: Set<string>;
}) {
  const [noteRow, setNoteRow] = useState<CashflowRow | null>(null);
  const visible = hiddenIds
    ? rows.filter((r) => !("id" in r) || !hiddenIds.has(r.id))
    : rows;
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
            <TableHead className="min-w-80">Klasifikasi</TableHead>
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
            visible.map((row, i) => (
              <TableRow
                key={rowKeyOf(row)}
                className={cn(
                  !("id" in row) &&
                    invalidRowKeys?.has(row.row_key) &&
                    "bg-destructive/5 hover:bg-destructive/10"
                )}
              >
                <TableCell className="font-mono text-xs">
                  {"id" in row ? row.id : i + 1}
                </TableCell>
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
                    onDraftChange={onDraftChange}
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
        <CatatanDialog
          row={noteRow}
          onClose={() => setNoteRow(null)}
          onRowUpdated={onRowUpdated}
          onDraftChange={onDraftChange}
        />
      )}
    </div>
  );
}
