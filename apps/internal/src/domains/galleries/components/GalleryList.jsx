import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Eye, Pencil, Trash2, Loader2,
  Image as ImageIcon, Search, Filter, X,
  Calendar, ArrowLeft, ArrowRight,
} from "lucide-react";
import { useGalleries, useDeleteGallery } from "../hooks/useGalleries";
import { useEventsDropdown } from "@/domains/events";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { SearchableSelect } from "@/shared/components/ui/searchable-select";
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

export function GalleryList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [eventId, setEventId] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const params = {
    page,
    limit,
    search: search || "",
    event_id: eventId !== "all" ? eventId : "",
  };

  const { data, isLoading } = useGalleries(params);
  const { data: eventsRaw } = useEventsDropdown();
  const deleteGallery = useDeleteGallery();

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? {};
  const eventList = eventsRaw ?? [];

  const hasActiveFilter = search || eventId !== "all";

  const resetFilters = () => {
    setSearch("");
    setEventId("all");
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGallery.mutateAsync(deleteTarget.id);
      toast.success("Photo deleted.");
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
          <h1 className="text-2xl font-bold">Galleries</h1>
          <p className="text-muted-foreground">
            Photo gallery from events and activities.
            {!isLoading && (
              <span className="font-medium ml-1">{pagination.total_item || 0} photos</span>
            )}
          </p>
        </div>
        <Button onClick={() => navigate("/panel/galleries/new")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Photo
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </div>
          {hasActiveFilter && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs">
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search — spans 2 cols */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by description..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Event filter */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Label className="text-xs">Event</Label>
            <SearchableSelect
              value={eventId}
              onChange={(v) => { setEventId(v); setPage(1); }}
              options={[{ id: "all", name: "All Events" }, ...eventList]}
              placeholder="All Events"
              searchPlaceholder="Search events..."
              displayValue={(opt) => opt.name}
              hideClear
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm">
            {hasActiveFilter ? "No photos found matching your filters." : "No photos yet."}
          </p>
          {!hasActiveFilter && (
            <Button variant="outline" onClick={() => navigate("/panel/galleries/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Photo
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square rounded-xl overflow-hidden border bg-muted cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate(`/panel/galleries/${item.id}`)}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.description || "Gallery"}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.event?.name && (
                    <div className="absolute top-2 left-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                        <Calendar className="h-3 w-3 mr-1 shrink-0" />
                        <span className="truncate">{item.event.name}</span>
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                      onClick={(e) => { e.stopPropagation(); navigate(`/panel/galleries/${item.id}`); }}
                      title="View"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                      onClick={(e) => { e.stopPropagation(); navigate(`/panel/galleries/${item.id}/edit`); }}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/20 backdrop-blur-sm hover:bg-red-500/50 text-white"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {item.description && (
                    <div className="absolute bottom-10 left-2 right-14">
                      <p className="text-white text-xs truncate drop-shadow-md">{item.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_page > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total_item)} of {pagination.total_item} results
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
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
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
            <DialogTitle>Delete Photo</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this photo? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteGallery.isPending}>
              {deleteGallery.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
