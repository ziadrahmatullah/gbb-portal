import type { Role } from "./roles";

// Kunci menu = kontrak dengan BE (gbb-backend/promt/FEpromt27.txt). Yang bisa
// diatur admin adalah MENU MANA yang boleh DIBUKA sebuah role; hak edit di
// dalam menu tetap per role (hasAnyRole di masing-masing halaman).
export const MENU_KEYS = [
  "dashboard",
  "periode",
  "beswan",
  "program_kurikulum",
  "program_mentor",
  "program_event",
  "program_penugasan",
  "program_refleksi",
  "keuangan_rekonsiliasi",
  "keuangan_overview",
  "donatur_database",
  "donatur_monitoring",
  "laporan",
  "highlight",
  "settings",
] as const;

export type MenuKey = (typeof MENU_KEYS)[number];

// Role yang bisa diatur lewat matriks. admin selalu semua & tidak bisa diubah.
export const CONFIGURABLE_ROLES: readonly Role[] = ["pcm", "finance", "anc", "viewer"];

const PROGRAM: MenuKey[] = [
  "program_kurikulum",
  "program_mentor",
  "program_event",
  "program_penugasan",
  "program_refleksi",
];
const UMUM: MenuKey[] = ["dashboard", "periode", "beswan", ...PROGRAM, "laporan"];

// Default = aturan hardcoded sebelum matriks ada (mirror router.go BE &
// `roles:` lama di navigation.ts). Dipakai saat flag mati atau endpoint
// /internal/account/menu gagal — supaya tampilan tidak berubah.
export const DEFAULT_ROLE_MENU: Record<Role, readonly MenuKey[]> = {
  admin: MENU_KEYS,
  pcm: [...UMUM, "highlight"],
  finance: [...UMUM, "keuangan_rekonsiliasi", "keuangan_overview", "donatur_database", "donatur_monitoring"],
  anc: [...UMUM, "keuangan_rekonsiliasi", "keuangan_overview", "donatur_database", "donatur_monitoring"],
  viewer: [...UMUM, "keuangan_overview", "donatur_database", "donatur_monitoring"],
};

export const ROLE_MENU_ENABLED = import.meta.env.VITE_ROLE_MENU_ENABLED === "true";

export function defaultMenuFor(role: Role | null): Set<MenuKey> {
  return new Set(role ? DEFAULT_ROLE_MENU[role] : []);
}
