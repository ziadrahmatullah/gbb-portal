import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  Filter,
  Star,
  StarOff,
  Circle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useArticles, useDeleteArticle, useSetHighlightArticle } from "../hooks/useArticles";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Status badge component
function StatusBadge({ status }) {
  const colorMap = {
    published: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    cancelled: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  };
  const dotMap = {
    published: "text-emerald-500",
    cancelled: "text-rose-500",
    draft: "text-gray-400",
  };
  const key = status ?? "draft";
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", colorMap[key] ?? colorMap.draft)}>
      <Circle className={cn("h-1.5 w-1.5 fill-current", dotMap[key] ?? dotMap.draft)} />
      {key}
    </span>
  );
}

// Highlight badge component
function HighlightBadge({ isHighlight }) {
  if (!isHighlight) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
      Highlight
    </span>
  );
}

export function ArticleList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [isHighlight, setIsHighlight] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const params = {
    page,
    limit,
    ...(search && { search }),
    ...(status !== "all" && { status }),
    ...(isHighlight !== "all" && { is_highlight: isHighlight === "true" }),
  };
  const { data, isLoading } = useArticles(params);
  const deleteArticle = useDeleteArticle();
  const setHighlight = useSetHighlightArticle();

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? {};

  const hasActiveFilter = search || status !== "all" || isHighlight !== "all";

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setIsHighlight("all");
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteArticle.mutateAsync(deleteTarget.id);
      toast.success("Article deleted.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Articles</h1>
          <p className="text-muted-foreground">
            Manage news, articles, and blog content.
            {!isLoading && <span className="font-medium ml-1">{pagination.total_item || 0} articles</span>}
          </p>
        </div>
        <Button onClick={() => navigate("/panel/articles/new")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Article
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </div>
          {hasActiveFilter && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs">
              Reset
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Search */}
          <div>
            <Label htmlFor="search" className="text-xs">Search</Label>
            <Input
              id="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by title or content..."
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status" className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger id="status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Highlight */}
          <div>
            <Label htmlFor="highlight" className="text-xs">Highlight</Label>
            <Select value={isHighlight} onValueChange={(v) => { setIsHighlight(v); setPage(1); }}>
              <SelectTrigger id="highlight">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Highlight only</SelectItem>
                <SelectItem value="false">Non-highlight</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm">
            {hasActiveFilter ? "No articles found matching your filters." : "No articles yet."}
          </p>
          {!hasActiveFilter && (
            <Button variant="outline" onClick={() => navigate("/panel/articles/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Article
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-muted/50 text-sm font-medium text-muted-foreground">
              <div className="col-span-5">Title</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Highlight</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Rows */}
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={cn(
                  "grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-muted/50 transition-colors cursor-pointer",
                  idx !== 0 && "border-t"
                )}
                onClick={() => navigate(`/panel/articles/${item.id}`)}
              >
                {/* Title */}
                <div className="col-span-5 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.excerpt || item.description || ""}</p>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <StatusBadge status={item.status} />
                </div>

                {/* Highlight */}
                <div className="col-span-2">
                  <HighlightBadge isHighlight={item.is_highlight} />
                </div>

                {/* Date */}
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>

                {/* Actions */}
                <div
                  className="col-span-1 flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", item.is_highlight ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground")}
                    onClick={() => {
                      setHighlight.mutate({ id: item.id, is_highlight: !item.is_highlight });
                      toast.success(item.is_highlight ? "Removed from highlight." : "Set as highlight.");
                    }}
                    disabled={setHighlight.isPending}
                    title={item.is_highlight ? "Remove highlight" : "Set as highlight"}
                  >
                    {item.is_highlight
                      ? <Star className="h-3.5 w-3.5 fill-amber-500" />
                      : <StarOff className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/panel/articles/${item.id}`)}
                    title="View"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/panel/articles/${item.id}/edit`)}
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_page > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {pagination.total_item ?? 0} articles total
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
                    <SelectItem value="100">100</SelectItem>
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
                    Page {page} of {pagination.total_page}
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

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteArticle.isPending}>
              {deleteArticle.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
