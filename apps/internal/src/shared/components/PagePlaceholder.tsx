import { Construction } from "lucide-react";
import { Card, CardContent } from "@gbb/ui";

export function PagePlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center gap-2 text-center">
          <Construction className="size-10 text-muted-foreground/60" />
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <p className="text-xs text-muted-foreground">
            Modul ini sedang dalam pengembangan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
