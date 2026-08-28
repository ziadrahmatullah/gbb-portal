import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Loader2, Wallet, MapPin, Calendar, DollarSign, Tag } from "lucide-react";
import { useTransaction, useDeleteTransaction, useCategoriesDropdown } from "../hooks/useTransactions";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
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

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5 shrink-0 h-7 w-7 rounded-md bg-muted flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {value != null && value !== "" ? (
          <p className="text-sm font-medium">{value}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">—</p>
        )}
      </div>
    </div>
  );
}

function formatRupiah(amount) {
  return `Rp ${Number(amount).toLocaleString("id-ID")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

export function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useTransaction(id);
  const deleteTransaction = useDeleteTransaction();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const transaction = data?.data;
  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <p className="text-lg font-semibold text-foreground">Transaction not found.</p>
        <Button variant="outline" onClick={() => navigate("/panel/transactions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Transactions
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteTransaction.mutateAsync(id);
      toast.success("Transaction deleted.");
      navigate("/panel/transactions");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleteOpen(false);
    }
  };

  const isIncome = transaction.category?.category_type === "pemasukan";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/panel/transactions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Transaction Detail</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDateTime(transaction.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate(`/panel/transactions/${id}/edit`)}>
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Banner */}
      <div className="rounded-xl bg-card shadow-md px-5 py-4 flex items-center gap-4">
        <div className={cn(
          "h-12 w-12 rounded-lg flex items-center justify-center shrink-0",
          isIncome ? "bg-emerald-500/10" : "bg-rose-500/10"
        )}>
          <Wallet className={cn(
            "h-5 w-5",
            isIncome ? "text-emerald-600" : "text-rose-600"
          )} />
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold">{formatRupiah(transaction.amount)}</p>
          <p className="text-sm text-muted-foreground">{transaction.description}</p>
        </div>
        <CategoryBadge category={transaction.category} />
      </div>

      {/* Detail card */}
      <Card className="max-w-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Transaction Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow icon={Tag} label="Category" value={transaction.category?.name} />
          <InfoRow icon={DollarSign} label="Amount" value={formatRupiah(transaction.amount)} />
          <InfoRow
            icon={MapPin}
            label="Location"
            value={
              transaction.district?.name || transaction.mosque?.name
                ? `${transaction.district?.name || ""}${transaction.district?.name && transaction.mosque?.name ? " • " : ""}${transaction.mosque?.name || ""}`
                : "—"
            }
          />
          <InfoRow icon={Calendar} label="Transaction Date" value={formatDate(transaction.transaction_date)} />
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? <br />
              <strong>{transaction.description}</strong>
              <br />
              <span className={cn(
                "font-medium",
                isIncome ? "text-emerald-600" : "text-rose-600"
              )}>
                {formatRupiah(transaction.amount)}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteTransaction.isPending}>
              {deleteTransaction.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
