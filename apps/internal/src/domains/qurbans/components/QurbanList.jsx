import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Eye, Pencil, Trash2, Loader2, Package,
  Search, Filter, X, ArrowLeft, ArrowRight, Download, Upload,
} from "lucide-react";
import { useQurbans, useDeleteQurban, useBulkUploadQurban } from "../hooks";
import { qurbanService } from "../services";
import { BulkUploadQurbanDialog } from "./BulkUploadQurbanDialog";
import { useDistrictsDropdown } from "@/domains/districts";
import { useMosquesDropdown } from "@/domains/mosques";
import { useAnimalTypesDropdown } from "@/domains/animal-types";
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
import { cn } from "@/lib/utils";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function currentMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function currentMonthEnd() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

export function QurbanList() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [animalTypeId, setAnimalTypeId] = useState("all");
  const [districtId, setDistrictId] = useState("all");
  const [mosqueId, setMosqueId] = useState("all");
  const [mosqueSearchText, setMosqueSearchText] = useState("");
  const [startDate, setStartDate] = useState(currentMonthStart);
  const [endDate, setEndDate] = useState(currentMonthEnd);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const bulkUpload = useBulkUploadQurban();

  const params = {
    page,
    limit,
    search: search || "",
    animal_type_id: animalTypeId !== "all" ? animalTypeId : "",
    district_id: districtId !== "all" ? districtId : "",
    mosque_id: mosqueId !== "all" ? mosqueId : "",
    start_date: startDate || "",
    end_date: endDate || "",
  };

  const { data, isLoading } = useQurbans(params);
  const { data: districts } = useDistrictsDropdown();
  const { data: mosquesRaw } = useMosquesDropdown();
  const { data: animalTypesRaw } = useAnimalTypesDropdown();
  const deleteQurban = useDeleteQurban();

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? {};

  const districtList = districts?.items ?? [];
  const mosqueList = mosquesRaw ?? [];
  const animalTypeList = animalTypesRaw ?? [];

  const filteredMosqueList = useMemo(() => {
    if (mosqueSearchText) {
      return mosqueList.filter((m) =>
        m.name.toLowerCase().includes(mosqueSearchText.toLowerCase())
      );
    }
    if (districtId !== "all") {
      return mosqueList.filter((m) => m.district_id === Number(districtId));
    }
    return mosqueList;
  }, [mosqueList, districtId, mosqueSearchText]);

  const hasActiveFilter =
    search ||
    animalTypeId !== "all" ||
    districtId !== "all" ||
    mosqueId !== "all" ||
    startDate ||
    endDate;

  const resetFilters = () => {
    setSearch("");
    setAnimalTypeId("all");
    setDistrictId("all");
    setMosqueId("all");
    setMosqueSearchText("");
    setStartDate(currentMonthStart());
    setEndDate(currentMonthEnd());
    setPage(1);
  };

  const handleBulkUpload = async (file) => {
    try {
      await bulkUpload.mutateAsync(file);
      toast.success("Data qurban berhasil diupload.");
    } catch (e) {
      throw e;
    }
  };

  const handleDownload = async () => {
    try {
      await qurbanService.download({
        search: search || "",
        mosque_id: mosqueId !== "all" ? mosqueId : "",
        district_id: districtId !== "all" ? districtId : "",
        animal_type_id: animalTypeId !== "all" ? animalTypeId : "",
        start_date: startDate || "",
        end_date: endDate || "",
      });
      toast.success("Data downloaded.");
    } catch (e) {
      toast.error(e.message || "Download failed.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteQurban.mutateAsync(deleteTarget.id);
      toast.success("Qurban deleted.");
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
          <h1 className="text-2xl font-bold">Data Qurban</h1>
          <p className="text-muted-foreground">
            Manage qurban data across all districts and mosques.
            {!isLoading && (
              <span className="font-medium ml-1">{pagination.total_item || 0} records</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" onClick={() => setBulkUploadOpen(true)} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={() => navigate("/panel/qurbans/new")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Qurban
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-card shadow-md p-4 space-y-4">
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

        <div className="space-y-3">
          {/* Row 1: Search (2 cols), Animal Type */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by name..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <Label className="text-xs">Animal Type</Label>
              <SearchableSelect
                value={animalTypeId}
                onChange={(v) => { setAnimalTypeId(v); setPage(1); }}
                options={[{ id: "all", name: "All Animal Types" }, ...animalTypeList]}
                placeholder="All Animal Types"
                searchPlaceholder="Search animal types..."
                displayValue={(opt) => opt.name}
                hideClear
              />
            </div>
          </div>

          {/* Row 2: Start Date, End Date, District, Mosque */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

            <div>
              <Label className="text-xs">District</Label>
              <SearchableSelect
                value={districtId}
                onChange={(v) => {
                  setDistrictId(v);
                  setMosqueId("all");
                  setPage(1);
                }}
                options={[{ id: "all", name: "All Districts" }, ...districtList]}
                placeholder="All Districts"
                searchPlaceholder="Search districts..."
                displayValue={(opt) => opt.name}
                hideClear
              />
            </div>

            <div>
              <Label className="text-xs">Mosque</Label>
              <SearchableSelect
                value={mosqueId}
                onChange={(v) => { setMosqueId(v); setPage(1); }}
                options={[{ id: "all", name: "All Mosques" }, ...filteredMosqueList]}
                placeholder="All Mosques"
                searchPlaceholder="Search mosques..."
                displayValue={(opt) => opt.name}
                onSearchChange={setMosqueSearchText}
                hideClear
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
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
            {hasActiveFilter ? "No qurban data found matching your filters." : "No qurban data yet."}
          </p>
          {!hasActiveFilter && (
            <Button variant="outline" onClick={() => navigate("/panel/qurbans/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Qurban
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden overflow-x-auto">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-muted/50 text-sm font-medium text-muted-foreground min-w-200">
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Mosque</div>
              <div className="col-span-2">Animal Type</div>
              <div className="col-span-1">Qty</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Rows */}
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={cn(
                  "grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-muted/50 transition-colors cursor-pointer min-w-200",
                  idx !== 0 && "border-t"
                )}
                onClick={() => navigate(`/panel/qurbans/${item.id}`)}
              >
                <div className="col-span-2">
                  <p className="text-sm font-medium">{formatDate(item.qurban_date)}</p>
                </div>

                <div className="col-span-3 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                </div>

                <div className="col-span-2 min-w-0">
                  <p className="text-sm text-muted-foreground truncate">{item.mosque?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.mosque?.district?.name || ""}</p>
                </div>

                <div className="col-span-2 min-w-0">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {item.animal_type?.name || "—"}
                  </span>
                </div>

                <div className="col-span-1">
                  <p className="text-sm font-medium">{item.quantity ?? 0}</p>
                </div>

                <div
                  className="col-span-2 flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/panel/qurbans/${item.id}`)}
                    title="View"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/panel/qurbans/${item.id}/edit`)}
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
            <DialogTitle>Delete Qurban</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteQurban.isPending}>
              {deleteQurban.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkUploadQurbanDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
        onUploadSuccess={handleBulkUpload}
      />
    </div>
  );
}
