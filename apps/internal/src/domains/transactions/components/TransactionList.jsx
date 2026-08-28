import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Filter,
  X,
  ArrowLeft,
  ArrowRight,
  Upload,
  Download,
} from "lucide-react";
import {
  useTransactions,
  useCategoriesDropdown,
  useDistrictsDropdown,
  useMosquesDropdown,
  useDeleteTransaction,
  useBulkUpload,
} from "../hooks/useTransactions";
import { transactionService } from "../services";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { SearchableSelect } from "@/shared/components/ui/searchable-select";
import { BulkUploadDialog } from "./BulkUploadDialog";
import { TransactionTrendChart } from "./TransactionTrendChart";
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

function formatRupiah(amount) {
  return `Rp ${Number(amount).toLocaleString("id-ID")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Category Badge Component
function CategoryBadge({ category }) {
  const isIncome = category?.category_type === "pemasukan";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        isIncome
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
      )}
    >
      {category?.name || "—"}
    </span>
  );
}

// Summary Card Component
function SummaryCard({ label, amount, type, className }) {
  const isPositive = type === "income" || amount >= 0;
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-lg font-semibold",
          type === "income" && "text-emerald-600 dark:text-emerald-400",
          type === "expense" && "text-rose-600 dark:text-rose-400",
          type === "balance" && (isPositive ? "text-emerald-600" : "text-rose-600")
        )}
      >
        {formatRupiah(amount)}
      </span>
    </div>
  );
}

export function TransactionList() {
  const navigate = useNavigate();

  // Filter states
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [categoryType, setCategoryType] = useState("all");
  const [districtId, setDistrictId] = useState("all");
  const [mosqueId, setMosqueId] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [mosqueSearchText, setMosqueSearchText] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  // Trend chart filters
  const [trendFilter, setTrendFilter] = useState("mtd");
  const [trendYear, setTrendYear] = useState(() => new Date().getFullYear());
  const [trendMonth, setTrendMonth] = useState(() => new Date().getMonth() + 1);

  const handleTrendFilterChange = (key, value) => {
    if (key === "trendFilter") setTrendFilter(value);
    if (key === "trendYear") setTrendYear(value);
    if (key === "trendMonth") setTrendMonth(value);
  };

  // Set default date range to beginning and end of current month
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  // Build params object
  const params = {
    page,
    limit,
    search: search || "",
    category_id: categoryId !== "all" ? categoryId : "",
    category_type: categoryType !== "all" ? categoryType : "",
    district_id: districtId !== "all" ? districtId : "",
    mosque_id: mosqueId !== "all" ? mosqueId : "",
    start_date: startDate || "",
    end_date: endDate || "",
  };

  const { data, isLoading } = useTransactions(params);
  const { data: categories } = useCategoriesDropdown();
  const { data: districts } = useDistrictsDropdown();
  const { data: mosques } = useMosquesDropdown();
  const deleteTransaction = useDeleteTransaction();
  const bulkUpload = useBulkUpload();

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? {};
  const summary = data?.summary ?? { total_income: 0, total_expense: 0, total_net: 0 };

  const categoryList = categories ?? [];
  const districtList = districts ?? [];
  const mosqueList = mosques ?? [];

  // Filter mosques: when searching, show all matching mosques; when not searching, filter by selected district
  const filteredMosqueList = useMemo(() => {
    if (mosqueSearchText) {
      // When searching, show all mosques that match the search
      return mosqueList.filter((m) =>
        m.name.toLowerCase().includes(mosqueSearchText.toLowerCase())
      );
    }
    // When not searching, only show mosques from selected district
    if (districtId !== "all") {
      return mosqueList.filter((m) => m.district_id === Number(districtId));
    }
    return mosqueList;
  }, [mosqueList, districtId, mosqueSearchText]);

  const hasActiveFilter =
    search || categoryId !== "all" || categoryType !== "all" || districtId !== "all" || mosqueId !== "all" || startDate || endDate;

  const resetFilters = () => {
    setSearch("");
    setCategoryId("all");
    setCategoryType("all");
    setDistrictId("all");
    setMosqueId("all");
    setMosqueSearchText("");
    setPage(1);
  };

  // Handle category change - reset category_type when category is selected
  const handleCategoryChange = (value) => {
    setCategoryId(value);
    if (value !== "all") {
      setCategoryType("all");
    }
    setPage(1);
  };

  // Handle category_type change - reset category when category_type is selected
  const handleCategoryTypeChange = (value) => {
    setCategoryType(value);
    if (value !== "all") {
      setCategoryId("all");
    }
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTransaction.mutateAsync(deleteTarget.id);
      toast.success("Transaction deleted.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleBulkUpload = async (file) => {
    try {
      const result = await bulkUpload.mutateAsync(file);
      toast.success(result.message || "Transactions uploaded successfully");
    } catch (e) {
      throw e;
    }
  };

  const handleDownload = async () => {
    try {
      const downloadParams = {
        page,
        limit,
        search: search || "",
        category_id: categoryId !== "all" ? categoryId : "",
        category_type: categoryType !== "all" ? categoryType : "",
        district_id: districtId !== "all" ? districtId : "",
        mosque_id: mosqueId !== "all" ? mosqueId : "",
        start_date: startDate || "",
        end_date: endDate || "",
      };
      await transactionService.download(downloadParams);
      toast.success("Transactions downloaded successfully");
    } catch (e) {
      toast.error(e.message || "Download failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">
            Manage financial transactions and records.
            {!isLoading && <span className="font-medium ml-1">{pagination.total_item || 0} total</span>}
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
          <Button onClick={() => navigate("/panel/transactions/new")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
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
          {/* First row: Search (2x), Category, Category Type */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search - spans 2 columns */}
            <div className="sm:col-span-2 lg:col-span-2">
              <Label htmlFor="search" className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by description..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category" className="text-xs">Category</Label>
              <SearchableSelect
                value={categoryId}
                onChange={handleCategoryChange}
                options={[{ id: "all", name: "All Categories" }, ...categoryList]}
                placeholder="All Categories"
                searchPlaceholder="Search categories..."
                displayValue={(opt) => opt.name}
                hideClear
              />
            </div>

            {/* Category Type */}
            <div>
              <Label htmlFor="category-type" className="text-xs">Category Type</Label>
              <SearchableSelect
                value={categoryType}
                onChange={handleCategoryTypeChange}
                options={[
                  { id: "all", name: "All Types" },
                  { id: "pemasukan", name: "Pemasukan" },
                  { id: "pengeluaran", name: "Pengeluaran" }
                ]}
                placeholder="All Types"
                searchPlaceholder="Search types..."
                displayValue={(opt) => opt.name}
                hideClear
              />
            </div>
          </div>

          {/* Second row: Start Date, End Date, District, Mosque */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Start Date */}
            <div>
              <Label htmlFor="start-date" className="text-xs">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* End Date */}
            <div>
              <Label htmlFor="end-date" className="text-xs">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* District */}
            <div>
              <Label htmlFor="district" className="text-xs">District</Label>
              <SearchableSelect
                value={districtId}
                onChange={(v) => { setDistrictId(v); setPage(1); }}
                options={[{ id: "all", name: "All Districts" }, ...districtList]}
                placeholder="All Districts"
                searchPlaceholder="Search districts..."
                displayValue={(opt) => opt.name}
                hideClear
              />
            </div>

            {/* Mosque */}
            <div>
              <Label htmlFor="mosque" className="text-xs">Mosque</Label>
              <SearchableSelect
                value={mosqueId}
                onChange={(v) => { setMosqueId(v); setPage(1); }}
                options={[{ id: "all", name: "All Mosques" }, ...filteredMosqueList]}
                placeholder={mosqueSearchText || districtId === "all" ? "All Mosques" : "Filter by district"}
                searchPlaceholder="Search mosques..."
                displayValue={(opt) => opt.name}
                onSearchChange={setMosqueSearchText}
                hideClear
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-4 rounded-xl bg-card shadow-md p-4">
        <SummaryCard label="Total Pemasukan" amount={summary.total_income || 0} type="income" />
        <SummaryCard label="Total Pengeluaran" amount={summary.total_expense || 0} type="expense" />
        <SummaryCard
          label="Selisih"
          amount={summary.total_net ?? 0}
          type="balance"
        />
      </div>

      {/* Trend Chart */}
      <TransactionTrendChart
        categoryId={categoryId}
        districtId={districtId}
        mosqueId={mosqueId}
        trendFilter={trendFilter}
        trendYear={trendYear}
        trendMonth={trendMonth}
        onFilterChange={handleTrendFilterChange}
      />

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <div className="text-4xl">💸</div>
          <p className="text-sm">
            {hasActiveFilter ? "No transactions found matching your filters." : "No transactions yet."}
          </p>
          {!hasActiveFilter && (
            <Button variant="outline" onClick={() => navigate("/panel/transactions/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden overflow-x-auto">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-muted/50 text-sm font-medium text-muted-foreground min-w-225">
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Rows */}
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={cn(
                  "grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-muted/50 transition-colors cursor-pointer min-w-225",
                  idx !== 0 && "border-t"
                )}
                onClick={() => navigate(`/panel/transactions/${item.id}`)}
              >
                {/* Date */}
                <div className="col-span-2">
                  <p className="text-sm font-medium">{formatDate(item.transaction_date)}</p>
                </div>

                {/* Description */}
                <div className="col-span-3 min-w-0">
                  <p className="text-sm truncate">{item.description || "—"}</p>
                </div>

                {/* Category */}
                <div className="col-span-2">
                  <CategoryBadge category={item.category} />
                </div>

                {/* Location */}
                <div className="col-span-2 min-w-0">
                  <p className="text-sm text-muted-foreground truncate">
                    {item.district?.name || item.mosque?.name
                      ? `${item.district?.name || ""}${item.district?.name && item.mosque?.name ? " • " : ""}${item.mosque?.name || ""}`
                      : "—"}
                  </p>
                </div>

                {/* Amount */}
                <div className="col-span-2 text-right">
                  <p className="text-sm font-semibold">{formatRupiah(item.amount)}</p>
                </div>

                {/* Actions */}
                <div
                  className="col-span-1 flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/panel/transactions/${item.id}`)}
                    title="View"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/panel/transactions/${item.id}/edit`)}
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
                  onValueChange={(v) => {
                    setLimit(Number(v));
                    setPage(1);
                  }}
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
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? <br />
              <strong>{deleteTarget?.description}</strong>
              <br />
              <span className={cn(
                "font-medium",
                deleteTarget?.category?.category_type === "pemasukan" ? "text-emerald-600" : "text-rose-600"
              )}>
                {formatRupiah(deleteTarget?.amount)}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteTransaction.isPending}>
              {deleteTransaction.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
        onUploadSuccess={handleBulkUpload}
      />
    </div>
  );
}
