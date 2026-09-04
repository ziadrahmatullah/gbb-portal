import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, Search, ShieldCheck } from "lucide-react";
import { Badge, Skeleton, cn } from "@gbb/ui";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { hasAnyRole } from "@/shared/constants/roles";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
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
import { useMentorPendaftaranList, useUpdateMentorPendaftaran } from "../hooks/useMentor";
import type { MentorPendaftaran, PendaftaranStatus } from "../services";
import { UndipBadge } from "./MentorDialogs";

const ALL = "all";

const STATUS_LABEL: Record<PendaftaranStatus, string> = {
  menunggu: "Belum verifikasi",
  perlu_info: "Perlu info tambahan",
  terdaftar: "Terdaftar",
  ditolak: "Ditolak",
};

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export function PendaftaranStatusBadge({ status }: { status: PendaftaranStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "menunggu" &&
          "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-300",
        status === "perlu_info" &&
          "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-400",
        status === "terdaftar" &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        status === "ditolak" && "text-muted-foreground line-through"
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

type Keputusan = "terdaftar" | "perlu_info" | "ditolak";

// Dialog verifikasi — tiga keputusan. Saat Setujui, verifikator boleh
// mengoreksi bidang keahlian & UNDIP sebelum promosi: bidang dari pendaftar
// itu teks bebas dan langsung jadi opsi filter di Database Mentor.
function VerifikasiDialog({
  row,
  onClose,
}: {
  row: MentorPendaftaran | null;
  onClose: () => void;
}) {
  const mutation = useUpdateMentorPendaftaran();
  const [keputusan, setKeputusan] = useState<Keputusan>("terdaftar");
  const [catatan, setCatatan] = useState("");
  const [bidang, setBidang] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  // Prefill saat baris berganti (adjust-during-render, bukan effect)
  const [prevId, setPrevId] = useState<number | null>(null);
  if (row && row.id !== prevId) {
    setPrevId(row.id);
    setKeputusan("terdaftar");
    setCatatan("");
    setBidang(row.bidang_keahlian);
    setIsInternal(row.is_internal);
    mutation.reset();
  }

  const handleClose = () => {
    mutation.reset();
    onClose();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!row) return;
    mutation.mutate(
      {
        id: row.id,
        body: {
          status: keputusan,
          catatan: catatan.trim() || undefined,
          // String kosong = tidak diubah (konvensi BE); kirim hanya bila beda
          bidang_keahlian:
            keputusan === "terdaftar" && bidang.trim() !== row.bidang_keahlian
              ? bidang.trim()
              : undefined,
          is_internal: keputusan === "terdaftar" && isInternal !== row.is_internal ? isInternal : undefined,
        },
      },
      { onSuccess: handleClose }
    );
  };

  const needCatatan = keputusan === "perlu_info" && !catatan.trim();

  return (
    <Dialog open={!!row} onOpenChange={(o: boolean) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Verifikasi Pendaftaran{row ? ` — ${row.nama}` : ""}</DialogTitle>
          <DialogDescription>
            Pendaftar melihat status & catatan ini di portalnya. Setujui = masuk Database
            Mentor dan bisa dipasang ke event.
          </DialogDescription>
        </DialogHeader>
        {row && (
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm space-y-1">
            <div>
              <span className="text-muted-foreground">Email:</span> {row.email || "—"}
              {row.hp && <> · <span className="text-muted-foreground">HP:</span> {row.hp}</>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Deklarasi:</span>
              <UndipBadge isInternal={row.is_internal} />
              {row.cv_url && (
                <a href={row.cv_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  <FileText className="h-3.5 w-3.5" /> CV
                </a>
              )}
              {row.linkedin_url && (
                <a href={row.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
                </a>
              )}
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Keputusan</Label>
            <Select value={keputusan} onValueChange={(v: string) => setKeputusan(v as Keputusan)} disabled={mutation.isPending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terdaftar">Setujui — daftarkan sebagai mentor</SelectItem>
                <SelectItem value="perlu_info">Perlu info tambahan</SelectItem>
                <SelectItem value="ditolak">Tolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {keputusan === "terdaftar" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="vp-bidang">Bidang keahlian (koreksi bila perlu)</Label>
                <Input
                  id="vp-bidang"
                  value={bidang}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBidang(e.target.value)}
                  required
                  disabled={mutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Nilai ini jadi opsi filter Bidang di Database Mentor — samakan penulisannya
                  dengan yang sudah ada.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Switch checked={isInternal} onCheckedChange={setIsInternal} disabled={mutation.isPending} />
                Alumni UNDIP
              </label>
            </>
          )}

          {keputusan !== "terdaftar" && (
            <div className="grid gap-2">
              <Label htmlFor="vp-catatan">
                Catatan untuk pendaftar {keputusan === "perlu_info" ? "(wajib)" : "(opsional)"}
              </Label>
              <Textarea
                id="vp-catatan"
                rows={3}
                value={catatan}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCatatan(e.target.value)}
                placeholder={
                  keputusan === "perlu_info"
                    ? "mis. CV yang diunggah tidak terbaca, mohon unggah ulang"
                    : "Alasan penolakan (tidak wajib)"
                }
                disabled={mutation.isPending}
              />
            </div>
          )}

          {mutation.error && <p className="text-sm text-destructive">{mutation.error.message}</p>}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Batal
            </Button>
            <Button
              type="submit"
              variant={keputusan === "ditolak" ? "destructive" : "default"}
              disabled={mutation.isPending || needCatatan}
            >
              {mutation.isPending
                ? "Menyimpan…"
                : keputusan === "terdaftar"
                  ? "Setujui & Daftarkan"
                  : keputusan === "perlu_info"
                    ? "Minta Info Tambahan"
                    : "Tolak Pendaftaran"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MentorPendaftaranTab() {
  const role = useAuthStore((s) => s.role);
  const canAct = useMemo(() => hasAnyRole(role, ["admin", "pcm"]), [role]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [verifying, setVerifying] = useState<MentorPendaftaran | null>(null);

  const { data, isLoading } = useMentorPendaftaranList({
    page,
    limit,
    search: search || undefined,
    status: status === ALL ? undefined : (status as PendaftaranStatus),
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama/email/bidang…"
            className="pl-9 w-64"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v: string) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua status</SelectItem>
            <SelectItem value="menunggu">Belum verifikasi</SelectItem>
            <SelectItem value="perlu_info">Perlu info tambahan</SelectItem>
            <SelectItem value="terdaftar">Terdaftar</SelectItem>
            <SelectItem value="ditolak">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Bidang</TableHead>
              <TableHead className="w-28">Asal</TableHead>
              <TableHead className="w-28">Masuk</TableHead>
              <TableHead className="w-44">Status</TableHead>
              <TableHead className="w-32 text-right">Aksi</TableHead>
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
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada pendaftaran mentor
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => {
                const menunggu = r.status === "menunggu";
                return (
                  // Baris menunggu disorot (mock deck slide 23) — pembeda visual
                  // yang dulu tidak ada ketika pendaftar langsung masuk tabel mentor
                  <TableRow key={r.id} className={cn(menunggu && "bg-amber-500/10 hover:bg-amber-500/15")}>
                    <TableCell>
                      <div className={cn("font-medium", menunggu && "text-amber-900 dark:text-amber-200")}>
                        {r.nama}
                      </div>
                      <div className="text-xs text-muted-foreground">{r.email || "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{r.bidang_keahlian}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <UndipBadge isInternal={r.is_internal} />
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {r.pendaftar_tipe}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatTanggal(r.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <PendaftaranStatusBadge status={r.status} />
                        {r.catatan && (
                          <span className="max-w-40 truncate text-xs text-muted-foreground" title={r.catatan}>
                            {r.catatan}
                          </span>
                        )}
                        {r.verified_by_nama && r.status !== "menunggu" && (
                          <span className="text-[10px] text-muted-foreground">
                            oleh {r.verified_by_nama}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {canAct && !r.mentor_id && r.status !== "ditolak" && (
                        <Button
                          size="sm"
                          variant={menunggu ? "default" : "outline"}
                          onClick={() => setVerifying(r)}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verifikasi
                        </Button>
                      )}
                      {r.mentor_id && (
                        <span className="text-xs text-muted-foreground">Sudah di Database Mentor</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

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
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <VerifikasiDialog row={verifying} onClose={() => setVerifying(null)} />
    </div>
  );
}
