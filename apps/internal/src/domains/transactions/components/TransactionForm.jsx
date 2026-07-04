import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Wallet, MapPin, Building, Calendar, DollarSign } from "lucide-react";
import {
  useTransaction,
  useCreateTransaction,
  useUpdateTransaction,
  useCategoriesDropdown,
  useDistrictsDropdown,
  useMosquesDropdown,
} from "../hooks/useTransactions";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { SearchableSelect } from "@/shared/components/ui/searchable-select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  category_id: "",
  district_id: "",
  mosque_id: "",
  amount: "",
  description: "",
  transaction_date: new Date().toISOString().split("T")[0],
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

// Category option with badge
function CategoryOption({ category }) {
  const isIncome = category.category_type === "pemasukan";
  return (
    <div className="flex items-center justify-between w-full">
      <span>{category.name}</span>
      <span
        className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          isIncome
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
        )}
      >
        {category.category_type}
      </span>
    </div>
  );
}

export function TransactionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existing, isLoading: isLoadingData } = useTransaction(id);
  const { data: categories } = useCategoriesDropdown();
  const { data: districts } = useDistrictsDropdown();
  const { data: mosques } = useMosquesDropdown();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [categoryId, setCategoryId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [mosqueId, setMosqueId] = useState("");

  const categoryList = categories ?? [];
  const districtList = districts ?? [];
  const mosqueList = mosques ?? [];

  // Filter mosques by selected district
  const filteredMosques = districtId
    ? mosqueList.filter((m) => m.district_id === Number(districtId))
    : [];

  // Reset mosque when district changes
  const handleDistrictChange = (value) => {
    setDistrictId(value);
    setMosqueId("");
    setFormData((prev) => ({ ...prev, district_id: value, mosque_id: "" }));
  };

  useEffect(() => {
    if (isEditing && existing?.data) {
      const d = existing.data;
      const newCategoryId = String(d.category_id ?? "");
      const newDistrictId = String(d.district_id ?? "");
      const newMosqueId = String(d.mosque_id ?? "");

      setFormData({
        category_id: newCategoryId,
        district_id: newDistrictId,
        mosque_id: newMosqueId,
        amount: d.amount ?? "",
        description: d.description ?? "",
        transaction_date: d.transaction_date ?? new Date().toISOString().split("T")[0],
      });
      setCategoryId(newCategoryId);
      setDistrictId(newDistrictId);
      setMosqueId(newMosqueId);
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
        category_id: Number(categoryId),
        district_id: Number(districtId),
        ...(mosqueId && { mosque_id: Number(mosqueId) }),
        amount: Number(formData.amount),
        description: formData.description,
        transaction_date: formData.transaction_date,
      };

      if (isEditing) {
        await updateTransaction.mutateAsync({ id, data: submitData });
        toast.success("Transaction updated.");
        navigate(`/panel/transactions/${id}`);
      } else {
        await createTransaction.mutateAsync(submitData);
        toast.success("Transaction created.");
        navigate("/panel/transactions");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isPending = createTransaction.isPending || updateTransaction.isPending;

  if (isEditing && isLoadingData) {
    return <div className="h-64 rounded-xl bg-muted animate-pulse" />;
  }

  const selectedCategory = categoryList.find((c) => c.id === Number(categoryId));
  const selectedDistrict = districtList.find((d) => d.id === Number(districtId));
  const selectedMosque = mosqueList.find((m) => m.id === Number(mosqueId));

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
              {isEditing ? "Edit Transaction" : "New Transaction"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditing ? "Update transaction details." : "Add a new financial transaction."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              isPending ||
              !categoryId ||
              !districtId ||
              !mosqueId ||
              !formData.amount ||
              !formData.description
            }
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isEditing ? "Save Changes" : "Create Transaction"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-xl space-y-5">
        {/* Transaction Details */}
        <SectionCard icon={Wallet} title="Transaction Details" description="Basic transaction information.">
          <Field label="Category" required hint="Select income or expense category">
            <SearchableSelect
              value={categoryId}
              onChange={setCategoryId}
              options={categoryList}
              placeholder="Select category"
              searchPlaceholder="Search categories..."
              displayValue={(opt) => opt.name}
              renderOption={(opt) => <CategoryOption category={opt} />}
              required
              hideClear
            />
          </Field>

          <Field label="Amount" required hint="Enter transaction amount">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
              <Input
                name="amount"
                type="number"
                min="0"
                step="1000"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0"
                className="pl-10"
                required
              />
            </div>
          </Field>

          <Field label="Description" required hint="Describe this transaction">
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Donasi mingguan dari jemaah"
              rows={3}
              required
            />
          </Field>

          <Field label="Transaction Date" required hint="When did this transaction occur?">
            <Input
              name="transaction_date"
              type="date"
              value={formData.transaction_date}
              onChange={handleChange}
              required
            />
          </Field>
        </SectionCard>

        {/* Location Details */}
        <SectionCard
          icon={MapPin}
          title="Location Details"
          description="Where did this transaction take place?"
        >
          <Field label="District" required hint="Select the district first">
            <SearchableSelect
              value={districtId}
              onChange={handleDistrictChange}
              options={districtList}
              placeholder="Select district"
              searchPlaceholder="Search districts..."
              required
              hideClear
            />
          </Field>

          <Field
            label="Mosque"
            required
            hint={districtId ? "Select a mosque for this transaction" : "Select a district first to choose mosque"}
          >
            <SearchableSelect
              value={mosqueId}
              onChange={setMosqueId}
              options={filteredMosques}
              placeholder={districtId ? "Select mosque" : "Select district first"}
              searchPlaceholder="Search mosques..."
              emptyMessage={districtId ? "No mosques in this district" : "Select a district first"}
              disabled={!districtId}
              displayValue={(opt) => opt.name}
              renderOption={(opt) => (
                <div className="w-full">
                  <div>{opt.name}</div>
                  {opt.district?.name && (
                    <div className="text-xs opacity-70">{opt.district.name}</div>
                  )}
                </div>
              )}
              hideClear
            />
          </Field>
        </SectionCard>
      </div>
    </form>
  );
}
