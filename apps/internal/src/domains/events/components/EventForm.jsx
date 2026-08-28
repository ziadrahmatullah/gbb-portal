import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Calendar } from "lucide-react";
import { useEvent, useCreateEvent, useUpdateEvent } from "../hooks/useEvents";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  name: "",
  description: "",
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

export function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existing, isLoading: isLoadingData } = useEvent(id);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (isEditing && existing?.data) {
      const d = existing.data;
      setFormData({
        name: d.name ?? "",
        description: d.description ?? "",
      });
    }
  }, [isEditing, existing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateEvent.mutateAsync({ id, data: formData });
        toast.success("Event updated.");
        navigate(`/panel/events/${id}`);
      } else {
        await createEvent.mutateAsync(formData);
        toast.success("Event created.");
        navigate("/panel/events");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

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
            <h1 className="text-xl font-bold leading-tight">{isEditing ? "Edit Event" : "New Event"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditing ? "Update event details." : "Add a new event to the system."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !formData.name}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isEditing ? "Save Changes" : "Create Event"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-xl">
        <SectionCard icon={Calendar} title="Event Details" description="Basic information about this event.">
          <Field label="Event Name" required hint="e.g. Peringatan Isra Miraj">
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter event name"
              required
            />
          </Field>

          <Field label="Description" hint="Detailed description of the event">
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter event description"
              rows={4}
            />
          </Field>
        </SectionCard>
      </div>
    </form>
  );
}
