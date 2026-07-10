import { useState, useEffect, useCallback } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  KeyRound,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  Sun,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { useUIStore } from "@/shared/store/useUIStore";
import { usePeriodeFilter } from "@/shared/store/usePeriodeFilter";
import { usePeriodeOptions } from "@/domains/periode/hooks/usePeriode";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { ChangePasswordDialog } from "@/domains/settings/components/ChangePasswordDialog";
import {
  NAV_ITEMS,
  SETTINGS_NAV,
  filterNavByRole,
  findBreadcrumb,
} from "@/shared/constants/navigation";
import type { NavItem } from "@/shared/constants/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

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
    <div className="border-t p-3 shrink-0">
      <div className="text-xs font-semibold px-2 mb-1.5 text-muted-foreground tracking-wider">
        Filter Periode
      </div>
      <Select
        value={periodeId ?? ALL_PERIODE}
        onValueChange={(v: string) => setPeriodeId(v === ALL_PERIODE ? null : v)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full">
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

function NavLeaf({ item, collapsed, nested }: { item: NavItem; collapsed: boolean; nested?: boolean }) {
  return (
    <NavLink
      to={item.path ?? "#"}
      end={item.path === "/panel"}
      title={item.label}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent",
          collapsed ? "p-2 justify-center" : "px-3 py-2",
          nested && !collapsed && "pl-9",
          isActive
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:text-foreground"
        )
      }
    >
      {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function NavGroup({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const inGroup = item.children?.some((c) => c.path && location.pathname.startsWith(c.path)) ?? false;
  const [open, setOpen] = useState(inGroup);
  const [prevInGroup, setPrevInGroup] = useState(inGroup);

  // Auto-buka grup saat navigasi masuk ke salah satu child-nya
  // (pola "adjusting state during render", bukan lewat effect)
  if (inGroup !== prevInGroup) {
    setPrevInGroup(inGroup);
    if (inGroup) setOpen(true);
  }

  if (collapsed) {
    // Mode ikon: klik grup = expand sidebar + buka grup
    return (
      <button
        type="button"
        title={item.label}
        onClick={() => {
          if (!sidebarOpen) toggleSidebar();
          setOpen(true);
        }}
        className={cn(
          "w-full flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent",
          inGroup ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent",
          inGroup ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
        <span className="flex-1 text-left truncate">{item.label}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", !open && "-rotate-90")} />
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {item.children?.map((child) => (
            <NavLeaf key={child.path} item={child} collapsed={false} nested />
          ))}
        </div>
      )}
    </div>
  );
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const email = useAuthStore((s) => s.email);
  const logout = useAuthStore((s) => s.logout);
  const [now, setNow] = useState(new Date());
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const { sidebarOpen, isDark, toggleSidebar, toggleDark, initTheme } = useUIStore();

  useEffect(() => {
    initTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeSidebarOnMobile = useCallback(() => {
    if (isMobile && sidebarOpen) toggleSidebar();
  }, [isMobile, sidebarOpen, toggleSidebar]);

  useEffect(() => {
    closeSidebarOnMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const navItems = filterNavByRole(NAV_ITEMS, role);
  const settingsItems = filterNavByRole([SETTINGS_NAV], role);
  const breadcrumbs = findBreadcrumb(location.pathname);

  const sidebarWidth = isMobile ? 256 : sidebarOpen ? 256 : 64;
  const mainMarginLeft = isMobile ? 0 : sidebarOpen ? 256 : 64;
  const collapsed = !isMobile && !sidebarOpen;

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

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
    <div className="h-screen overflow-hidden bg-background flex">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-9 bg-black/50"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Logout dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Logout</DialogTitle>
            <DialogDescription>Apakah kamu yakin ingin keluar?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Ya, Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarWidth, x: isMobile && !sidebarOpen ? -sidebarWidth : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="border-r bg-card fixed inset-y-0 left-0 z-10 overflow-hidden flex flex-col"
        style={{ width: sidebarWidth }}
      >
        {/* Header */}
        <div
          className={cn(
            "h-16 px-4 border-b flex items-center shrink-0",
            !collapsed ? "justify-between" : "justify-center"
          )}
        >
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2 overflow-hidden">
                <img src="/assets/logo/gbb-logo-horizontal.png" alt="GBB Portal" className="h-8 w-auto" />
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              title="Expand sidebar"
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              <img src="/assets/logo/gbb-logo-mark.png" alt="GBB" className="h-8 w-8" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 overflow-y-auto py-3 space-y-1", !collapsed ? "px-3" : "px-2")}>
          {navItems.map((item) =>
            item.children ? (
              <NavGroup key={item.label} item={item} collapsed={collapsed} />
            ) : (
              <NavLeaf key={item.path} item={item} collapsed={collapsed} />
            )
          )}

          {settingsItems.length > 0 && (
            <>
              <div className="border-t border-border mx-1 my-3" />
              {settingsItems.map((item) => (
                <NavLeaf key={item.path} item={item} collapsed={collapsed} />
              ))}
            </>
          )}
        </nav>

        {!collapsed && <GlobalPeriodeFilter />}
      </motion.aside>

      {/* Main */}
      <motion.div
        animate={{ marginLeft: mainMarginLeft }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex-1 flex flex-col overflow-hidden"
        style={{ marginLeft: mainMarginLeft }}
      >
        {/* Header bar */}
        <header className="h-16 border-b bg-card shrink-0 flex items-center px-4 md:px-6 gap-3 md:gap-4">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm flex-1 min-w-0">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <span key={idx} className="flex items-center gap-1 min-w-0">
                  {idx > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  {isLast || !crumb.to ? (
                    <span
                      className={cn(
                        "truncate",
                        isLast ? "font-semibold text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.to}
                      className="text-muted-foreground hover:text-foreground transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          {/* Date & Time */}
          <div className="hidden md:flex items-center gap-4 text-muted-foreground shrink-0">
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden lg:inline whitespace-nowrap">{dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{timeStr}</span>
            </div>
          </div>

          <div className="h-5 w-px bg-border shrink-0 hidden md:block" />

          {/* Notifikasi (placeholder — modul Notifikasi belum dibangun) */}
          <button
            type="button"
            disabled
            title="Notifikasi (segera hadir)"
            className="p-2 rounded-lg text-muted-foreground opacity-60 cursor-not-allowed shrink-0"
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* Dark mode */}
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors shrink-0">
                <div className="rounded-full bg-accent flex items-center justify-center h-8 w-8 shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-medium truncate">{email ?? "User"}</span>
                  <span className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                    {role ?? "-"}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowChangePassword(true)}>
                <KeyRound className="h-4 w-4 mr-2" />
                Ganti Password
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowLogoutDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 animate-in fade-in duration-300">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </motion.div>

      {showChangePassword && (
        <ChangePasswordDialog onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}
