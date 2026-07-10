import { useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Copy,
  FileSpreadsheet,
  HelpCircle,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/shared/components/StatCard";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useUploadCashflow } from "../hooks/useKeuangan";
import type { Cashflow, CashflowDuplicate, CashflowKategori, UploadCashflowResult } from "../services";
import type { DonaturOption } from "@/domains/donatur/services";
import { CashflowTable } from "./CashflowTable";
import { formatNominal } from "../utils";

function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = ["Upload Mutasi", "Klasifikasi", "Simpan"];
  return (
    <div className="flex items-center gap-2 text-sm">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <span className="text-muted-foreground">→</span>}
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1",
              i + 1 <= step ? "bg-primary/10 text-primary font-medium" : "bg-muted text-muted-foreground"
            )}
          >
            <span className="font-mono text-xs">{i + 1}</span>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function DuplikatTable({ duplicates }: { duplicates: CashflowDuplicate[] }) {
  if (duplicates.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h4 className="text-sm font-semibold text-muted-foreground">
        Baris duplikat — dilewati, tidak disimpan ({duplicates.length})
      </h4>
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto opacity-60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Sheet</TableHead>
              <TableHead className="w-24">Tanggal</TableHead>
              <TableHead className="w-32">FT Number</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="w-28 text-right">Nominal</TableHead>
              <TableHead className="w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {duplicates.map((d, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm">{d.sheet}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">{d.tanggal}</TableCell>
                <TableCell className="font-mono text-xs">{d.ft_number ?? "—"}</TableCell>
                <TableCell className="text-sm max-w-64 truncate">{d.deskripsi}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatNominal(d.nominal)}</TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    DUPLIKAT
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function UploadWizard({
  kategoris,
  donaturs,
  onClose,
}: {
  kategoris: CashflowKategori[];
  donaturs: DonaturOption[];
  onClose: () => void;
}) {
  const uploadMutation = useUploadCashflow();
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<UploadCashflowResult | null>(null);

  const step: 1 | 2 = batch ? 2 : 1;
  const rows = batch?.inserted ?? [];
  const unknownCount = rows.filter((r) => r.status_klasifikasi === "unknown").length;
  const cashIn = rows.filter((r) => r.tipe === "cash_in").length;
  const cashOut = rows.length - cashIn;

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate(file, { onSuccess: (data) => data && setBatch(data) });
  };

  // Baris batch diperbarui in-place dari response PUT (status dihitung ulang backend)
  const handleRowUpdated = (updated: Cashflow) =>
    setBatch((prev) =>
      prev
        ? { ...prev, inserted: prev.inserted.map((r) => (r.id === updated.id ? updated : r)) }
        : prev
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StepIndicator step={step} />
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4 mr-1.5" />
          Tutup
        </Button>
      </div>

      {step === 1 && (
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4 max-w-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Upload Mutasi Rekening</h3>
              <p className="text-sm text-muted-foreground">
                File .xlsx ekspor mutasi BSI — 1 sheet per bulan. Baris duplikat (FT Number +
                nominal sudah ada) otomatis dilewati; sisanya langsung tersimpan dan
                di-auto-klasifikasi.
              </p>
            </div>
          </div>
          <Input
            type="file"
            accept=".xlsx"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
            disabled={uploadMutation.isPending}
          />
          <Button onClick={handleUpload} disabled={!file || uploadMutation.isPending}>
            <Upload className="h-4 w-4 mr-2" />
            {uploadMutation.isPending ? "Memproses…" : "Upload & Proses"}
          </Button>
        </div>
      )}

      {step === 2 && batch && (
        <div className="space-y-4">
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard icon={FileSpreadsheet} label="Total Baris" value={String(batch.summary.total_rows)} />
            <StatCard icon={ArrowDownCircle} label="Cash In" value={String(cashIn)} />
            <StatCard icon={ArrowUpCircle} label="Cash Out" value={String(cashOut)} />
            <StatCard icon={Copy} label="Duplikat" value={String(batch.summary.duplicate_count)} />
            <StatCard icon={HelpCircle} label="Belum Klasifikasi" value={String(unknownCount)} />
          </div>

          {unknownCount > 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {unknownCount} baris belum terklasifikasi — lengkapi kategori (dan donatur untuk
              Cash In) di kolom Klasifikasi. Setiap perubahan langsung tersimpan.
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Semua baris terklasifikasi. Klik Selesai untuk menutup wizard.
            </div>
          )}

          <CashflowTable
            rows={rows}
            kategoris={kategoris}
            donaturs={donaturs}
            editable
            onRowUpdated={handleRowUpdated}
          />

          <DuplikatTable duplicates={batch.duplicates} />

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setBatch(null);
                setFile(null);
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Ulang
            </Button>
            {/* Tidak memanggil endpoint apa pun — semua baris sudah persist;
                tombol ini hanya penutup wizard, nonaktif selama masih ada unknown */}
            <Button onClick={onClose} disabled={unknownCount > 0}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Selesai
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
