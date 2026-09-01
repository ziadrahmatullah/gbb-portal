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
  Settings,
} from "lucide-react";
import { hasAnyRole } from "./roles";
import type { Role } from "./roles";

export interface NavItem {
  label: string;
  path?: string;
  icon?: LucideIcon;
  // undefined = tampil untuk semua role. Hanya aturan HIDE eksplisit dari
  // wireframes-internal.md yang dipasang di sini; pembedaan view/edit per role
  // ditangani di masing-masing modul nanti.
  roles?: Role[];
  children?: NavItem[];
}

// Urutan sidebar sesuai docs/wireframes-internal.md (gbb-backend).
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/panel", icon: LayoutDashboard },
  { label: "Periode", path: "/panel/periode", icon: CalendarRange },
  { label: "Beswan", path: "/panel/beswan", icon: Users },
  { label: "Kurikulum", path: "/panel/kurikulum", icon: BookOpen },
  { label: "Mentor", path: "/panel/mentor", icon: GraduationCap },
  { label: "Event", path: "/panel/event", icon: Mic },
  { label: "Penugasan", path: "/panel/penugasan", icon: ClipboardList },
  { label: "Refleksi Beswan", path: "/panel/refleksi", icon: NotebookPen },
  {
    label: "Keuangan",
    icon: Wallet,
    children: [
      // Wireframe §8: admin+finance kelola, anc view; disembunyikan dari pcm & viewer
      {
        label: "Rekonsiliasi",
        path: "/panel/keuangan/rekonsiliasi",
        roles: ["admin", "finance", "anc"],
      },
      // Viewer boleh Overview (beda kebijakan dari Rekonsiliasi); pcm tidak keduanya
      {
        label: "Overview",
        path: "/panel/keuangan/overview",
        roles: ["admin", "finance", "anc", "viewer"],
      },
    ],
  },
  // Dipisah dari grup Keuangan (menyimpang dari urutan wireframes-internal.md)
  // atas permintaan tim: Donatur berdiri sebagai menu sendiri. Kebijakan role
  // §10/§11 tidak berubah — admin+anc+finance+viewer, pcm tidak akses.
  //
  // Path adik-beradik sengaja tidak saling jadi prefix (mis. /panel/donatur +
  // /panel/donatur/monitoring), karena isItemActive() di sidebar memakai
  // startsWith — induknya akan ikut menyala saat anaknya dibuka.
  {
    label: "Donatur",
    icon: HandCoins,
    children: [
      {
        label: "Db Donatur",
        path: "/panel/donatur/database",
        roles: ["admin", "anc", "finance", "viewer"],
      },
      {
        label: "Monitoring",
        path: "/panel/donatur/monitoring",
        roles: ["admin", "anc", "finance", "viewer"],
      },
    ],
  },
  { label: "Laporan", path: "/panel/laporan", icon: FileText },
];

// Dirender setelah divider di bagian bawah sidebar.
export const SETTINGS_NAV: NavItem = {
  label: "Settings",
  path: "/panel/settings",
  icon: Settings,
  roles: ["admin"],
};

export function filterNavByRole(items: NavItem[], role: Role | null): NavItem[] {
  return items
    .filter((item) => hasAnyRole(role, item.roles))
    .map((item) =>
      item.children ? { ...item, children: filterNavByRole(item.children, role) } : item
    )
    .filter((item) => item.path || (item.children && item.children.length > 0));
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
