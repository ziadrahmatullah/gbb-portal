import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Package } from "lucide-react";
import { useQurban, useCreateQurban, useUpdateQurban } from "../hooks";
import { useMosquesDropdown } from "@/domains/mosques";
import { useAnimalTypesDropdown } from "@/domains/animal-types";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
  name: "",
  mosque_id: "",
  animal_type_id: "",
  quantity: "",
  qurban_date: "",
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

export function QurbanForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existing, isLoading: isLoadingData } = useQurban(id);
  const { data: mosques } = useMosquesDropdown();
  const { data: animalTypes } = useAnimalTypesDropdown();
  const createQurban = useCreateQurban();
  const updateQurban = useUpdateQurban();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [mosqueId, setMosqueId] = useState("");
  const [animalTypeId, setAnimalTypeId] = useState("");

  const mosqueList = mosques ?? [];
  const animalTypeList = animalTypes ?? [];

  useEffect(() => {
    if (isEditing && existing?.data) {
      const d = existing.data;
      const dateOnly = d.qurban_date ? d.qurban_date.slice(0, 10) : "";
      setFormData({
        name: d.name ?? "",
        mosque_id: d.mosque_id ?? "",
        animal_type_id: d.animal_type_id ?? "",
        quantity: d.quantity ?? "",
        qurban_date: dateOnly,
      });
      setMosqueId(String(d.mosque_id ?? ""));
      setAnimalTypeId(String(d.animal_type_id ?? ""));
    }
  }, [isEditing, existing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        mosque_id: Number(mosqueId),
        animal_type_id: Number(animalTypeId),
        quantity: Number(formData.quantity),
      };

      if (isEditing) {
        await updateQurban.mutateAsync({ id, data: submitData });
        toast.success("Qurban updated.");
        navigate(`/panel/qurbans/${id}`);
      } else {
        await createQurban.mutateAsync(submitData);
        toast.success("Qurban created.");
        navigate("/panel/qurbans");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isPending = createQurban.isPending || updateQurban.isPending;

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
            <h1 className="text-xl font-bold leading-tight">{isEditing ? "Edit Qurban" : "New Qurban"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditing ? "Update qurban details." : "Add a new qurban record."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || !formData.name || !mosqueId || !animalTypeId || !formData.quantity || !formData.qurban_date}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isEditing ? "Save Changes" : "Create Qurban"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-xl">
        <SectionCard icon={Package} title="Qurban Details" description="Qurban information for tracking and reporting.">
          <Field label="Qurban Name" required hint="e.g. Qurban Sapi - H. Ahmad">
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter qurban name"
              required
            />
          </Field>

          <Field label="Mosque" required hint="Select the mosque for this qurban">
            <Select value={mosqueId} onValueChange={setMosqueId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select mosque" />
              </SelectTrigger>
              <SelectContent>
                {mosqueList.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Animal Type" required hint="Select the type of animal">
            <Select value={animalTypeId} onValueChange={setAnimalTypeId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select animal type" />
              </SelectTrigger>
              <SelectContent>
                {animalTypeList.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity" required hint="Number of animals">
              <Input
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="1"
                required
              />
            </Field>

            <Field label="Qurban Date" required hint="Date of qurban">
              <Input
                name="qurban_date"
                type="date"
                value={formData.qurban_date}
                onChange={handleChange}
                required
              />
            </Field>
          </div>
        </SectionCard>
      </div>
    </form>
  );
}
