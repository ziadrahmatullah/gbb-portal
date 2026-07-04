import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Loader2, Star, Circle, CheckCircle, XCircle } from "lucide-react";
import { useArticle, useDeleteArticle, useUpdateArticle } from "../hooks/useArticles";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

function StatusBadge({ status }) {
  const colorMap = {
    published: "bg-emerald-500/10 text-emerald-700",
    cancelled: "bg-rose-500/10 text-rose-700",
    draft: "bg-gray-500/10 text-gray-700",
  };
  const dotMap = {
    published: "text-emerald-500",
    cancelled: "text-rose-500",
    draft: "text-gray-400",
  };
  const key = status ?? "draft";
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", colorMap[key] ?? colorMap.draft)}>
      <Circle className={cn("h-1.5 w-1.5 fill-current", dotMap[key] ?? dotMap.draft)} />
      {key}
    </span>
  );
}

export function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useArticle(id);
  const deleteArticle = useDeleteArticle();
  const updateArticle = useUpdateArticle();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const article = data?.data;

  const handleStatusChange = async (newStatus) => {
    try {
      await updateArticle.mutateAsync({
        id,
        data: {
          title: article.title,
          slug: article.slug,
          content: article.content,
          description: article.description,
          excerpt: article.excerpt,
          is_highlight: article.is_highlight,
          image: article.image || "",
          status: newStatus,
        },
      });
      toast.success(newStatus === "published" ? "Article published." : "Article cancelled.");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteArticle.mutateAsync(id);
      toast.success("Article deleted.");
      navigate("/panel/articles");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setConfirmDelete(false);
    }
  };

  if (isLoading) {
    return <div className="h-64 rounded-xl bg-muted animate-pulse" />;
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <p>Article not found.</p>
        <Button variant="outline" onClick={() => navigate("/panel/articles")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Articles
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/panel/articles")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Article Detail</h1>
            <p className="text-sm text-muted-foreground">ID #{article.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {article.status === "draft" && (
            <Button
              variant="outline"
              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => handleStatusChange("published")}
              disabled={updateArticle.isPending}
            >
              {updateArticle.isPending
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <CheckCircle className="h-4 w-4 mr-2" />}
              Publish
            </Button>
          )}
          {article.status === "published" && (
            <Button
              variant="outline"
              className="text-rose-600 border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => handleStatusChange("cancelled")}
              disabled={updateArticle.isPending}
            >
              {updateArticle.isPending
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <XCircle className="h-4 w-4 mr-2" />}
              Cancel
            </Button>
          )}
          {article.status === "cancelled" && (
            <Button
              variant="outline"
              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => handleStatusChange("published")}
              disabled={updateArticle.isPending}
            >
              {updateArticle.isPending
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <CheckCircle className="h-4 w-4 mr-2" />}
              Re-publish
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(`/panel/articles/${id}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Featured image */}
      {article.image && (
        <div className="w-full aspect-video rounded-xl overflow-hidden border bg-muted">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Info card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <CardTitle className="text-lg">{article.title}</CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={article.status} />
              {article.is_highlight && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Highlight
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {article.slug && (
            <div>
              <p className="text-xs text-muted-foreground">Slug</p>
              <p className="text-sm font-mono">{article.slug}</p>
            </div>
          )}
          {article.excerpt && (
            <div>
              <p className="text-xs text-muted-foreground">Excerpt</p>
              <p className="text-sm">{article.excerpt}</p>
            </div>
          )}
          {article.description && (
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm">{article.description}</p>
            </div>
          )}
          {article.content && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Content</p>
              <div className="text-sm whitespace-pre-wrap rounded-lg border bg-muted/40 p-4">{article.content}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t text-xs text-muted-foreground">
            <div>
              <p>Created at</p>
              <p className="text-foreground font-medium">
                {article.created_at ? new Date(article.created_at).toLocaleString("id-ID") : "—"}
              </p>
            </div>
            <div>
              <p>Updated at</p>
              <p className="text-foreground font-medium">
                {article.updated_at ? new Date(article.updated_at).toLocaleString("id-ID") : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{article.title}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteArticle.isPending}>
              {deleteArticle.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
