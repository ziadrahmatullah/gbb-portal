import type { KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, cn } from "@gbb/ui";

// Stat card pola dashboard shadcn-admin: judul kecil + ikon muted di header,
// angka besar di content.
export function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  sub,
  onClick,
  title,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  loading?: boolean;
  sub?: string;
  // Kartu interaktif (mis. Avg Kehadiran → daftar beswan di bawah rata-rata):
  // onClick membuat kartu bisa diklik, title = tooltip saat hover
  onClick?: () => void;
  title?: string;
}) {
  return (
    <Card
      className={cn(
        "gap-2 py-4",
        onClick && "cursor-pointer transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
      )}
      title={title}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
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
