import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2, Loader2, Package, Calendar, Search, X, ArrowLeft, ArrowRight } from "lucide-react";
import { useAnimalTypes, useDeleteAnimalType } from "../hooks";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
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

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AnimalTypeList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const deleteAnimalType = useDeleteAnimalType();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const params = {
    page,
    limit,
    ...(search && { search }),
  };

  const { data, isLoading } = useAnimalTypes(params);
  const items = data?.items ?? [];
  const pagination = data?.pagination ?? {};

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAnimalType.mutateAsync(deleteTarget.id);
      toast.success("Animal type deleted.");
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
          <h1 className="text-2xl font-bold">Animal Types</h1>
          <p className="text-muted-foreground">
            Manage qurban animal types (Sapi, Kambing, Domba, etc.).
            {!isLoading && <span className="font-medium ml-1">{pagination.total_item || 0} total</span>}
          </p>
        </div>
        <Button onClick={() => navigate("/panel/master/animal-types/new")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Animal Type
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search animal types..."
            className="pl-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Package className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm">
            {search ? "No animal types found matching your search." : "No animal types yet. Add your first one."}
          </p>
          {!search && (
            <Button variant="outline" onClick={() => navigate("/panel/master/animal-types/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Animal Type
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/50 transition-colors",
                idx !== 0 && "border-t"
              )}
              onClick={() => navigate(`/panel/master/animal-types/${item.id}`)}
            >
              {/* Icon */}
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description || "—"}</p>
              </div>

              {/* Date */}
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Calendar className="h-3 w-3" />
                {formatDate(item.created_at)}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigate(`/panel/master/animal-types/${item.id}`)}
                  title="View"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigate(`/panel/master/animal-types/${item.id}/edit`)}
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
      )}

      {/* Pagination */}
      {!isLoading && pagination.total_page > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total_item)} of {pagination.total_item} results
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(limit)}
              onValueChange={(v) => {
                setLimit(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[70px] h-9">
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

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Animal Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteAnimalType.isPending}>
              {deleteAnimalType.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
