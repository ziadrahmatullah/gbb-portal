import { CheckCircle2 } from "lucide-react";
import { Badge, Skeleton } from "@gbb/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useTopikUsulanList, useUpdateTopikUsulanStatus } from "../hooks/useKurikulum";

export function TopikUsulanTab() {
  const { data, isLoading } = useTopikUsulanList({ limit: 20 });
  const updateStatus = useUpdateTopikUsulanStatus();
  const items = data?.items ?? [];
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Usulan dikirim beswan dari portalnya — tandai sudah ditinjau setelah dipertimbangkan.
      </p>
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usulan</TableHead>
              <TableHead className="w-40">Beswan</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                  Belum ada usulan topik
                </TableCell>
              </TableRow>
            ) : (
              items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.topik_usulan}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.nama_beswan}</TableCell>
                  <TableCell>
                    <Badge
                      variant={u.status === "reviewed" ? "default" : "outline"}
                      className={u.status === "reviewed" ? "capitalize" : "capitalize text-muted-foreground"}
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.status === "pending" && (
                      <button
                        title="Tandai sudah ditinjau"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: u.id, status: "reviewed" })}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
