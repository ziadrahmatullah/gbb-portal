import { BarChart3 } from "lucide-react";
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
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}>
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
        <div className="text-center text-xs text-muted-foreground px-4">
          <BarChart3 className="mx-auto mb-2 h-6 w-6 opacity-50" />
          <div>Data belum tersedia dari backend</div>
          {note && <div className="mt-1 opacity-75">{note}</div>}
        </div>
      </div>
    </div>
  );
}
