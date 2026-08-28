import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Loader2, Calendar, FileText } from "lucide-react";
import { useEvent, useDeleteEvent } from "../hooks/useEvents";
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

export function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useEvent(id);
  const deleteEvent = useDeleteEvent();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const event = data?.data;
  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <p className="text-lg font-semibold text-foreground">Event not found.</p>
        <Button variant="outline" onClick={() => navigate("/panel/events")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success("Event deleted.");
      navigate("/panel/events");
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/panel/events")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Event Detail</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDateTime(event.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate(`/panel/events/${id}/edit`)}>
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
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold truncate">{event.name}</p>
          <p className="text-sm text-muted-foreground truncate">{event.description || "—"}</p>
        </div>
      </div>

      {/* Detail card */}
      <Card className="max-w-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow icon={Calendar} label="Event Name" value={event.name} />
          <InfoRow icon={FileText} label="Description" value={event.description} />
          <InfoRow icon={Calendar} label="Created At" value={formatDateTime(event.created_at)} />
          <InfoRow icon={Calendar} label="Updated At" value={formatDateTime(event.updated_at)} />
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{event.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteEvent.isPending}>
              {deleteEvent.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
