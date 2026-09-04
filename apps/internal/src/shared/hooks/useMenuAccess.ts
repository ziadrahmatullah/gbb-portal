import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/apiClient";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { MENU_KEYS, ROLE_MENU_ENABLED, defaultMenuFor } from "@/shared/constants/menu";
import type { MenuKey } from "@/shared/constants/menu";

export const MENU_ACCESS_KEY = "menu-access";

// GET /internal/account/menu (FEpromt27) — himpunan menu yang boleh dibuka
// user yang login. admin → semua kunci.
async function getMyMenu() {
  const res = await apiClient.get<{ role: string; menu_keys: MenuKey[] }>("/internal/account/menu");
  return res.data?.menu_keys ?? [];
}

// Satu sumber kebenaran untuk sidebar & guard rute. Saat flag mati atau
// request gagal → jatuh ke DEFAULT_ROLE_MENU (identik dengan aturan hardcoded
// lama), jadi tampilan tidak pernah kosong. admin selalu semua tanpa request.
export function useMenuAccess(): { allowed: ReadonlySet<MenuKey>; isPending: boolean } {
  const role = useAuthStore((s) => s.role);
  const enabled = ROLE_MENU_ENABLED && !!role && role !== "admin";

  const query = useQuery({
    queryKey: [MENU_ACCESS_KEY, role],
    queryFn: getMyMenu,
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const allowed = useMemo<ReadonlySet<MenuKey>>(() => {
    if (role === "admin") return new Set(MENU_KEYS);
    if (enabled && query.isSuccess) return new Set(query.data);
    return defaultMenuFor(role);
  }, [role, enabled, query.isSuccess, query.data]);

  return { allowed, isPending: enabled && query.isPending };
}
