import { useState } from "react";
import { ClipboardList, ArrowLeft, ArrowRight, Filter, X } from "lucide-react";
import { useActivityLogs } from "../hooks/useActivityLogs";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { cn } from "@/lib/utils";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const ACTION_COLORS = {
  CREATE: "bg-emerald-500/10 text-emerald-700",
  UPDATE: "bg-blue-500/10 text-blue-700",
  DELETE: "bg-rose-500/10 text-rose-700",
};

const ENTITY_COLORS = {
  category:    "bg-violet-500/10 text-violet-700",
  district:    "bg-blue-500/10 text-blue-700",
  mosque:      "bg-emerald-500/10 text-emerald-700",
  article:     "bg-indigo-500/10 text-indigo-700",
  transaction: "bg-amber-500/10 text-amber-700",
  qurban:      "bg-orange-500/10 text-orange-700",
  event:       "bg-pink-500/10 text-pink-700",
  gallery:     "bg-cyan-500/10 text-cyan-700",
  user:        "bg-gray-500/10 text-gray-700",
};

function ActionBadge({ action }) {
  const type = action?.split("_")[0] ?? "";
  const color = ACTION_COLORS[type] ?? "bg-gray-500/10 text-gray-700";
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium font-mono", color)}>
      {action ?? "—"}
    </span>
  );
}

function EntityBadge({ type }) {
  const color = ENTITY_COLORS[type] ?? "bg-gray-500/10 text-gray-700";
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize", color)}>
      {type ?? "—"}
    </span>
  );
}

export function ActivityLogList() {
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const params = { page, limit, start_date: startDate, end_date: endDate };
  const { data, isLoading } = useActivityLogs(params);

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? {};

  const resetFilters = () => {
    setStartDate(todayStr());
    setEndDate(todayStr());
    setPage(1);
  };

  const hasCustomFilter = startDate !== todayStr() || endDate !== todayStr();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground text-sm">
          Riwayat aktivitas pengguna di sistem.
          {!isLoading && (
            <span className="font-medium ml-1">{pagination.total_item ?? 0} aktivitas</span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </div>
          {hasCustomFilter && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs gap-1">
              <X className="h-3 w-3" /> Reset
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label className="text-xs">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            />
          </div>
          <div>
            <Label className="text-xs">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm">Tidak ada aktivitas pada periode ini.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Action</div>
              <div className="col-span-2">Entity</div>
              <div className="col-span-1">ID</div>
              <div className="col-span-3">User</div>
              <div className="col-span-2">Waktu</div>
            </div>

            {/* Data rows */}
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={cn(
                  "grid grid-cols-12 gap-4 px-5 py-3 items-center text-sm",
                  idx !== 0 && "border-t",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                )}
              >
                <div className="col-span-1 text-xs text-muted-foreground font-mono">{item.id}</div>
                <div className="col-span-3 min-w-0">
                  <ActionBadge action={item.action} />
                </div>
                <div className="col-span-2">
                  <EntityBadge type={item.entity_type} />
                </div>
                <div className="col-span-1 text-xs text-muted-foreground font-mono">
                  {item.entity_id ?? "—"}
                </div>
                <div className="col-span-3 min-w-0">
                  <p className="text-sm font-medium truncate">{item.full_name ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">
                    {item.action_date
                      ? new Date(item.action_date).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_page > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {pagination.total_item ?? 0} total aktivitas
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={String(limit)}
                  onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}
                >
                  <SelectTrigger className="w-17.5 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">
                    {page} / {pagination.total_page}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setPage((p) => Math.min(pagination.total_page, p + 1))}
                    disabled={page >= pagination.total_page}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
