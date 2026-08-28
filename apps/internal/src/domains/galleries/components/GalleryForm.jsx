import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, ImageIcon, Upload, X, Calendar } from "lucide-react";
import {
  useGallery,
  useCreateGallery,
  useUpdateGallery,
} from "../hooks/useGalleries";
import { useEventsDropdown } from "@/domains/events";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  event_id: "",
  description: "",
  image: null,
};

function Field({ label, required, hint, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
  );
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-xl bg-card shadow-md overflow-hidden">
      <div className="px-5 py-4 border-b bg-muted/30 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-background border flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">{title}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// Image upload preview component
function ImageUpload({ image, onChange, existingUrl, onRemove }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  return (
    <div className="space-y-3">
      {(image || existingUrl) ? (
        <div className="relative w-full aspect-video max-w-md rounded-lg overflow-hidden border bg-muted">
          <img
            src={image ? URL.createObjectURL(image) : existingUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={() => {
              if (onRemove) onRemove();
              else onChange(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "w-full aspect-video max-w-md rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors",
            "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Click to upload an image</p>
          <p className="text-xs text-muted-foreground/60">PNG, JPG, GIF up to 5MB</p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

export function GalleryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existing, isLoading: isLoadingData } = useGallery(id);
  const { data: events } = useEventsDropdown();
  const createGallery = useCreateGallery();
  const updateGallery = useUpdateGallery();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [eventId, setEventId] = useState("none");
  const [imageFile, setImageFile] = useState(null);

  const eventList = useMemo(() => {
    const base = events ?? [];
    const existingEvent = existing?.data?.event;
    if (existingEvent && !base.find((e) => e.id === existingEvent.id)) {
      return [existingEvent, ...base];
    }
    return base;
  }, [events, existing]);

  useEffect(() => {
    if (isEditing && existing?.data) {
      const d = existing.data;
      setFormData({
        event_id: d.event_id ?? "",
        description: d.description ?? "",
        image: null,
      });
      setEventId(String(d.event_id ?? "none"));
    }
  }, [isEditing, existing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setFormData((prev) => ({ ...prev, image: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // PUT uses JSON, not FormData
        const submitData = {
          event_id: eventId ? Number(eventId) : null,
          description: formData.description,
          image: existing?.data?.image || "", // Keep existing image URL
        };
        await updateGallery.mutateAsync({ id, data: submitData });
        toast.success("Gallery updated.");
        navigate(`/panel/galleries/${id}`);
      } else {
        // POST uses FormData
        const submitData = new FormData();
        if (eventId) submitData.append("event_id", eventId);
        submitData.append("description", formData.description || "");
        if (imageFile) submitData.append("image", imageFile);

        await createGallery.mutateAsync(submitData);
        toast.success("Photo added.");
        navigate("/panel/galleries");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isPending = createGallery.isPending || updateGallery.isPending;

  if (isEditing && isLoadingData) {
    return <div className="h-64 rounded-xl bg-muted animate-pulse" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold leading-tight">
              {isEditing ? "Edit Photo" : "Add New Photo"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditing ? "Update photo details." : "Add a new photo to the gallery."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || (!isEditing && !imageFile)}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isEditing ? "Save Changes" : "Add Photo"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-xl space-y-5">
        {/* Photo Upload */}
        <SectionCard
          icon={ImageIcon}
          title="Photo"
          description={isEditing ? "Current photo (cannot be changed)." : "Upload a photo for the gallery."}
        >
          {isEditing ? (
            // Edit mode: show existing image, no upload
            <div className="space-y-3">
              <div className="w-full aspect-video max-w-md rounded-lg overflow-hidden border bg-muted">
                <img
                  src={existing?.data?.image}
                  alt="Existing"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Image cannot be changed in edit mode. Delete and re-upload if needed.
              </p>
            </div>
          ) : (
            // Create mode: show upload component
            <ImageUpload
              image={imageFile}
              onChange={setImageFile}
              onRemove={handleRemoveImage}
            />
          )}
        </SectionCard>

        {/* Details */}
        <SectionCard
          icon={Calendar}
          title="Photo Details"
          description="Add context to this photo."
        >
          <Field label="Event" hint="Associate this photo with an event">
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select event (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No event</SelectItem>
                {eventList.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Description" hint="Describe this photo">
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter description"
              rows={3}
            />
          </Field>
        </SectionCard>
      </div>
    </form>
  );
}
