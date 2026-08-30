import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronsUpDown,
  Clock,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  User,
  Users,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@gbb/ui";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { useUIStore } from "@/shared/store/useUIStore";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";

const NAV_ITEMS = [
  { label: "Beranda", path: "/beranda", icon: Home },
  { label: "Daftar Mentor!", path: "/daftar-mentor", icon: GraduationCap },
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Data Beswan", path: "/data-beswan", icon: Users },
  { label: "Laporan", path: "/laporan", icon: FileText },
  { label: "Profile", path: "/profile", icon: User },
];

function initials(name: string | null | undefined): string {
  return (
    (name ?? "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "D"
  );
}

function AppSidebar() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent">
              <Link to="/beranda" onClick={() => setOpenMobile(false)}>
                {/* Logo "Salinan Warna_Logo only" — object-contain menjaga rasio 681x554,
                    kotak putih agar tetap terbaca di sidebar biru (juga saat collapsed) */}
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-white p-1">
                  <img src="/assets/logo/gbb-logo-only.png" alt="GBB" className="size-6 object-contain" />
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-bold">GBB Portal</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Donatur</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith(item.path)}
                  tooltip={item.label}
                >
                  <NavLink to={item.path} onClick={() => setOpenMobile(false)}>
                    <item.icon />
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

// Jam & tanggal real-time di topbar — komponen terpisah supaya re-render
// per detik tidak menjalar ke seluruh layout
function HeaderClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="hidden items-center gap-4 text-muted-foreground md:flex">
      <div className="flex items-center gap-1.5 text-xs">
        <Calendar className="size-3.5 shrink-0" />
        <span className="hidden whitespace-nowrap lg:inline">{dateStr}</span>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-xs">
        <Clock className="size-3.5 shrink-0" />
        <span>{timeStr}</span>
      </div>
    </div>
  );
}

export function AppLayout() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const { isDark, toggleDark, initTheme } = useUIStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    initTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* ===== Header (pola shadcn-admin) ===== */}
        <header className="header-art sticky top-0 z-50 flex h-16 items-center gap-3 border-b bg-header/95 px-4 backdrop-blur sm:gap-4">
          <SidebarTrigger variant="outline" className="max-md:scale-125" />
          <Separator orientation="vertical" className="!h-6" />
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">GBB Donatur Portal</h1>

          <HeaderClock />
          <Separator orientation="vertical" className="hidden !h-6 md:block" />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDark}
            className="text-muted-foreground hover:text-foreground"
          >
            {isDark ? <Sun /> : <Moon />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-1.5">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {initials(profile?.nama)}
                  </AvatarFallback>
                </Avatar>
                <ChevronsUpDown className="hidden size-3.5 text-muted-foreground sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56">
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                      {initials(profile?.nama)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 leading-tight">
                    <span className="truncate text-sm font-semibold">{profile?.nama ?? "Donatur"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {profile?.email ?? "-"}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setShowLogoutDialog(true)}>
                <LogOut />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* ===== Page content ===== */}
        <main className="px-4 py-6 md:px-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </SidebarInset>

      {/* Logout dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Logout</DialogTitle>
            <DialogDescription>Apakah kamu yakin ingin keluar?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Ya, Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
