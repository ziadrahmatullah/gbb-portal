import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, GraduationCap, LayoutDashboard, Users, FileText, LogOut, Moon, Sun, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/domains/auth/store/useAuthStore";
import { useUIStore } from "@/shared/store/useUIStore";

const navItems = [
  { to: "/beranda", icon: Home, label: "Beranda" },
  { to: "/daftar-mentor", icon: GraduationCap, label: "Daftar Mentor!" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/data-beswan", icon: Users, label: "Data Beswan" },
  { to: "/laporan", icon: FileText, label: "Laporan" },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { isDark, toggleDark, initTheme } = useUIStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initTheme();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 w-64 border-r bg-card flex flex-col transition-transform md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 px-4 border-b flex items-center gap-2">
          <img src="/assets/logo/gbb-logo-horizontal.png" alt="GBB Donatur Portal" className="h-8 w-auto" />
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="rounded-full bg-accent flex items-center justify-center h-9 w-9 text-xs font-bold uppercase shrink-0">
              {user?.nama ? user.nama.slice(0, 2) : "DN"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm truncate">{user?.nama || "Donatur"}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email || ""}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-64">
        <header className="h-16 border-b bg-card shrink-0 flex items-center px-4 md:px-6 gap-3 justify-between">
          <button onClick={() => setSidebarOpen((v) => !v)} className="md:hidden p-2 rounded-lg hover:bg-accent">
            <Menu className="h-5 w-5" />
          </button>
          <div />
          <div className="flex items-center gap-2">
            <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
