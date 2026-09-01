import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Copy,
  FileSpreadsheet,
  HelpCircle,
  RotateCcw,
  Save,
  Upload,
  X,
} from "lucide-react";
import { Badge, Card, CardContent, FileDropzone } from "@gbb/ui";
import { cn } from "@/lib/utils";
import { StatCard } from "@/shared/components/StatCard";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
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
import { useCommitCashflow, usePreviewCashflow } from "../hooks/useKeuangan";
import type {
  CashflowDraft,
  CashflowDuplicate,
  CashflowKategori,
  CommitCashflowResult,
  CommitCashflowRow,
  PreviewCashflowResult,
  UpdateCashflowReq,
} from "../services";
import { MUTASI_SUMBER, invalidRowKeysOf, mutasiSumberMeta } from "../services";
import type { DonaturOption } from "@/domains/donatur/services";
import type { CashflowRow } from "./CashflowTable";
import { CashflowTable } from "./CashflowTable";
import { applyKlasifikasiPatch, formatNominal } from "../utils";

type Step = 1 | 2 | 3;

function StepIndicator({ step }: { step: Step }) {
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
        Baris duplikat — dilewati, tidak akan disimpan ({duplicates.length})
      </h4>
      <div className="overflow-x-auto rounded-md border bg-card opacity-60">
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
                  <Badge variant="outline" className="text-muted-foreground">
                    DUPLIKAT
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const toCommitRow = (r: CashflowDraft): CommitCashflowRow => ({
  row_key: r.row_key,
  sheet: r.sheet,
  tanggal: r.tanggal,
  ft_number: r.ft_number,
  deskripsi: r.deskripsi,
  nominal: r.nominal,
  tipe: r.tipe,
  kat_bsi: r.kat_bsi,
  kategori_id: r.kategori_id,
  sub_kategori_id: r.sub_kategori_id,
  donatur_id: r.donatur_id,
  is_anonymous: r.is_anonymous,
  catatan: r.catatan,
});

export function UploadWizard({
  kategoris,
  donaturs,
  onClose,
}: {
  kategoris: CashflowKategori[];
  donaturs: DonaturOption[];
  onClose: () => void;
}) {
  const previewMutation = usePreviewCashflow();
  const commitMutation = useCommitCashflow();
  const [file, setFile] = useState<File | null>(null);
  // Jenis mutasi dipilih lebih dulu — parser (dan format file) mengikutinya
  const [sumber, setSumber] = useState("");
  const sumberMeta = mutasiSumberMeta(sumber);
  // Hasil preview: belum ada satu baris pun di DB. Semua edit klasifikasi
  // hidup di state ini sampai user menekan Simpan.
  const [preview, setPreview] = useState<PreviewCashflowResult | null>(null);
  const [rows, setRows] = useState<CashflowDraft[]>([]);
  const [saved, setSaved] = useState<CommitCashflowResult | null>(null);
  // Baris yang ditolak backend saat commit. Tombol Simpan sudah dikunci selama
  // masih ada unknown, jadi ini jaring pengaman untuk kasus desync — mis.
  // kategori dinonaktifkan orang lain setelah preview diambil.
  const [invalidRowKeys, setInvalidRowKeys] = useState<string[]>([]);

  const step: Step = saved ? 3 : preview ? 2 : 1;
  const unknownCount = rows.filter((r) => r.status_klasifikasi === "unknown").length;
  const cashIn = rows.filter((r) => r.tipe === "cash_in").length;
  const cashOut = rows.length - cashIn;

  const handlePreview = () => {
    if (!file || !sumber) return;
    previewMutation.mutate(
      { file, sumber },
      {
        onSuccess: (data) => {
          if (!data) return;
          setPreview(data);
          setRows(data.rows);
          setInvalidRowKeys([]);
        },
      }
    );
  };

  // Edit klasifikasi hanya menyentuh state lokal — tidak ada request ke backend
  const handleDraftChange = (row: CashflowRow, patch: UpdateCashflowReq) => {
    if ("id" in row) return; // di wizard semua baris masih draft
    setRows((prev) =>
      prev.map((r) =>
        r.row_key === row.row_key ? applyKlasifikasiPatch(r, patch, kategoris, donaturs) : r
      )
    );
    setInvalidRowKeys((prev) => prev.filter((k) => k !== row.row_key));
  };

  const handleRemoveRow = (row: CashflowRow) => {
    if ("id" in row) return;
    setRows((prev) => prev.filter((r) => r.row_key !== row.row_key));
    toast(`Baris "${row.deskripsi}" dikeluarkan dari batch`);
  };

  const handleReset = () => {
    setPreview(null);
    setRows([]);
    setSaved(null);
    setFile(null);
    setInvalidRowKeys([]);
  };

  // Aman diulang: backend mengecek duplikat lagi saat commit, jadi menekan
  // Simpan dua kali atau me-retry setelah gagal jaringan tidak menggandakan data
  const handleCommit = () => {
    if (rows.length === 0 || unknownCount > 0) return;
    commitMutation.mutate(rows.map(toCommitRow), {
      onSuccess: (data) => {
        if (!data) return;
        setInvalidRowKeys([]);
        setSaved(data);
      },
      // Pesan error-nya sudah di-toast interceptor; di sini hanya row_key-nya
      // yang dipanen untuk menyorot baris. Error 400 lain (referensi kategori/
      // donatur) tidak membawa row_key dan cukup ditangani toast itu.
      onError: (err) => setInvalidRowKeys(invalidRowKeysOf(err)),
    });
  };

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
        <Card className="max-w-xl">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Upload Mutasi Rekening</h3>
                <p className="text-sm text-muted-foreground">
                  Pilih jenis mutasi dulu, lalu unggah filenya. File hanya dibaca dan
                  di-auto-klasifikasi dulu; <strong>belum ada yang masuk database</strong>. Baris
                  duplikat (FT Number + nominal sudah ada) otomatis dilewati.
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mutasi-sumber">Jenis mutasi</Label>
              <Select
                value={sumber}
                onValueChange={(v: string) => {
                  setSumber(v);
                  // Format file beda per jenis — file yang sudah dipilih dibuang
                  setFile(null);
                }}
                disabled={previewMutation.isPending}
              >
                <SelectTrigger id="mutasi-sumber">
                  <SelectValue placeholder="Pilih jenis mutasi…" />
                </SelectTrigger>
                <SelectContent>
                  {MUTASI_SUMBER.map((s) => (
                    <SelectItem key={s.value} value={s.value} disabled={!s.aktif}>
                      {s.aktif ? s.label : `${s.label} — belum tersedia`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {sumberMeta
                  ? sumberMeta.keterangan
                  : "Untuk sekarang baru mutasi BSI yang bisa diparse; jenis lain menyusul."}
              </p>
            </div>

            {sumberMeta ? (
              <FileDropzone
                accept={sumberMeta.accept}
                value={file}
                onChange={(f: File | null) => setFile(f)}
                onReject={(msg: string) => toast.error(msg)}
                disabled={previewMutation.isPending}
                hint={sumberMeta.hint}
                zoneClassName="py-8"
              />
            ) : (
              <div className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
                Pilih jenis mutasi dulu untuk mengunggah file.
              </div>
            )}
            <Button onClick={handlePreview} disabled={!file || !sumber || previewMutation.isPending}>
              <Upload className="h-4 w-4 mr-2" />
              {previewMutation.isPending ? "Membaca file…" : "Upload & Proses"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && preview && (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <StatCard icon={FileSpreadsheet} label="Total Baris" value={String(preview.summary.total_rows)} />
            <StatCard icon={ArrowDownCircle} label="Cash In" value={String(cashIn)} />
            <StatCard icon={ArrowUpCircle} label="Cash Out" value={String(cashOut)} />
            <StatCard icon={Copy} label="Duplikat" value={String(preview.summary.duplicate_count)} />
            <StatCard icon={HelpCircle} label="Belum Klasifikasi" value={String(unknownCount)} />
          </div>

          {unknownCount > 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {unknownCount} baris belum terklasifikasi — lengkapi donatur pada baris Cash In
              sebelum bisa menyimpan. Kategori mengikuti hasil bacaan file dan tidak bisa diubah
              di sini; baris yang kategorinya belum terbaca perlu dikeluarkan dari batch.
              Perubahan di sini belum tersimpan.
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Semua baris terklasifikasi. Klik Simpan untuk memasukkan {rows.length} baris ke
              database.
            </div>
          )}

          {invalidRowKeys.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {invalidRowKeys.length} baris ditolak server dan disorot merah di bawah —
              perbaiki klasifikasinya lalu Simpan lagi. Tidak ada baris yang tersimpan.
            </div>
          )}

          <CashflowTable
            rows={rows}
            kategoris={kategoris}
            donaturs={donaturs}
            editable
            onDraftChange={handleDraftChange}
            onDelete={handleRemoveRow}
            invalidRowKeys={new Set(invalidRowKeys)}
          />

          <DuplikatTable duplicates={preview.duplicates} />

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleReset} disabled={commitMutation.isPending}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Ulang
            </Button>
            <Button
              onClick={handleCommit}
              disabled={commitMutation.isPending || rows.length === 0 || unknownCount > 0}
            >
              <Save className="h-4 w-4 mr-2" />
              {commitMutation.isPending ? "Menyimpan…" : `Simpan ${rows.length} Baris`}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && saved && (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            <StatCard icon={CheckCircle2} label="Tersimpan" value={String(saved.summary.inserted_count)} />
            <StatCard icon={Copy} label="Dilewati (duplikat)" value={String(saved.summary.skipped_count)} />
            <StatCard icon={FileSpreadsheet} label="Dikirim" value={String(saved.summary.requested)} />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {saved.summary.inserted_count} baris tersimpan ke database.
          </div>

          {/* Selisih requested vs inserted itu normal, bukan kegagalan */}
          {saved.summary.skipped_count > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <Copy className="h-4 w-4 shrink-0" />
              {saved.summary.skipped_count} dari {saved.summary.requested} baris dilewati
              karena FT Number + nominal-nya sudah ada di database.
            </div>
          )}

          <CashflowTable rows={saved.inserted} kategoris={kategoris} donaturs={donaturs} editable={false} />

          <DuplikatTable duplicates={saved.skipped} />

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Lagi
            </Button>
            <Button onClick={onClose}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Selesai
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
