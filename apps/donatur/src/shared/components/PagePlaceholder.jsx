export function PagePlaceholder({ title, description, wireframeRef }) {
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <h1 className="text-xl font-bold mb-1">{title}</h1>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      {wireframeRef && (
        <p className="text-xs text-muted-foreground">
          Spek wireframe: <code className="bg-muted px-1.5 py-0.5 rounded">{wireframeRef}</code>
        </p>
      )}
    </div>
  );
}
