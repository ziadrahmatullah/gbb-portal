import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SearchableSelect,
  Skeleton,
  cn,
} from "@gbb/ui";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { hasAnyRole } from "@/shared/constants/roles";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
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
import { useMentorOptions, useMentorRequestList, useUpdateMentorRequest } from "../hooks/useMentor";
import type { MentorRequestRes } from "../services";

const ALL = "all";

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

function RequestStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        status === "pending" &&
          "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
        status === "matched" &&
          "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
        status === "done" && "border-primary/30 bg-primary/10 text-primary"
      )}
    >
      {status}
    </Badge>
  );
}

const REQUEST_STATUS_ORDER = ["pending", "matched", "done"] as const;
export type RequestStatus = (typeof REQUEST_STATUS_ORDER)[number];

// Kontrol status: badge status AKTIF saja + menu pilihan. Menggantikan slider
// 3 segmen yang labelnya tumpang-tindih di kolom sempit (masukan PCM Sep 2026).
// Pilih "matched" TIDAK langsung PUT — pemanggil membuka dialog matching
// (mentor wajib dipilih); "done" hanya bisa bila request sudah punya mentor.
function RequestStatusMenu({
  request,
  disabled,
  onSelect,
}: {
  request: MentorRequestRes;
  disabled?: boolean;
  onSelect: (status: RequestStatus) => void;
}) {
  const canGo = (s: RequestStatus) => {
    if (s === request.status) return false;
    if (s === "done") return !!request.mentor_id;
    return true;
  };
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          title="Ubah status"
          className="inline-flex items-center gap-1 rounded-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RequestStatusBadge status={request.status} />
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {REQUEST_STATUS_ORDER.map((s) => {
          const isCurrent = s === request.status;
          const allowed = canGo(s);
          return (
            <DropdownMenuItem
              key={s}
              disabled={!isCurrent && !allowed}
              onSelect={() => allowed && onSelect(s)}
              className="justify-between capitalize"
            >
              {s}
              {isCurrent && <Check className="size-3.5" />}
            </DropdownMenuItem>
          );
        })}
        {!request.mentor_id && (
          <p className="px-2 pb-1 pt-1.5 text-xs text-muted-foreground">
            Matching mentor dulu sebelum menandai selesai
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Dialog matching / ganti mentor: PUT {status:"matched", mentor_id}
function MatchingDialog({
  request,
  onClose,
}: {
  request: MentorRequestRes | null;
  onClose: () => void;
}) {
  const { data: options } = useMentorOptions();
  const mutation = useUpdateMentorRequest();
  const [mentorId, setMentorId] = useState("");
  // Prefill mentor saat ini (kasus Ganti Mentor) — adjust-during-render
  const [prevId, setPrevId] = useState<number | null>(null);
  if (request && request.id !== prevId) {
    setPrevId(request.id);
    setMentorId(request.mentor_id ? String(request.mentor_id) : "");
  }

  const handleClose = () => {
    mutation.reset();
    onClose();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!request || !mentorId) return;
    mutation.mutate(
      { id: request.id, body: { status: "matched", mentor_id: Number(mentorId) } },
      { onSuccess: handleClose }
    );
  };

  return (
    <Dialog open={!!request} onOpenChange={(o: boolean) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {request?.mentor_id ? "Ganti Mentor" : "Matching Mentor"}
            {request ? ` — ${request.beswan_nama}` : ""}
          </DialogTitle>
          <DialogDescription>
            Beswan akan mendapat notifikasi in-app otomatis setelah di-matching.
          </DialogDescription>
        </DialogHeader>
        {request?.curhat_text && (
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm italic">
            “{request.curhat_text}”
          </p>
        )}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Mentor</Label>
            <SearchableSelect
              value={mentorId}
              onChange={(v: string) => {
                setMentorId(v);
                mutation.reset();
              }}
              options={(options?.items ?? []).map((m) => ({
                id: String(m.id),
                name: `${m.nama} — ${m.bidang_keahlian}`,
              }))}
              placeholder="Pilih mentor"
              searchPlaceholder="Cari mentor…"
              emptyMessage="Mentor tidak ditemukan"
              disabled={mutation.isPending}
              hideClear
            />
          </div>
          {/* Pesan 400/404 backend, mis. "tentukan mentor untuk matching request ini" */}
          {mutation.error && <p className="text-sm text-destructive">{mutation.error.message}</p>}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending || !mentorId}>
              {mutation.isPending ? "Menyimpan…" : "Matching"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MentorRequestsTab() {
  // Aksi matching/selesai dibatasi backend ke admin/pcm
  const role = useAuthStore((s) => s.role);
  const canAct = useMemo(() => hasAnyRole(role, ["admin", "pcm"]), [role]);

  // Default "Semua" (tanpa param status): baris tidak hilang dari tampilan
  // setelah aksi matching/selesai — badge statusnya saja yang berubah.
  // List sudah terurut terbaru dulu dari backend, jangan sort ulang di FE.
  const [status, setStatus] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [matching, setMatching] = useState<MentorRequestRes | null>(null);

  const { data, isLoading } = useMentorRequestList({
    page,
    limit,
    status: status === ALL ? undefined : (status as "pending" | "matched" | "done"),
  });
  const updateMutation = useUpdateMentorRequest();

  // Pilih status dari menu: "matched" lewat dialog (mentor wajib), sisanya PUT langsung
  const handleStatusSelect = (r: MentorRequestRes, s: RequestStatus) => {
    if (s === "matched") {
      setMatching(r);
    } else {
      updateMutation.mutate({ id: r.id, body: { status: s } });
    }
  };

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="space-y-4">
      {/* Filter status (default: pending) */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={status}
          onValueChange={(v: string) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="matched">Matched</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Beswan</TableHead>
              <TableHead>Curhat / Clue</TableHead>
              <TableHead className="w-44">Mentor</TableHead>
              <TableHead className="w-28">Masuk</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead className="w-36 text-right">Aksi</TableHead>
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
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada request mentor
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.beswan_nama}</TableCell>
                  <TableCell>
                    {/* Truncate + tooltip title untuk curhat panjang */}
                    <p
                      className="max-w-80 truncate text-sm text-muted-foreground"
                      title={r.curhat_text ?? undefined}
                    >
                      {r.curhat_text || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{r.mentor_nama || "—"}</TableCell>
                  <TableCell className="text-sm">{formatTanggal(r.created_at)}</TableCell>
                  <TableCell>
                    {canAct ? (
                      <RequestStatusMenu
                        request={r}
                        disabled={updateMutation.isPending}
                        onSelect={(s) => handleStatusSelect(r, s)}
                      />
                    ) : (
                      <RequestStatusBadge status={r.status} />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canAct && r.status === "matched" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMatching(r)}
                        disabled={updateMutation.isPending}
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Ganti Mentor
                      </Button>
                    )}
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

      <MatchingDialog request={matching} onClose={() => setMatching(null)} />
    </div>
  );
}
