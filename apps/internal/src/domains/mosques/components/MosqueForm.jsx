import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, MapPin, User, Phone, FileText } from "lucide-react";
import { useMosque, useCreateMosque, useUpdateMosque } from "../hooks";
import { useDistrictsDropdown } from "@/domains/districts";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
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
  district_id: "",
  pic_name: "",
  pic_phone: "",
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
    <div className="rounded-xl border bg-card overflow-hidden">
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

export function MosqueForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existing, isLoading: isLoadingData } = useMosque(id);
  const { data: districts } = useDistrictsDropdown();
  const createMosque = useCreateMosque();
  const updateMosque = useUpdateMosque();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [districtId, setDistrictId] = useState("");

  const districtList = districts?.items ?? [];

  useEffect(() => {
    if (isEditing && existing?.data) {
      const d = existing.data;
      setFormData({
        name: d.name ?? "",
        district_id: d.district_id ?? "",
        pic_name: d.pic_name ?? "",
        pic_phone: d.pic_phone ?? "",
        description: d.description ?? "",
      });
      setDistrictId(String(d.district_id ?? ""));
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
        district_id: Number(districtId),
      };

      if (isEditing) {
        await updateMosque.mutateAsync({ id, data: submitData });
        toast.success("Mosque updated.");
        navigate(`/panel/master/mosques/${id}`);
      } else {
        await createMosque.mutateAsync(submitData);
        toast.success("Mosque created.");
        navigate("/panel/master/mosques");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isPending = createMosque.isPending || updateMosque.isPending;

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
            <h1 className="text-xl font-bold leading-tight">{isEditing ? "Edit Mosque" : "New Mosque"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditing ? "Update mosque details." : "Add a new mosque to the system."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !formData.name || !districtId}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isEditing ? "Save Changes" : "Create Mosque"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-xl space-y-5">
        {/* Basic Info */}
        <SectionCard icon={MapPin} title="Mosque Information" description="Basic mosque details for qurban management.">
          <Field label="Mosque Name" required hint="e.g. Masjid Agung Kuningan">
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter mosque name"
              required
            />
          </Field>

          <Field label="District" required hint="Select the district where this mosque is located">
            <Select value={districtId} onValueChange={setDistrictId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                {districtList.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Description" hint="Additional information about this mosque">
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter description (optional)"
              rows={3}
            />
          </Field>
        </SectionCard>

        {/* PIC Info */}
        <SectionCard icon={User} title="Person in Charge (PIC)" description="Contact information for the mosque coordinator.">
          <Field label="PIC Name" hint="Name of the person responsible for this mosque">
            <Input
              name="pic_name"
              value={formData.pic_name}
              onChange={handleChange}
              placeholder="Enter PIC name"
            />
          </Field>

          <Field label="PIC Phone" hint="Contact number for the PIC">
            <Input
              name="pic_phone"
              value={formData.pic_phone}
              onChange={handleChange}
              placeholder="e.g. 081234567890"
            />
          </Field>
        </SectionCard>
      </div>
    </form>
  );
}
