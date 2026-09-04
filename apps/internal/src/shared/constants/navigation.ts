import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarRange,
  Users,
  BookOpen,
  GraduationCap,
  Mic,
  ClipboardList,
  NotebookPen,
  Wallet,
  HandCoins,
  FileText,
  Sparkles,
  Settings,
} from "lucide-react";
import type { MenuKey } from "./menu";

export interface NavItem {
  label: string;
  path?: string;
  icon?: LucideIcon;
  // Kunci hak akses menu (lihat constants/menu.ts). Item daun WAJIB punya key;
  // grup tanpa path tidak — ia tampil selama ada anak yang boleh dibuka.
  // Pembedaan view/edit per role tetap di masing-masing modul (hasAnyRole).
  key?: MenuKey;
  children?: NavItem[];
}

// Urutan sidebar sesuai docs/wireframes-internal.md (gbb-backend).
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/panel", icon: LayoutDashboard, key: "dashboard" },
  { label: "Periode", path: "/panel/periode", icon: CalendarRange, key: "periode" },
  { label: "Beswan", path: "/panel/beswan", icon: Users, key: "beswan" },
  // Lima modul program digabung ke satu grup "Program" atas masukan tim program
  // (Sep 2026). Path anak tidak berubah, jadi bookmark/tautan lama tetap hidup.
  // Path anak tidak saling jadi prefix (lihat catatan startsWith di bawah).
  {
    label: "Program",
    icon: BookOpen,
    children: [
      { label: "Kurikulum", path: "/panel/kurikulum", icon: BookOpen, key: "program_kurikulum" },
      { label: "Mentor", path: "/panel/mentor", icon: GraduationCap, key: "program_mentor" },
      { label: "Event", path: "/panel/event", icon: Mic, key: "program_event" },
      { label: "Penugasan", path: "/panel/penugasan", icon: ClipboardList, key: "program_penugasan" },
      { label: "Refleksi Beswan", path: "/panel/refleksi", icon: NotebookPen, key: "program_refleksi" },
    ],
  },
  // Siapa boleh membuka menu mana kini dari matriks role×menu (Settings › Hak
  // Akses Menu), default-nya = aturan lama (constants/menu.ts DEFAULT_ROLE_MENU).
  //
  // Path adik-beradik sengaja tidak saling jadi prefix (mis. /panel/donatur +
  // /panel/donatur/monitoring), karena isItemActive() di sidebar memakai
  // startsWith — induknya akan ikut menyala saat anaknya dibuka.
  {
    label: "Keuangan",
    icon: Wallet,
    children: [
      { label: "Rekonsiliasi", path: "/panel/keuangan/rekonsiliasi", key: "keuangan_rekonsiliasi" },
      { label: "Overview", path: "/panel/keuangan/overview", key: "keuangan_overview" },
    ],
  },
  {
    label: "Donatur",
    icon: HandCoins,
    children: [
      { label: "Db Donatur", path: "/panel/donatur/database", key: "donatur_database" },
      { label: "Monitoring", path: "/panel/donatur/monitoring", key: "donatur_monitoring" },
    ],
  },
  { label: "Laporan", path: "/panel/laporan", icon: FileText, key: "laporan" },
  // Kelola kartu "Highlight GBB" di Beranda Portal Donatur (mutasi BE: admin, pcm).
  { label: "Highlight", path: "/panel/highlight", icon: Sparkles, key: "highlight" },
];

// Dirender setelah divider di bagian bawah sidebar.
// Kunci "settings" tidak pernah bisa diberikan ke non-admin lewat matriks.
export const SETTINGS_NAV: NavItem = {
  label: "Settings",
  path: "/panel/settings",
  icon: Settings,
  key: "settings",
};

// Saring pohon menu berdasarkan himpunan kunci yang boleh dibuka (dari
// useMenuAccess). Item daun tanpa key dianggap boleh; grup dibuang kalau tidak
// ada anak yang tersisa.
export function filterNavByMenu(items: NavItem[], allowed: ReadonlySet<MenuKey>): NavItem[] {
  return items
    .filter((item) => !item.key || allowed.has(item.key))
    .map((item) =>
      item.children ? { ...item, children: filterNavByMenu(item.children, allowed) } : item
    )
    .filter((item) => item.path || (item.children && item.children.length > 0));
}

// Label per kunci menu untuk tabel Hak Akses — diturunkan dari NAV_ITEMS supaya
// tidak ada dua sumber nama menu.
export function menuLabels(): { key: MenuKey; label: string; group?: string }[] {
  const out: { key: MenuKey; label: string; group?: string }[] = [];
  const visit = (items: NavItem[], group?: string) => {
    for (const item of items) {
      if (item.key) out.push({ key: item.key, label: item.label, group });
      if (item.children) visit(item.children, item.label);
    }
  };
  visit([...NAV_ITEMS, SETTINGS_NAV]);
  return out;
}

export interface Crumb {
  label: string;
  to?: string;
}

// Longest-prefix match atas NAV_ITEMS + SETTINGS_NAV.
// Grup tanpa path (Keuangan, Donatur) ikut sebagai crumb non-link.
export function findBreadcrumb(pathname: string): Crumb[] {
  const matches: { crumbs: Crumb[]; len: number }[] = [];

  const visit = (items: NavItem[], trail: Crumb[]) => {
    for (const item of items) {
      const crumbs = [...trail, { label: item.label, to: item.path }];
      if (item.path) {
        const matched =
          pathname === item.path ||
          (item.path !== "/panel" && pathname.startsWith(item.path + "/"));
        if (matched) {
          matches.push({ crumbs, len: item.path.length });
        }
      }
      if (item.children) visit(item.children, crumbs);
    }
  };

  visit([...NAV_ITEMS, SETTINGS_NAV], []);
  const best = matches.reduce<{ crumbs: Crumb[]; len: number } | null>(
    (acc, m) => (!acc || m.len > acc.len ? m : acc),
    null
  );
  return best?.crumbs ?? [{ label: "Dashboard" }];
}
