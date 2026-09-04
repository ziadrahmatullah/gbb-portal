import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@gbb/ui";
import { KategoriManagerContent } from "@/domains/keuangan/components/KategoriManager";
import { UsersTab } from "./UsersTab";
import { AIConfigTab } from "./AIConfigTab";
import { RoleMenuTab } from "./RoleMenuTab";

// Template Pesan WA pindah ke Donatur › Monitoring (tab "Template Pesan") atas
// masukan tim AnC: pesan disiapkan dan dikirim dari satu halaman yang sama.
// Komponennya tetap di domains/settings/components/TemplatesTab.tsx.
const TABS = [
  { key: "users", label: "Users & Role" },
  { key: "akses", label: "Hak Akses Menu" },
  { key: "kategori", label: "Master Kategori Cashflow" },
  { key: "ai", label: "Konfigurasi AI" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function SettingsPage() {
  const [tab, setTab] = useState<TabKey>("users");

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Settings / Konfigurasi</h1>
        <p className="text-muted-foreground">Kelola user, hak akses menu per role, kategori cashflow, dan penyedia AI.</p>
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
        <TabsContent value="users" className="space-y-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="akses" className="space-y-4">
          <RoleMenuTab />
        </TabsContent>
        <TabsContent value="kategori" className="space-y-4">
          <KategoriManagerContent />
        </TabsContent>
        <TabsContent value="ai" className="space-y-4">
          <AIConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
