import type { LucideIcon } from "lucide-react";
import { FileText, GraduationCap, Home, LayoutDashboard, User, Users } from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  // true = hanya untuk donatur yang aktif berdonasi bulan ini (lihat
  // shared/hooks/useDonaturStatus). Item TETAP dirender saat terkunci — diberi
  // ikon gembok dan mengarah ke panel ajakan, bukan disembunyikan: menu yang
  // hilang tidak bisa mengajak siapa pun untuk patungan.
  requiresAktif?: boolean;
}

// Urutan sidebar sesuai docs/wireframes-donatur.md
export const NAV_ITEMS: NavItem[] = [
  { label: "Beranda", path: "/beranda", icon: Home },
  { label: "Daftar Mentor!", path: "/daftar-mentor", icon: GraduationCap, requiresAktif: true },
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Data Beswan", path: "/data-beswan", icon: Users, requiresAktif: true },
  { label: "Laporan", path: "/laporan", icon: FileText, requiresAktif: true },
  { label: "Profile", path: "/profile", icon: User },
];
