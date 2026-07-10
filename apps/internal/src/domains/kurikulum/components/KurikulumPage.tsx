import { useState } from "react";
import { cn } from "@/lib/utils";
import { TopikTab } from "./TopikTab";
import { LibraryTab } from "./LibraryTab";

const TABS = [
  { key: "kurikulum", label: "Kurikulum" },
  { key: "library", label: "Library" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function KurikulumPage() {
  const [tab, setTab] = useState<TabKey>("kurikulum");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kurikulum &amp; Library</h1>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "kurikulum" && <TopikTab />}
      {tab === "library" && <LibraryTab />}
    </div>
  );
}
