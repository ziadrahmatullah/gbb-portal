import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Badge, Button, Skeleton } from "@gbb/ui";
import { useMentorList, useMyMentorRequests } from "../hooks/useMentor";
import { RequestDialog } from "./RequestDialog";

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

const REQUEST_STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  matched: "Sudah di-matching",
  done: "Selesai",
};

function MyRequestStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={
        status === "pending"
          ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
          : status === "matched"
            ? "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400"
            : "border-primary/30 bg-primary/10 text-primary"
      }
    >
      {REQUEST_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

// Tab status request 1-on-1 milik beswan — terurut terbaru dulu dari backend
export function MentorRequestTab() {
  const { data: requests, isLoading } = useMyMentorRequests();
  // Daftar mentor untuk mode "pilih mentor" di dialog request
  const { data: mentorData } = useMentorList();
  const mentors = useMemo(() => mentorData?.items ?? [], [mentorData]);
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Pantau status permintaan sesi 1-on-1 kamu di sini.
        </p>
        <Button size="sm" onClick={() => setRequestOpen(true)}>
          <Users className="size-4" />
          Request 1-on-1
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : (requests ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Users className="size-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            Belum ada request — gunakan tombol{" "}
            <span className="font-medium">Request 1-on-1</span> di atas untuk mulai.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-md border bg-card">
          {(requests ?? []).map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm" title={r.curhat_text ?? undefined}>
                  {r.curhat_text || "—"}
                </p>
                <div className="text-xs text-muted-foreground">
                  {formatTanggal(r.created_at)}
                  {(r.status === "matched" || r.status === "done") && r.mentor_nama && (
                    <>
                      {" · "}
                      Mentor: <span className="font-medium text-foreground">{r.mentor_nama}</span>
                    </>
                  )}
                </div>
              </div>
              <MyRequestStatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}

      {requestOpen && <RequestDialog mentors={mentors} onClose={() => setRequestOpen(false)} />}
    </div>
  );
}
