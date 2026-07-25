import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  ChevronDown,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  Sun,
  User,
  X,
} from "lucide-react";
import {
  cn,
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
} from "@gbb/ui";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { useUIStore } from "@/shared/store/useUIStore";
import { useMyDashboard } from "@/domains/beranda/hooks/useBeranda";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";

const NAV_ITEMS = [
  { label: "Beranda", path: "/panel", icon: Home, end: true },
  { label: "Library", path: "/panel/library", icon: BookOpen },
  { label: "Mentor", path: "/panel/mentor", icon: GraduationCap },
  { label: "Refleksi", path: "/panel/refleksi", icon: NotebookPen },
  { label: "Profile", path: "/panel/profile", icon: User },
];

export function AppLayout() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const { isDark, toggleDark, initTheme } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Info Batch/Status di sidebar (wireframe) — share cache dgn Beranda
  const { data: dashboard } = useMyDashboard();
  const periodes = dashboard?.periodes ?? [];
  const currentPeriode =
    periodes.find((p) => p.status === "aktif") ?? periodes[periodes.length - 1];

  useEffect(() => {
    initTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="h-16 px-4 border-b flex items-center shrink-0">
        <img src="/assets/logo/gbb-logo-horizontal.png" alt="GBB Beswan Portal" className="h-8 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }: { isActive: boolean }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent",
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Batch & status (wireframe: bagian bawah sidebar) */}
      <div className="border-t p-4 shrink-0 text-sm space-y-0.5">
        <div className="text-xs font-semibold text-muted-foreground tracking-wider mb-1">
          Batch
        </div>
        {currentPeriode ? (
          <>
            <div className="font-medium">{currentPeriode.periode_nama}</div>
            <div
              className={cn(
                "text-xs capitalize",
                currentPeriode.status === "aktif" ? "text-primary" : "text-muted-foreground"
              )}
            >
              Status: {currentPeriode.status}
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">Belum terdaftar periode</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-background flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 shrink-0 border-r bg-card flex-col">{sidebar}</aside>

      {/* Sidebar mobile (off-canvas) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r bg-card flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-4 p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b bg-card shrink-0 flex items-center px-4 md:px-6 gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold flex-1 truncate">GBB Beswan Portal</h1>

          {/* Notifikasi placeholder — panel notifikasi ada di Beranda */}
          <button
            type="button"
            disabled
            title="Notifikasi ada di Beranda"
            className="p-2 rounded-lg text-muted-foreground opacity-60 cursor-not-allowed shrink-0"
          >
            <Bell className="h-4 w-4" />
          </button>

          <button
            onClick={toggleDark}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

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
                  <span className="text-sm font-medium truncate">
                    {profile?.nama_lengkap ?? "Beswan"}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground font-mono">
                    {profile?.nim ?? "-"}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

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
    </div>
  );
}
