import { useState } from "react";
import { cn } from "@/lib/utils";
import { KategoriManagerContent } from "@/domains/keuangan/components/KategoriManager";
import { UsersTab } from "./UsersTab";
import { TemplatesTab } from "./TemplatesTab";
import { AIConfigTab } from "./AIConfigTab";

const TABS = [
  { key: "users", label: "Users & Role" },
  { key: "templates", label: "Template Pesan WA" },
  { key: "kategori", label: "Master Kategori Cashflow" },
  { key: "ai", label: "Konfigurasi AI" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function SettingsPage() {
  const [tab, setTab] = useState<TabKey>("users");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings / Konfigurasi</h1>

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

      {tab === "users" && <UsersTab />}
      {tab === "templates" && <TemplatesTab />}
      {tab === "kategori" && <KategoriManagerContent />}
      {tab === "ai" && <AIConfigTab />}
    </div>
  );
}
