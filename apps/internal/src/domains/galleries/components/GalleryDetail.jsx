import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Loader2, Calendar, FileText, Image as ImageIcon, ZoomIn } from "lucide-react";
import { useGallery, useDeleteGallery } from "../hooks/useGalleries";
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

export function GalleryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGallery(id);
  const deleteGallery = useDeleteGallery();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const gallery = data?.data;
  if (!gallery) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <p className="text-lg font-semibold text-foreground">Photo not found.</p>
        <Button variant="outline" onClick={() => navigate("/panel/galleries")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Galleries
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteGallery.mutateAsync(id);
      toast.success("Photo deleted.");
      navigate("/panel/galleries");
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/panel/galleries")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Photo Detail</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDateTime(gallery.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate(`/panel/galleries/${id}/edit`)}>
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Image */}
        <div
          className="group relative w-full lg:w-auto lg:flex-1 max-w-lg rounded-xl overflow-hidden border bg-muted cursor-zoom-in"
          onClick={() => gallery.image && setZoomOpen(true)}
        >
          {gallery.image ? (
            <>
              <img
                src={gallery.image}
                alt={gallery.description || "Gallery photo"}
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </>
          ) : (
            <div className="aspect-video flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Detail card */}
        <Card className="w-full lg:w-80 shrink-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Photo Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow icon={FileText} label="Description" value={gallery.description} />
            <InfoRow icon={Calendar} label="Event" value={gallery.event?.name} />
            <InfoRow icon={Calendar} label="Created At" value={formatDateTime(gallery.created_at)} />
            <InfoRow icon={Calendar} label="Updated At" value={formatDateTime(gallery.updated_at)} />
          </CardContent>
        </Card>
      </div>

      {/* Zoom dialog */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-4xl p-2 bg-black/90 border-0">
          <img
            src={gallery?.image}
            alt={gallery?.description || "Gallery photo"}
            className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
          />
          {gallery?.description && (
            <p className="text-center text-sm text-white/70 pb-1">{gallery.description}</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Photo</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this photo? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
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
