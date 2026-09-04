import { useMemo, useState } from "react";
import { Info, Lock, RotateCcw, Save } from "lucide-react";
import { Badge, Skeleton, cn } from "@gbb/ui";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { CONFIGURABLE_ROLES, DEFAULT_ROLE_MENU, ROLE_MENU_ENABLED } from "@/shared/constants/menu";
import type { MenuKey } from "@/shared/constants/menu";
import type { Role } from "@/shared/constants/roles";
import { menuLabels } from "@/shared/constants/navigation";
import { useRoleMenu, useUpdateRoleMenu } from "../hooks/useSettings";

type Matrix = Record<Role, Set<MenuKey>>;

function fromDefaults(): Matrix {
  return Object.fromEntries(
    (Object.keys(DEFAULT_ROLE_MENU) as Role[]).map((r) => [r, new Set(DEFAULT_ROLE_MENU[r])])
  ) as Matrix;
}

// Matriks role × menu — menentukan MENU MANA yang boleh DIBUKA tiap role.
// Hak edit di dalam menu (tombol Tambah/Hapus dst) tetap per role dan tidak
// diatur di sini (FEpromt27). admin & kunci "settings" terkunci.
export function RoleMenuTab() {
  const { data, isLoading } = useRoleMenu(ROLE_MENU_ENABLED);
  const updateMutation = useUpdateRoleMenu();
  const menus = useMemo(() => menuLabels(), []);

  // Baseline dari server (kalau flag hidup & data ada), jatuh ke default
  const baseline = useMemo<Matrix>(() => {
    const m = fromDefaults();
    if (ROLE_MENU_ENABLED && data) {
      for (const r of CONFIGURABLE_ROLES) if (data[r]) m[r] = new Set(data[r]);
    }
    return m;
  }, [data]);

  // Draft lokal: hanya role yang disentuh disimpan di sini
  const [draft, setDraft] = useState<Partial<Record<Role, Set<MenuKey>>>>({});
  const current = (r: Role) => draft[r] ?? baseline[r];
  const dirtyRoles = CONFIGURABLE_ROLES.filter((r) => {
    const d = draft[r];
    if (!d) return false;
    const b = baseline[r];
    return d.size !== b.size || [...d].some((k) => !b.has(k));
  });

  const toggle = (r: Role, key: MenuKey) => {
    if (key === "settings") return;
    setDraft((prev) => {
      const next = new Set(current(r));
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, [r]: next };
    });
  };

  const save = async () => {
    for (const r of dirtyRoles) {
      // settings tidak pernah dikirim — BE mengabaikannya, tapi jangan beri kesan bisa
      const keys = [...current(r)].filter((k) => k !== "settings");
      await updateMutation.mutateAsync({ role: r, menuKeys: keys });
    }
    setDraft({});
  };

  const readOnly = !ROLE_MENU_ENABLED;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Centang menu yang boleh <strong>dibuka</strong> tiap role. Hak <em>mengubah</em> data di
          dalam menu (tombol Tambah/Edit/Hapus) tetap mengikuti role dan tidak diatur di sini.
          Perubahan berlaku untuk user role itu saat mereka memuat ulang halaman.
        </p>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDraft({})} disabled={!dirtyRoles.length || updateMutation.isPending}>
              <RotateCcw className="h-3.5 w-3.5" />
              Batalkan
            </Button>
            <Button size="sm" onClick={save} disabled={!dirtyRoles.length || updateMutation.isPending}>
              <Save className="h-3.5 w-3.5" />
              {updateMutation.isPending ? "Menyimpan…" : `Simpan${dirtyRoles.length ? ` (${dirtyRoles.length} role)` : ""}`}
            </Button>
          </div>
        )}
      </div>

      {readOnly && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Mode baca: matriks ini menampilkan aturan bawaan. Pengaturan bisa diubah setelah
            endpoint backend-nya aktif (FEpromt27) dan <code className="text-xs">VITE_ROLE_MENU_ENABLED=true</code>.
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Menu</TableHead>
              <TableHead className="w-24 text-center">
                <span className="inline-flex items-center gap-1">
                  admin <Lock className="h-3 w-3 text-muted-foreground" />
                </span>
              </TableHead>
              {CONFIGURABLE_ROLES.map((r) => (
                <TableHead key={r} className="w-24 text-center">
                  <span className="inline-flex items-center gap-1">
                    {r}
                    {dirtyRoles.includes(r) && <span className="h-1.5 w-1.5 rounded-full bg-primary" title="Belum disimpan" />}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && ROLE_MENU_ENABLED
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={2 + CONFIGURABLE_ROLES.length}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : menus.map((m) => {
                  const locked = m.key === "settings";
                  return (
                    <TableRow key={m.key} className={cn(locked && "bg-muted/30")}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {m.group && (
                            <Badge variant="outline" className="font-normal text-muted-foreground">
                              {m.group}
                            </Badge>
                          )}
                          <span className="font-medium">{m.label}</span>
                          {locked && (
                            <span className="text-xs text-muted-foreground">— hanya admin</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <input type="checkbox" checked readOnly disabled className="h-4 w-4 accent-primary opacity-60" />
                      </TableCell>
                      {CONFIGURABLE_ROLES.map((r) => (
                        <TableCell key={r} className="text-center">
                          <input
                            type="checkbox"
                            checked={current(r).has(m.key)}
                            disabled={locked || readOnly || updateMutation.isPending}
                            onChange={() => toggle(r, m.key)}
                            aria-label={`${r} boleh membuka ${m.label}`}
                            className="h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
