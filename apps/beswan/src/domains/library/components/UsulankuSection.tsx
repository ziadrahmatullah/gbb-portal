import { Lightbulb } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton, cn } from "@gbb/ui";
import { useMyTopikUsulan } from "../hooks/useLibrary";
import { USULAN_STATUS_LABEL } from "../services";

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

function UsulanStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0",
        status === "pending" &&
          "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
        status === "approved" &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        status === "rejected" && "border-destructive/30 bg-destructive/10 text-destructive",
        status === "reviewed" && "text-muted-foreground"
      )}
    >
      {USULAN_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

// Daftar topik yang sudah diusulkan beswan + statusnya (masukan PCM Sep 2026
// slide 9). Disembunyikan seluruhnya bila endpoint-nya belum tersedia di
// backend (query error) — lihat FEpromt32.
export function UsulankuSection() {
  const { data, isLoading, isError } = useMyTopikUsulan();
  if (isError) return null;
  const items = data ?? [];

  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Lightbulb className="size-4 text-primary" />
          Topik yang kamu usulkan
          {!isLoading && (
            <span className="font-normal text-muted-foreground">({items.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada usulan. Klik “Usul Topik” di atas untuk mengirim ide materi ke Tim Program.
          </p>
        ) : (
          <ul className="divide-y">
            {items.map((u) => (
              <li key={u.id} className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm">
                <div className="min-w-0 space-y-0.5">
                  <div className="font-medium">{u.topik_usulan}</div>
                  {u.catatan && (
                    <p className="text-xs italic text-muted-foreground">“{u.catatan}”</p>
                  )}
                  {u.created_at && (
                    <div className="text-xs text-muted-foreground">
                      Diusulkan {formatTanggal(u.created_at)}
                    </div>
                  )}
                </div>
                <UsulanStatusBadge status={u.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
