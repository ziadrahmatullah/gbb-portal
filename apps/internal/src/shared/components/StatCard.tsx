import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@gbb/ui";

// Stat card pola dashboard shadcn-admin: judul kecil + ikon muted di header,
// angka besar di content.
export function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  loading?: boolean;
  sub?: string;
}) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4">
        <CardTitle className="truncate text-sm font-medium">{label}</CardTitle>
        <Icon className="size-4 shrink-0 text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-4">
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="truncate text-2xl font-bold">{value}</div>
        )}
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
