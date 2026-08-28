import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  Search,
  Clock,
  ChevronRight,
  Menu,
  Tag,
  MapPin,
  Package,
  Building,
  Wallet,
  Calendar,
  Image as ImageIcon,
  FileText,
  Settings,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/domains/auth";
import { useUIStore } from "@/shared/store/useUIStore";
import { CommandPalette } from "./CommandPalette";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";

const sideNavData = [
  {
    type: "main",
    items: [
      { to: "/panel", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    type: "section",
    sectionLabel: "Data Master",
    items: [
      { to: "/panel/master/categories", icon: Tag, label: "Categories" },
      { to: "/panel/master/districts", icon: MapPin, label: "Districts" },
      { to: "/panel/master/mosques", icon: Building, label: "Mosques" },
      { to: "/panel/master/animal-types", icon: Package, label: "Animal Types" },
    ],
  },
  {
    type: "section",
    sectionLabel: "Qurban",
    items: [
      { to: "/panel/qurbans", icon: Package, label: "Data Qurban" },
    ],
  },
  {
    type: "section",
    sectionLabel: "Transaksi",
    items: [
      { to: "/panel/transactions", icon: Wallet, label: "Data Transaksi" },
    ],
  },
  {
    type: "section",
    sectionLabel: "Konten",
    items: [
      { to: "/panel/events", icon: Calendar, label: "Events" },
      { to: "/panel/galleries", icon: ImageIcon, label: "Galleries" },
      { to: "/panel/articles", icon: FileText, label: "Articles" },
    ],
  },
  {
    type: "section",
    sectionLabel: "System",
    items: [
      { to: "/panel/activity-logs", icon: ClipboardList, label: "Activity Log" },
      { to: "/panel/settings/change-password", icon: Settings, label: "Ganti Password" },
    ],
  },
];

// Helper function to check if pathname matches pattern like "/panel/resource/:id/edit"
function isEditPath(pathname, resourcePath) {
  const parts = pathname.split("/");
  return parts.length >= 5 &&
         parts[0] === "" &&
         parts[1] === "panel" &&
         parts[2] === resourcePath &&
         parts[4] === "edit";
}

// Helper function to check if pathname matches pattern like "/panel/resource/:id"
function isDetailPath(pathname, resourcePath) {
  const parts = pathname.split("/");
  return parts.length === 4 &&
         parts[0] === "" &&
         parts[1] === "panel" &&
         parts[2] === resourcePath &&
         parts[3] !== "new" &&
         parts[3] !== "edit";
}

function getBreadcrumbs(pathname) {
  if (pathname === "/panel") return [{ label: "Dashboard" }];

  // Master Data - Categories
  if (pathname === "/panel/master/categories") return [{ label: "Data Master" }, { label: "Categories" }];
  if (pathname === "/panel/master/categories/new")
    return [{ label: "Data Master" }, { label: "Categories", to: "/panel/master/categories" }, { label: "New Category" }];
  if (isEditPath(pathname, "master/categories"))
    return [{ label: "Data Master" }, { label: "Categories", to: "/panel/master/categories" }, { label: "Edit Category" }];
  if (isDetailPath(pathname, "master/categories"))
    return [{ label: "Data Master" }, { label: "Categories", to: "/panel/master/categories" }, { label: "Detail" }];

  // Master Data - Districts
  if (pathname === "/panel/master/districts") return [{ label: "Data Master" }, { label: "Districts" }];
  if (pathname === "/panel/master/districts/new")
    return [{ label: "Data Master" }, { label: "Districts", to: "/panel/master/districts" }, { label: "New District" }];
  if (isEditPath(pathname, "master/districts"))
    return [{ label: "Data Master" }, { label: "Districts", to: "/panel/master/districts" }, { label: "Edit District" }];
  if (isDetailPath(pathname, "master/districts"))
    return [{ label: "Data Master" }, { label: "Districts", to: "/panel/master/districts" }, { label: "Detail" }];

  // Master Data - Mosques
  if (pathname === "/panel/master/mosques") return [{ label: "Data Master" }, { label: "Mosques" }];
  if (pathname === "/panel/master/mosques/new")
    return [{ label: "Data Master" }, { label: "Mosques", to: "/panel/master/mosques" }, { label: "New Mosque" }];
  if (isEditPath(pathname, "master/mosques"))
    return [{ label: "Data Master" }, { label: "Mosques", to: "/panel/master/mosques" }, { label: "Edit Mosque" }];
  if (isDetailPath(pathname, "master/mosques"))
    return [{ label: "Data Master" }, { label: "Mosques", to: "/panel/master/mosques" }, { label: "Detail" }];

  // Master Data - Animal Types
  if (pathname === "/panel/master/animal-types") return [{ label: "Data Master" }, { label: "Animal Types" }];
  if (pathname === "/panel/master/animal-types/new")
    return [{ label: "Data Master" }, { label: "Animal Types", to: "/panel/master/animal-types" }, { label: "New Animal Type" }];
  if (isEditPath(pathname, "master/animal-types"))
    return [{ label: "Data Master" }, { label: "Animal Types", to: "/panel/master/animal-types" }, { label: "Edit Animal Type" }];
  if (isDetailPath(pathname, "master/animal-types"))
    return [{ label: "Data Master" }, { label: "Animal Types", to: "/panel/master/animal-types" }, { label: "Detail" }];

  // Qurbans
  if (pathname === "/panel/qurbans") return [{ label: "Qurban" }, { label: "Data Qurban" }];
if (pathname === "/panel/qurbans/new")
    return [{ label: "Qurban" }, { label: "Data Qurban", to: "/panel/qurbans" }, { label: "New Qurban" }];
  if (isEditPath(pathname, "qurbans"))
    return [{ label: "Qurban" }, { label: "Data Qurban", to: "/panel/qurbans" }, { label: "Edit Qurban" }];
  if (isDetailPath(pathname, "qurbans"))
    return [{ label: "Qurban" }, { label: "Data Qurban", to: "/panel/qurbans" }, { label: "Detail" }];

  // Transactions
  if (pathname === "/panel/transactions") return [{ label: "Transaksi" }, { label: "Data Transaksi" }];
  if (pathname === "/panel/transactions/new")
    return [{ label: "Transaksi" }, { label: "Data Transaksi", to: "/panel/transactions" }, { label: "New Transaction" }];
  if (isEditPath(pathname, "transactions"))
    return [{ label: "Transaksi" }, { label: "Data Transaksi", to: "/panel/transactions" }, { label: "Edit Transaction" }];
  if (isDetailPath(pathname, "transactions"))
    return [{ label: "Transaksi" }, { label: "Data Transaksi", to: "/panel/transactions" }, { label: "Detail" }];

  // Events
  if (pathname === "/panel/events") return [{ label: "Konten" }, { label: "Events" }];
  if (pathname === "/panel/events/new")
    return [{ label: "Konten" }, { label: "Events", to: "/panel/events" }, { label: "New Event" }];
  if (isEditPath(pathname, "events"))
    return [{ label: "Konten" }, { label: "Events", to: "/panel/events" }, { label: "Edit Event" }];
  if (isDetailPath(pathname, "events"))
    return [{ label: "Konten" }, { label: "Events", to: "/panel/events" }, { label: "Detail" }];

  // Galleries
  if (pathname === "/panel/galleries") return [{ label: "Konten" }, { label: "Galleries" }];
  if (pathname === "/panel/galleries/new")
    return [{ label: "Konten" }, { label: "Galleries", to: "/panel/galleries" }, { label: "Add Photo" }];
  if (isEditPath(pathname, "galleries"))
    return [{ label: "Konten" }, { label: "Galleries", to: "/panel/galleries" }, { label: "Edit Photo" }];
  if (isDetailPath(pathname, "galleries"))
    return [{ label: "Konten" }, { label: "Galleries", to: "/panel/galleries" }, { label: "Detail" }];

  // Articles
  if (pathname === "/panel/articles") return [{ label: "Konten" }, { label: "Articles" }];
  if (pathname === "/panel/articles/new")
    return [{ label: "Konten" }, { label: "Articles", to: "/panel/articles" }, { label: "New Article" }];
  if (isEditPath(pathname, "articles"))
    return [{ label: "Konten" }, { label: "Articles", to: "/panel/articles" }, { label: "Edit Article" }];
  if (isDetailPath(pathname, "articles"))
    return [{ label: "Konten" }, { label: "Articles", to: "/panel/articles" }, { label: "Detail" }];

  // Activity Log
  if (pathname === "/panel/activity-logs") return [{ label: "System" }, { label: "Activity Log" }];

  // Settings
  if (pathname === "/panel/settings/change-password") return [{ label: "Settings" }, { label: "Ganti Password" }];

  return [{ label: "Dashboard" }];
}

function openCommandPalette() {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
}

function NavItem({ item, isActive, collapsed }) {
  return (
    <Link
      to={item.to}
      title={item.label}
      className={cn(
        "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent",
        collapsed ? "p-2 justify-center" : "px-3 py-2",
        isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [now, setNow] = useState(new Date());
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const { sidebarOpen, isDark, toggleSidebar, toggleDark, initTheme } = useUIStore();

  useEffect(() => {
    initTheme();
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

  useEffect(() => {
    if (isMobile && sidebarOpen) toggleSidebar();
  }, []);

  const closeSidebarOnMobile = useCallback(() => {
    if (isMobile && sidebarOpen) toggleSidebar();
  }, [isMobile, sidebarOpen, toggleSidebar]);

  useEffect(() => {
    closeSidebarOnMobile();
  }, [location.pathname, closeSidebarOnMobile]);

  const sidebarWidth = isMobile ? 256 : sidebarOpen ? 256 : 64;
  const mainMarginLeft = isMobile ? 0 : sidebarOpen ? 256 : 64;

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const userInitials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "US";

  const breadcrumbs = getBreadcrumbs(location.pathname);

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
      <CommandPalette />

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

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarWidth, x: isMobile && !sidebarOpen ? -sidebarWidth : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="border-r bg-card fixed inset-y-0 left-0 z-10 overflow-hidden flex flex-col"
        style={{ width: sidebarWidth }}
      >
        {/* Header */}
        <div
          className={cn("h-16 px-4 border-b flex items-center shrink-0", sidebarOpen ? "justify-between" : "justify-center")}
        >
          {sidebarOpen ? (
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
        <nav className={cn("flex-1 overflow-y-auto py-3", sidebarOpen ? "px-3 space-y-1" : "px-2 space-y-1")}>
          {sideNavData.map((section) => {
            if (section.type === "main") {
              return section.items.map((item) => {
                const isActive = location.pathname === item.to || (item.to !== "/panel" && location.pathname.startsWith(item.to));
                return <NavItem key={item.to} item={item} isActive={isActive} collapsed={!sidebarOpen} />;
              });
            }

            if (section.type === "section") {
              return (
                <div className={cn("mt-4", !sidebarOpen && "mt-3")} key={section.sectionLabel}>
                  {sidebarOpen ? (
                    <div className="text-xs font-semibold px-2 mb-2 text-muted-foreground tracking-wider">
                      {section.sectionLabel}
                    </div>
                  ) : (
                    <div className="border-t border-border mx-1 mb-2" />
                  )}
                  {section.items.map((item) => {
                    const isActive =
                      location.pathname === item.to || (item.to !== "/panel" && location.pathname.startsWith(item.to));
                    return <NavItem key={item.to} item={item} isActive={isActive} collapsed={!sidebarOpen} />;
                  })}
                </div>
              );
            }

            return null;
          })}
        </nav>

        {/* User */}
        <div className={cn("border-t p-3 shrink-0", !sidebarOpen && "flex justify-center")}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="rounded-full bg-accent flex items-center justify-center h-9 w-9 text-xs font-bold uppercase select-none shrink-0">
                {userInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm truncate">{user?.full_name || "User"}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email || ""}</span>
              </div>
            </div>
          ) : (
            <div
              className="rounded-full bg-accent flex items-center justify-center h-9 w-9 text-xs font-bold uppercase select-none"
              title={user?.full_name}
            >
              {userInitials}
            </div>
          )}
        </div>
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
                  {isLast ? (
                    <span className="font-semibold text-foreground truncate">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.to} className="text-muted-foreground hover:text-foreground transition-colors truncate">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          {/* Date & Time */}
          <div className="flex items-center gap-4 text-muted-foreground shrink-0">
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden lg:inline whitespace-nowrap">{dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{timeStr}</span>
            </div>
          </div>

          <div className="h-5 w-px bg-border shrink-0" />

          {/* Search */}
          <button
            onClick={openCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/50 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-flex font-mono text-[10px] bg-background border rounded px-1">⌘K</kbd>
          </button>

          {/* Dark mode */}
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 animate-in fade-in duration-300">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}
