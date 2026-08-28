import { Card, CardContent } from "@gbb/ui";

export function PagePlaceholder({ title, description, wireframeRef }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        {wireframeRef && (
          <p className="text-xs text-muted-foreground">
            Spek wireframe: <code className="rounded bg-muted px-1.5 py-0.5">{wireframeRef}</code>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
