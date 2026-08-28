import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Tag } from "lucide-react";
import { useCategory, useCreateCategory, useUpdateCategory } from "../hooks";
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
  category_type: "",
  name: "",
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

const CATEGORY_TYPES = [
  { value: "pemasukan", label: "Pemasukan" },
  { value: "pengeluaran", label: "Pengeluaran" },
];

export function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existing, isLoading: isLoadingData } = useCategory(id);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [categoryType, setCategoryType] = useState("");

  useEffect(() => {
    if (isEditing && existing?.data) {
      const d = existing.data;
      setFormData({
        category_type: d.category_type ?? "",
        name: d.name ?? "",
      });
      setCategoryType(d.category_type ?? "");
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
        category_type: categoryType,
      };

      if (isEditing) {
        await updateCategory.mutateAsync({ id, data: submitData });
        toast.success("Category updated.");
        navigate(`/panel/master/categories/${id}`);
      } else {
        await createCategory.mutateAsync(submitData);
        toast.success("Category created.");
        navigate("/panel/master/categories");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

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
            <h1 className="text-xl font-bold leading-tight">{isEditing ? "Edit Category" : "New Category"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditing ? "Update category details." : "Create a new transaction category."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !categoryType || !formData.name}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isEditing ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-xl">
        <SectionCard icon={Tag} title="Category Details" description="Transaction categories for income and expenses.">
          <Field label="Category Type" required hint="Select whether this is income or expense category.">
            <Select value={categoryType} onValueChange={setCategoryType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Category Name" required hint="e.g. Donasi, Pembelian Hewan, Operasional">
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter category name"
              required
            />
          </Field>
        </SectionCard>
      </div>
    </form>
  );
}
