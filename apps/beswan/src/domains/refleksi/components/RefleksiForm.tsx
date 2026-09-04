import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { CheckCircle2, FileText, Paperclip, Save, Send, X } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  FileDropzone,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@gbb/ui";
import { assetUrl } from "@/domains/beranda/services";
import { parseJSONString } from "../services";
import type { Kondisi, OpsiPilihan, Pertanyaan, RefleksiRes } from "../services";
import { useSaveDraft, useSubmitRefleksi, useUploadDokumentasi } from "../hooks/useRefleksi";

interface Props {
  pertanyaan: Pertanyaan[];
  existing: RefleksiRes | null;
  periodeId: number;
  bulan: number;
  tahun: number;
  // Nama pemilik akun → jawaban otomatis pertanyaan kode "nama_lengkap"
  namaLengkap: string;
  // Label bulan terpilih di header → default pertanyaan kode "periode_bulan"
  bulanLabel?: string;
}

// Kode pertanyaan seed backend (migration/seed.go) yang diperlakukan khusus —
// kode adalah identifier stabil, aman dirujuk dari FE.
const NAMA_KODE = "nama_lengkap";
const BULAN_KODE = "periode_bulan";

function parseFileUrls(nilai?: string): string[] {
  const parsed = parseJSONString<string[]>(nilai);
  return Array.isArray(parsed) ? parsed : [];
}

