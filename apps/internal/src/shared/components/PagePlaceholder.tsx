import { Construction } from "lucide-react";

export function PagePlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <Construction className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        <p className="mt-3 text-xs text-muted-foreground">
          Modul ini sedang dalam pengembangan.
        </p>
      </div>
    </div>
  );
}
