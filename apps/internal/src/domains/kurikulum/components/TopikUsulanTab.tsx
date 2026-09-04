import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge, Skeleton, cn } from "@gbb/ui";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { hasAnyRole } from "@/shared/constants/roles";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
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
import { useTopikUsulanList, useUpdateTopikUsulanStatus } from "../hooks/useKurikulum";
import type { TopikUsulan, TopikUsulanStatus } from "../services";

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Review",
  reviewed: "Sudah Ditinjau",
  approved: "Disetujui",
  rejected: "Ditolak",
};

function UsulanStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "pending" &&
          "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
        status === "approved" &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        status === "rejected" && "border-destructive/30 bg-destructive/10 text-destructive",
        status === "reviewed" && "text-muted-foreground"
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

// Keputusan setuju/tolak + catatan opsional untuk beswan (masukan PCM Sep 2026
// slide 9: beswan melihat status usulannya). PUT status approved/rejected
// menunggu BE (FEpromt32) — sebelum itu backend menolak 400 dan pesannya
// tampil sebagai toast.
function KeputusanDialog({
  usulan,
  keputusan,
  onClose,
}: {
  usulan: TopikUsulan | null;
  keputusan: Extract<TopikUsulanStatus, "approved" | "rejected">;
  onClose: () => void;
}) {
  const mutation = useUpdateTopikUsulanStatus();
  const [catatan, setCatatan] = useState("");
  const setuju = keputusan === "approved";

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!usulan) return;
    mutation.mutate(
      { id: usulan.id, status: keputusan, catatan: catatan.trim() || undefined },
      {
        onSuccess: () => {
          setCatatan("");
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={!!usulan} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{setuju ? "Setujui Usulan" : "Tolak Usulan"}</DialogTitle>
          <DialogDescription>
            Status dan catatan akan terlihat oleh beswan di halaman Library-nya.
          </DialogDescription>
        </DialogHeader>
        {usulan && (
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span className="font-medium">{usulan.topik_usulan}</span>
            <span className="text-muted-foreground"> — {usulan.nama_beswan}</span>
          </p>
        )}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ku-catatan">Catatan untuk beswan (opsional)</Label>
            <Textarea
              id="ku-catatan"
              rows={3}
              value={catatan}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCatatan(e.target.value)}
              placeholder={
                setuju
                  ? "mis. Akan dibahas di Growth Session bulan depan"
                  : "mis. Topik serupa sudah ada di materi Growth Mindset"
              }
              disabled={mutation.isPending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Batal
            </Button>
            <Button
              type="submit"
              variant={setuju ? "default" : "destructive"}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Menyimpan…" : setuju ? "Setujui" : "Tolak"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TopikUsulanTab() {
  const role = useAuthStore((s) => s.role);
  // PUT /internal/kurikulum/topik-usulan/:id = admin, pcm
  const canDecide = useMemo(() => hasAnyRole(role, ["admin", "pcm"]), [role]);
  const { data, isLoading } = useTopikUsulanList({ limit: 50 });
  const items = data?.items ?? [];
  const [dialog, setDialog] = useState<{
    usulan: TopikUsulan;
    keputusan: "approved" | "rejected";
  } | null>(null);

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Usulan dikirim beswan dari portalnya. Setujui atau tolak — beswan melihat statusnya
        (dan catatanmu) di halaman Library.
      </p>
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usulan</TableHead>
              <TableHead className="w-40">Beswan</TableHead>
              <TableHead className="w-36">Status</TableHead>
              {canDecide && <TableHead className="w-24 text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canDecide ? 4 : 3}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canDecide ? 4 : 3}
                  className="text-center text-sm text-muted-foreground py-6"
                >
                  Belum ada usulan topik
                </TableCell>
              </TableRow>
            ) : (
              items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.topik_usulan}</div>
                    {u.catatan && (
                      <div className="text-xs italic text-muted-foreground">“{u.catatan}”</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.nama_beswan}</TableCell>
                  <TableCell>
                    <UsulanStatusBadge status={u.status} />
                  </TableCell>
                  {canDecide && (
                    <TableCell className="text-right">
                      {/* Keputusan hanya untuk yang belum diputus (pending / reviewed lama) */}
                      {(u.status === "pending" || u.status === "reviewed") && (
                        <div className="flex justify-end gap-1">
                          <button
                            title="Setujui"
                            onClick={() => setDialog({ usulan: u, keputusan: "approved" })}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-emerald-600 transition-colors"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            title="Tolak"
                            onClick={() => setDialog({ usulan: u, keputusan: "rejected" })}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <KeputusanDialog
        usulan={dialog?.usulan ?? null}
        keputusan={dialog?.keputusan ?? "approved"}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
