import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@gbb/ui";
import { cn } from "@/lib/utils";

// Placeholder untuk chart/tabel yang datanya BELUM tersedia dari backend.
// Jangan diganti data dummy — tunggu endpoint dari tim BE.
export function EmptyChartCard({
  title,
  note,
  className,
}: {
  title: string;
  note?: string;
  className?: string;
}) {
  return (
    <Card className={cn("gap-3 py-4", className)}>
      <CardHeader className="px-4">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
          <div className="text-center text-xs text-muted-foreground px-4">
            <BarChart3 className="mx-auto mb-2 size-6 opacity-50" />
            <div>Data belum tersedia dari backend</div>
            {note && <div className="mt-1 opacity-75">{note}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