function LinearScaleField({
  opsi,
  value,
  onChange,
}: {
  opsi: OpsiPilihan;
  value: string;
  onChange: (v: string) => void;
}) {
  const min = opsi.min ?? 1;
  const max = opsi.max ?? 10;
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(String(n))}
            className={`h-9 w-9 rounded-lg border text-sm transition-colors ${
              value === String(n)
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card hover:bg-muted"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground max-w-md">
        <span>
          {min} = {opsi.label_min}
        </span>
        <span>
          {max} = {opsi.label_max}
        </span>
      </div>
    </div>
  );
}

function FileUploadField({
  q,
  opsi,
  urls,
  onRemoveUrl,
  pending,
  onPickFiles,
  onRemovePending,
}: {
  q: Pertanyaan;
  opsi: OpsiPilihan;
  urls: string[];
  onRemoveUrl: (url: string) => void;
  pending: File[];
  onPickFiles: (files: File[]) => void;
  onRemovePending: (idx: number) => void;
}) {
  const maxMb = opsi.max_mb ?? 5;

  return (
    <div className="space-y-2">
      {urls.length > 0 && (
        <ul className="space-y-1">
          {urls.map((u) => (
            <li key={u} className="flex items-center gap-2 text-sm">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <a href={assetUrl(u)} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                {u.split("/").pop()}
              </a>
              <button type="button" onClick={() => onRemoveUrl(u)} aria-label="Hapus file" className="text-muted-foreground hover:text-destructive">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {pending.length > 0 && (
        <ul className="space-y-1">
          {pending.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="size-4 shrink-0" />
              <span className="truncate">{f.name}</span>
              <span className="text-xs">(belum diupload)</span>
              <button type="button" onClick={() => onRemovePending(i)} aria-label="Batalkan file" className="hover:text-destructive">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* value sengaja tidak diisi: daftar file pending dirender di atas,
          jadi onChange cukup mengirim file yang baru dipilih untuk di-append */}
      <FileDropzone
        id={`file-${q.id}`}
        accept={(opsi.accept ?? []).join(",")}
        multiple={opsi.multiple ?? false}
        maxSizeMb={maxMb}
        onChange={(files: File | File[] | null) =>
          onPickFiles(Array.isArray(files) ? files : files ? [files] : [])
        }
        onReject={(msg: string) => toast.error(msg)}
        hint={`Maks ${maxMb} MB per file${opsi.accept?.length ? ` · ${opsi.accept.join(", ")}` : ""}`}
      />
    </div>
  );
}

export function RefleksiForm({
  pertanyaan,
  existing,
  periodeId,
  bulan,
  tahun,
  namaLengkap,
  bulanLabel,
}: Props) {
  const saveDraft = useSaveDraft();
  const submit = useSubmitRefleksi();
  const upload = useUploadDokumentasi();

  // Prefill sekali di mount — parent me-remount form via key saat bulan/periode ganti
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const j of existing?.jawaban ?? []) init[j.pertanyaan_id] = j.nilai;
    // "Periode laporan bulan" default mengikuti bulan yang dipilih di header
    // (masih bisa diganti beswan); hanya bila belum pernah dijawab
    const bulanQ = pertanyaan.find((q) => q.kode === BULAN_KODE);
    if (bulanQ && !init[bulanQ.id] && bulanLabel) {
      const pilihan = parseJSONString<OpsiPilihan>(bulanQ.opsi)?.pilihan ?? [];
      if (pilihan.includes(bulanLabel)) init[bulanQ.id] = bulanLabel;
    }
    return init;
  });
  const [pendingFiles, setPendingFiles] = useState<Record<number, File[]>>({});
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const kodeToId = useMemo(() => {
    const m: Record<string, number> = {};
    for (const q of pertanyaan) m[q.kode] = q.id;
    return m;
  }, [pertanyaan]);

  // Jawaban OTOMATIS yang selalu menimpa state: nama lengkap dari akun (PCM:
  // beswan tidak perlu menulis ulang namanya). Dihitung saat render, bukan
  // disimpan di state, supaya tetap benar walau profil termuat setelah mount.
  const autoAnswers = useMemo(() => {
    const m: Record<number, string> = {};
    const namaId = kodeToId[NAMA_KODE];
    if (namaId != null && namaLengkap.trim()) m[namaId] = namaLengkap.trim();
    return m;
  }, [kodeToId, namaLengkap]);
  const effective = useMemo(() => ({ ...answers, ...autoAnswers }), [answers, autoAnswers]);

  const isVisible = (q: Pertanyaan): boolean => {
    const kondisi = parseJSONString<Kondisi>(q.kondisi);
    if (!kondisi) return true;
    const depId = kodeToId[kondisi.depends_on_kode];
    return depId != null && effective[depId] === kondisi.equals;
  };

  const setAnswer = (qid: number, nilai: string) =>
    setAnswers((prev) => ({ ...prev, [qid]: nilai }));

  const isFilled = (q: Pertanyaan, merged: Record<number, string>) => {
    const v = merged[q.id];
    if (!v) return false;
    if (q.field_type === "file_upload") return parseFileUrls(v).length > 0;
    return v.trim() !== "";
  };

  // Upload dokumentasi DULU, merge URL ke nilai (JSON string array), lalu
  // kembalikan snapshot answers final untuk payload.
  const resolveUploads = async (): Promise<Record<number, string>> => {
    const merged = { ...answers };
    for (const [qidStr, files] of Object.entries(pendingFiles)) {
      if (!files.length) continue;
      const qid = Number(qidStr);
      const urls = await upload.mutateAsync(files);
      merged[qid] = JSON.stringify([...parseFileUrls(merged[qid]), ...urls]);
    }
    setAnswers(merged);
    setPendingFiles({});
    return merged;
  };

  const buildPayload = (merged: Record<number, string>) => {
    const all = { ...merged, ...autoAnswers };
    return {
      periode_id: periodeId,
      bulan,
      tahun,
      // Hanya jawaban terisi & pertanyaan yang tampil (kondisi terpenuhi)
      jawaban: pertanyaan
        .filter((q) => isVisible(q) && isFilled(q, all))
        .map((q) => ({ pertanyaan_id: q.id, nilai: all[q.id] })),
    };
  };

  const handleDraft = async () => {
    setSubmitError("");
    try {
      const merged = await resolveUploads();
      await saveDraft.mutateAsync(buildPayload(merged));
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSubmit = async () => {
    setSubmitError("");
    try {
      const merged = await resolveUploads();
      await submit.mutateAsync(buildPayload(merged));
      setConfirmSubmit(false);
    } catch (e) {
      // 400 "pertanyaan wajib belum diisi: <label>" ditampilkan apa adanya
      setSubmitError(e instanceof Error ? e.message : String(e));
      setConfirmSubmit(false);
    }
  };

  const busy = saveDraft.isPending || submit.isPending || upload.isPending;

  if (existing?.status === "submitted") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950">
        <CheckCircle2 className="mx-auto size-8 text-emerald-600 dark:text-emerald-400" />
        <p className="mt-2 font-medium text-emerald-800 dark:text-emerald-200">
          Refleksi bulan ini sudah disubmit
        </p>
        {existing.submitted_at && (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {new Date(existing.submitted_at).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
          </p>
        )}
        <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80">
          Jawaban terkunci setelah submit. Terima kasih sudah berbagi! 🙌
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pertanyaan.filter(isVisible).map((q, idx) => {
        const opsi = parseJSONString<OpsiPilihan>(q.opsi) ?? {};
        const value = effective[q.id] ?? "";
        const isAuto = q.id in autoAnswers;
        return (
          <Card key={q.id} className="gap-2 py-4">
            <CardContent className="space-y-2 px-4">
            <Label htmlFor={`q-${q.id}`} className="flex gap-1.5 text-sm font-medium">
              <span className="text-muted-foreground">{idx + 1}.</span>
              <span>
                {q.label}
                {q.is_required && <span className="text-destructive"> *</span>}
              </span>
            </Label>

            {q.field_type === "short_text" &&
              (isAuto ? (
                <>
                  <Input id={`q-${q.id}`} value={value} readOnly disabled className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">
                    Terisi otomatis dari akunmu — hubungi Tim Program GBB bila nama tidak sesuai.
                  </p>
                </>
              ) : (
                <Input
                  id={`q-${q.id}`}
                  value={value}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setAnswer(q.id, e.target.value)}
                  disabled={busy}
                />
              ))}

            {q.field_type === "long_text" && (
              <Textarea
                id={`q-${q.id}`}
                rows={3}
                value={value}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAnswer(q.id, e.target.value)}
                disabled={busy}
              />
            )}

            {/* dropdown = Select sungguhan (masukan PCM Sep 2026: deretan radio
                12 bulan terlalu ramai); single_choice tetap pilihan radio */}
            {q.field_type === "dropdown" && (
              <Select
                value={value}
                onValueChange={(v: string) => setAnswer(q.id, v)}
                disabled={busy}
              >
                <SelectTrigger id={`q-${q.id}`} className="w-full sm:w-64">
                  <SelectValue placeholder="Pilih…" />
                </SelectTrigger>
                <SelectContent>
                  {(opsi.pilihan ?? []).map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {q.field_type === "single_choice" && (
              <div className="flex flex-wrap gap-2">
                {(opsi.pilihan ?? []).map((p) => (
                  <label
                    key={p}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                      value === p ? "border-primary bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={value === p}
                      onChange={() => setAnswer(q.id, p)}
                      disabled={busy}
                    />
                    {p}
                  </label>
                ))}
              </div>
            )}

            {q.field_type === "linear_scale" && (
              <LinearScaleField opsi={opsi} value={value} onChange={(v) => setAnswer(q.id, v)} />
            )}

            {q.field_type === "file_upload" && (
              <FileUploadField
                q={q}
                opsi={opsi}
                urls={parseFileUrls(value)}
                onRemoveUrl={(url) =>
                  setAnswer(q.id, JSON.stringify(parseFileUrls(value).filter((u) => u !== url)))
                }
                pending={pendingFiles[q.id] ?? []}
                onPickFiles={(files) =>
                  setPendingFiles((prev) => ({ ...prev, [q.id]: [...(prev[q.id] ?? []), ...files] }))
                }
                onRemovePending={(idx2) =>
                  setPendingFiles((prev) => ({
                    ...prev,
                    [q.id]: (prev[q.id] ?? []).filter((_, i) => i !== idx2),
                  }))
                }
              />
            )}
            </CardContent>
          </Card>
        );
      })}

      {submitError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={handleDraft} disabled={busy}>
          <Save className="size-4" />
          {saveDraft.isPending ? "Menyimpan…" : "Simpan Draft"}
        </Button>
        {confirmSubmit ? (
          <>
            <span className="text-sm text-muted-foreground">
              Jawaban terkunci setelah submit. Yakin?
            </span>
            <Button onClick={handleSubmit} disabled={busy}>
              {submit.isPending ? "Mengirim…" : "Ya, Submit"}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmSubmit(false)} disabled={busy}>
              Batal
            </Button>
          </>
        ) : (
          <Button onClick={() => setConfirmSubmit(true)} disabled={busy}>
            <Send className="size-4" />
            Submit Refleksi
          </Button>
        )}
      </div>
    </div>
  );
}
