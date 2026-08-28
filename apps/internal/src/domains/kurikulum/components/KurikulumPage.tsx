import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@gbb/ui";
import { TopikTab } from "./TopikTab";
import { TopikUsulanTab } from "./TopikUsulanTab";
import { LibraryTab } from "./LibraryTab";

const TABS = [
  { key: "kurikulum", label: "Kurikulum" },
  { key: "usulan", label: "Usulan Topik" },
  { key: "library", label: "Library" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function KurikulumPage() {
  const [tab, setTab] = useState<TabKey>("kurikulum");

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Kurikulum &amp; Library</h1>
      </div>

      <Tabs value={tab} onValueChange={(v: string) => setTab(v as TabKey)} className="space-y-4">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="kurikulum" className="space-y-4">
          <TopikTab />
        </TabsContent>
        <TabsContent value="usulan" className="space-y-4">
          <TopikUsulanTab />
        </TabsContent>
        <TabsContent value="library" className="space-y-4">
          <LibraryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
