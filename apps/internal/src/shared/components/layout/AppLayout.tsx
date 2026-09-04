import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  KeyRound,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { useUIStore } from "@/shared/store/useUIStore";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { useMenuAccess } from "@/shared/hooks/useMenuAccess";
import { usePeriodeOptions } from "@/domains/periode/hooks/usePeriode";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { NotificationBell } from "@/domains/notifikasi";
import { ChangePasswordDialog } from "@/domains/settings/components/ChangePasswordDialog";
import {
  NAV_ITEMS,
  SETTINGS_NAV,
  filterNavByMenu,
  findBreadcrumb,
} from "@/shared/constants/navigation";
import type { NavItem } from "@/shared/constants/navigation";
import {
  Avatar,
  AvatarFallback,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@gbb/ui";

const ALL_PERIODE = "all";

// Filter periode global di bagian bawah sidebar (wireframe Global Layout).
function GlobalPeriodeFilter() {
  const { data, isLoading } = usePeriodeOptions();
  const periodeId = usePeriodeFilter((s) => s.periodeId);
  const setPeriodeId = usePeriodeFilter((s) => s.setPeriodeId);

  // Reset kalau periode terpilih (persisted) sudah tidak ada, mis. dihapus admin
  useEffect(() => {
    if (data && periodeId && !data.items.some((p) => String(p.id) === periodeId)) {
      setPeriodeId(null);
    }
  }, [data, periodeId, setPeriodeId]);

  return (
    <div className="px-2 pb-1 group-data-[collapsible=icon]:hidden">
      <div className="text-sidebar-foreground/70 mb-1.5 px-2 text-xs font-medium">
        Filter Periode
      </div>
      <Select
        value={periodeId ?? ALL_PERIODE}
        onValueChange={(v: string) => setPeriodeId(v === ALL_PERIODE ? null : v)}
        disabled={isLoading}
      >
        {/* text-foreground eksplisit: teks jangan mewarisi putih dari sidebar biru,
            karena background field ini putih (bg-background) */}
        <SelectTrigger size="sm" className="w-full bg-background text-foreground">
          <SelectValue placeholder={isLoading ? "Memuat…" : "Semua Periode"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_PERIODE}>Semua Periode</SelectItem>
          {data?.items.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>
              {p.nama}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function isItemActive(pathname: string, item: NavItem): boolean {
  if (!item.path) return false;
  if (item.path === "/panel") return pathname === "/panel";
  return pathname.startsWith(item.path);
}

function NavLeaf({ item }: { item: NavItem }) {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isItemActive(location.pathname, item)} tooltip={item.label}>
        <NavLink to={item.path ?? "#"} end={item.path === "/panel"} onClick={() => setOpenMobile(false)}>
          {item.icon && <item.icon />}
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavCollapsible({ item }: { item: NavItem }) {
  const location = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const inGroup = item.children?.some((c) => isItemActive(location.pathname, c)) ?? false;

  // Mode ikon: grup jadi dropdown menyamping (pola shadcn-admin)
  if (state === "collapsed" && !isMobile) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip={item.label} isActive={inGroup}>
              {item.icon && <item.icon />}
              <span>{item.label}</span>
              <ChevronRight className="ms-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={4} className="min-w-48">
            <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {item.children?.map((child) => (
              <DropdownMenuItem key={child.path} asChild>
                <NavLink to={child.path ?? "#"}>
                  <span>{child.label}</span>
                </NavLink>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild defaultOpen={inGroup} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.label}>
            {item.icon && <item.icon />}
            <span>{item.label}</span>
            <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children?.map((child) => (
              <SidebarMenuSubItem key={child.path}>
                <SidebarMenuSubButton asChild isActive={isItemActive(location.pathname, child)}>
                  <NavLink to={child.path ?? "#"} onClick={() => setOpenMobile(false)}>
                    <span>{child.label}</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  // Menu yang tampil = himpunan kunci dari matriks role×menu (default = aturan lama)
  const { allowed } = useMenuAccess();
  const navItems = filterNavByMenu(NAV_ITEMS, allowed);
  const settingsItems = filterNavByMenu([SETTINGS_NAV], allowed);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent">
              <Link to="/panel" onClick={() => setOpenMobile(false)}>
                {/* Logo "Salinan Warna_Logo only" — object-contain menjaga rasio 681x554,
                    kotak putih agar tetap terbaca di sidebar biru (juga saat collapsed) */}
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-white p-1">
                  <img src="/assets/logo/gbb-logo-only.png" alt="GBB" className="size-6 object-contain" />
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-bold">GBB Portal</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Internal</span>
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
            {navItems.map((item) =>
              item.children ? (
                <NavCollapsible key={item.label} item={item} />
              ) : (
                <NavLeaf key={item.path} item={item} />
              )
            )}
          </SidebarMenu>
        </SidebarGroup>

        {settingsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Lainnya</SidebarGroupLabel>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <NavLeaf key={item.path} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <GlobalPeriodeFilter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function initials(name: string | null | undefined, fallback: string): string {
  const source = name?.trim() || fallback;
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";
}

function ProfileDropdown({
  onChangePassword,
  onLogout,
}: {
  onChangePassword: () => void;
  onLogout: () => void;
}) {
  const role = useAuthStore((s) => s.role);
  const email = useAuthStore((s) => s.email);
  const nama = useAuthStore((s) => s.nama);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-1.5">
          <Avatar className="size-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
              {initials(nama, email ?? "User")}
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
                {initials(nama, email ?? "User")}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 leading-tight">
              <span className="truncate text-sm font-semibold">{nama ?? email ?? "User"}</span>
              {email && <span className="truncate text-xs text-muted-foreground">{email}</span>}
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{role ?? "-"}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onChangePassword}>
          <KeyRound />
          Ganti Password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

function Breadcrumbs() {
  const location = useLocation();
  const breadcrumbs = findBreadcrumb(location.pathname);

  return (
    <nav className="flex min-w-0 flex-1 items-center gap-1 text-sm">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        return (
          <span key={idx} className="flex min-w-0 items-center gap-1">
            {idx > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
            {isLast || !crumb.to ? (
              <span className={cn("truncate", isLast ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.to} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function AppLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { isDark, toggleDark, initTheme } = useUIStore();

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
          <Breadcrumbs />
          <HeaderClock />
          <Separator orientation="vertical" className="hidden !h-6 md:block" />

          <NotificationBell />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDark}
            className="text-muted-foreground hover:text-foreground"
          >
            {isDark ? <Sun /> : <Moon />}
          </Button>

          <ProfileDropdown
            onChangePassword={() => setShowChangePassword(true)}
            onLogout={() => setShowLogoutDialog(true)}
          />
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

      {showChangePassword && <ChangePasswordDialog onClose={() => setShowChangePassword(false)} />}
    </SidebarProvider>
  );
}
