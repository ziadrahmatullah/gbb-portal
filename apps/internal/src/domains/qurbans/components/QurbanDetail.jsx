import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Loader2, Package, MapPin, Calendar, Tag } from "lucide-react";
import { useQurban, useDeleteQurban } from "../hooks";
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

export function QurbanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQurban(id);
  const deleteQurban = useDeleteQurban();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const qurban = data?.data;
  if (!qurban) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <p className="text-lg font-semibold text-foreground">Qurban not found.</p>
        <Button variant="outline" onClick={() => navigate("/panel/qurbans")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Qurban
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteQurban.mutateAsync(id);
      toast.success("Qurban deleted.");
      navigate("/panel/qurbans");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/panel/qurbans")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Qurban Detail</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(qurban.qurban_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate(`/panel/qurbans/${id}/edit`)}>
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
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold truncate">{qurban.name}</p>
          <p className="text-sm text-muted-foreground">{qurban.mosque?.name || "—"}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary shrink-0">
          {qurban.animal_type?.name || "—"}
        </span>
      </div>

      {/* Detail card */}
      <Card className="max-w-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Qurban Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow icon={Package} label="Name" value={qurban.name} />
          <InfoRow icon={Tag} label="Animal Type" value={qurban.animal_type?.name} />
          <InfoRow icon={Package} label="Quantity" value={qurban.quantity} />
          <InfoRow icon={Calendar} label="Qurban Date" value={formatDate(qurban.qurban_date)} />
          <InfoRow icon={MapPin} label="Mosque" value={qurban.mosque?.name} />
          <InfoRow icon={MapPin} label="District" value={qurban.mosque?.district?.name || null} />
          <InfoRow icon={Calendar} label="Created At" value={formatDateTime(qurban.created_at)} />
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Qurban</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{qurban.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteQurban.isPending}>
              {deleteQurban.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
