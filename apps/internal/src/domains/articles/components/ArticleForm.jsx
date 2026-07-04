import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  ImageIcon,
  Upload,
  X,
  Star,
  Globe,
} from "lucide-react";
import {
  useArticle,
  useCreateArticle,
  useUpdateArticle,
} from "../hooks/useArticles";
import { generateSlug } from "../services";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
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
  title: "",
  slug: "",
  content: "",
  description: "",
  excerpt: "",
  is_highlight: false,
  status: "draft",
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

// Image upload component
function ImageUpload({ image, onChange, existingUrl }) {
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
        <div className="relative w-full aspect-video max-w-lg rounded-lg overflow-hidden border bg-muted">
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
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "w-full aspect-video max-w-lg rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors",
            "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Click to upload featured image</p>
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

export function ArticleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existing, isLoading: isLoadingData } = useArticle(id);
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (isEditing && existing?.data) {
      const d = existing.data;
      setFormData({
        title: d.title ?? "",
        slug: d.slug ?? "",
        content: d.content ?? "",
        description: d.description ?? "",
        excerpt: d.excerpt ?? "",
        is_highlight: d.is_highlight ?? false,
        status: d.status ?? "draft",
        image: null,
      });
    }
  }, [isEditing, existing]);

  // Auto-generate slug from title
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      // Only auto-generate slug if it's empty or was previously auto-generated
      slug: prev.slug === "" || prev.slug === generateSlug(prev.title)
        ? generateSlug(title)
        : prev.slug,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSlugChange = (e) => {
    setFormData((prev) => ({ ...prev, slug: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // PUT uses JSON
        const submitData = {
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          description: formData.description,
          excerpt: formData.excerpt,
          is_highlight: formData.is_highlight,
          status: formData.status,
          image: existing?.data?.image || "", // Keep existing image URL
        };
        await updateArticle.mutateAsync({ id, data: submitData });
        toast.success("Article updated.");
        navigate(`/panel/articles/${id}`);
      } else {
        // POST uses FormData
        const submitData = new FormData();
        submitData.append("title", formData.title);
        submitData.append("slug", formData.slug);
        submitData.append("content", formData.content);
        submitData.append("description", formData.description);
        submitData.append("excerpt", formData.excerpt);
        submitData.append("is_highlight", formData.is_highlight ? "true" : "false");
        submitData.append("status", formData.status);
        if (imageFile) submitData.append("image", imageFile);

        await createArticle.mutateAsync(submitData);
        toast.success("Article created.");
        navigate("/panel/articles");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isPending = createArticle.isPending || updateArticle.isPending;

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
              {isEditing ? "Edit Article" : "New Article"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditing ? "Update article content." : "Create a new article for publication."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || !formData.title || !formData.slug}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isEditing ? "Save Changes" : "Publish Article"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl space-y-5">
        {/* Featured Image */}
        <SectionCard
          icon={ImageIcon}
          title="Featured Image"
          description={isEditing ? "Current featured image." : "Upload a featured image for this article."}
        >
          {isEditing ? (
            <div className="space-y-3">
              <div className="w-full aspect-video max-w-lg rounded-lg overflow-hidden border bg-muted">
                <img
                  src={existing?.data?.image}
                  alt="Featured"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Image cannot be changed in edit mode.
              </p>
            </div>
          ) : (
            <ImageUpload
              image={imageFile}
              onChange={setImageFile}
            />
          )}
        </SectionCard>

        {/* Basic Info */}
        <SectionCard
          icon={FileText}
          title="Article Details"
          description="Basic information about this article."
        >
          <Field label="Title" required hint="Article headline">
            <Input
              name="title"
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="Enter article title"
              required
            />
          </Field>

          <Field label="Slug" required hint="URL-friendly version of the title">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">/articles/</span>
              <Input
                name="slug"
                value={formData.slug}
                onChange={handleSlugChange}
                placeholder="article-url-slug"
                required
                className="flex-1"
              />
            </div>
          </Field>

          <Field label="Excerpt" hint="Short summary for previews and meta description">
            <Input
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="Brief summary of the article..."
            />
          </Field>

          <Field label="Description" hint="Additional description or meta info">
            <Textarea
              name="description"
              value={formData.description}
              onChange={(e) => {
                handleChange(e);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Article description..."
              className="min-h-16 overflow-hidden resize-none"
            />
          </Field>

          <Field label="Content" required hint="Main article content">
            <Textarea
              name="content"
              value={formData.content}
              onChange={(e) => {
                handleChange(e);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onFocus={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Write your article content here..."
              className="min-h-52 overflow-hidden resize-none"
              required
            />
          </Field>
        </SectionCard>

        {/* Publishing Options */}
        <SectionCard
          icon={Globe}
          title="Publishing Options"
          description="Control how this article is displayed."
        >
          {/* Status */}
          <Field label="Status" required>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Highlight */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm">Featured Article</Label>
              <p className="text-xs text-muted-foreground">
                Highlight this article on the homepage
              </p>
            </div>
            <Switch
              checked={formData.is_highlight}
              onCheckedChange={(v) => setFormData((prev) => ({ ...prev, is_highlight: v }))}
            />
          </div>
        </SectionCard>
      </div>
    </form>
  );
}
