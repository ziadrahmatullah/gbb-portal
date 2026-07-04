import { useQurbanSummary } from "../hooks";
import { Package, TrendingUp, MapPin, Calendar, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/lib/utils";

function SummaryCard({ title, value, icon: Icon, color, description }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value ?? "—"}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

function DetailCard({ title, items, icon: Icon, color }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", color)}>
            <Icon className="h-4 w-4" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium">{item.name || item.label || "—"}</span>
                <span className="text-sm font-semibold">{item.count || item.total || item.quantity || 0}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function QurbanSummary() {
  const { data: summary, isLoading } = useQurbanSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Qurban Summary</h1>
        <p className="text-muted-foreground">Comprehensive overview of qurban data and statistics.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Qurbans"
              value={summary?.total_qurbans ?? 0}
              icon={Package}
              color="bg-primary/10 text-primary"
              description="Recorded qurban activities"
            />
            <SummaryCard
              title="Total Animals"
              value={summary?.total_animals ?? 0}
              icon={TrendingUp}
              color="bg-emerald-500/10 text-emerald-600"
              description="Total animals qurban'd"
            />
            <SummaryCard
              title="Districts Covered"
              value={summary?.total_districts ?? 0}
              icon={MapPin}
              color="bg-blue-500/10 text-blue-600"
              description="Active districts"
            />
            <SummaryCard
              title="Mosques Covered"
              value={summary?.total_mosques ?? 0}
              icon={Building}
              color="bg-violet-500/10 text-violet-600"
              description="Participating mosques"
            />
          </div>

          {/* Detailed Breakdown */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* By District */}
            <DetailCard
              title="By District"
              items={summary?.by_district}
              icon={MapPin}
              color="bg-blue-500/10 text-blue-600"
            />

            {/* By Animal Type */}
            <DetailCard
              title="By Animal Type"
              items={summary?.by_animal_type}
              icon={Package}
              color="bg-emerald-500/10 text-emerald-600"
            />

            {/* By Mosque */}
            <DetailCard
              title="By Mosque"
              items={summary?.by_mosque}
              icon={Building}
              color="bg-violet-500/10 text-violet-600"
            />
          </div>

          {/* Additional Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* By Year */}
            {summary?.by_year && summary.by_year.length > 0 && (
              <DetailCard
                title="By Year"
                items={summary.by_year.map((item) => ({
                  name: String(item.year),
                  count: item.total_qurbans,
                }))}
                icon={Calendar}
                color="bg-amber-500/10 text-amber-600"
              />
            )}

            {/* By Date Range */}
            {summary?.date_range && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Calendar className="h-4 w-4" />
                    </div>
                    Date Range
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Earliest Record</span>
                      <span className="text-sm font-semibold">
                        {summary.date_range.earliest ? new Date(summary.date_range.earliest).toLocaleDateString("id-ID") : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Latest Record</span>
                      <span className="text-sm font-semibold">
                        {summary.date_range.latest ? new Date(summary.date_range.latest).toLocaleDateString("id-ID") : "—"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
