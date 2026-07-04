import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, PlusCircle, CalendarDays, Mic2, Newspaper, Sun, Moon, Images, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/shared/store/useUIStore";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, section: "Main" },
  { to: "/participants", label: "Participants", icon: Users, section: "Main" },
  { to: "/participants/new", label: "Add Participant", icon: PlusCircle, section: "Main" },
  { to: "/microsite/agenda", label: "Agenda", icon: CalendarDays, section: "Microsite" },
  { to: "/microsite/agenda/new", label: "Add Session", icon: PlusCircle, section: "Microsite" },
  { to: "/microsite/speakers", label: "Speakers", icon: Mic2, section: "Microsite" },
  { to: "/microsite/articles", label: "Articles", icon: Newspaper, section: "Microsite" },
  { to: "/microsite/zoom", label: "Zoom Links", icon: Video, section: "Microsite" },
  { to: "/microsite/gallery", label: "Gallery", icon: Images, section: "Microsite" },
  { to: "/microsite/speakers/new", label: "Add Speaker", icon: PlusCircle, section: "Microsite" },
  { to: "/microsite/articles/new", label: "New Article", icon: PlusCircle, section: "Microsite" },
  { to: "/microsite/gallery/new", label: "Add Photos", icon: PlusCircle, section: "Microsite" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const navigate = useNavigate();
  const { isDark, toggleDark } = useUIStore();

  const allItems = useMemo(
    () => [
      ...navItems,
      {
        id: "light-mode",
        label: "Light Mode",
        icon: Sun,
        section: "Theme",
        action: () => {
          if (isDark) toggleDark();
        },
      },
      {
        id: "dark-mode",
        label: "Dark Mode",
        icon: Moon,
        section: "Theme",
        action: () => {
          if (!isDark) toggleDark();
        },
      },
    ],
    [isDark, toggleDark]
  );

  const filtered = allItems.filter(
    (r) => r.label.toLowerCase().includes(query.toLowerCase()) || r.section.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = useCallback(
    (item) => {
      if (item.action) {
        item.action();
      } else {
        navigate(item.to);
      }
      setOpen(false);
      setQuery("");
    },
    [navigate]
  );

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIdx(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (filtered[selectedIdx]) handleSelect(filtered[selectedIdx]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-md z-50 bg-popover border rounded-xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              <svg
                className="h-4 w-4 text-muted-foreground shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages..."
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">No pages found.</div>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon;
                  const isActiveTheme = (item.id === "light-mode" && !isDark) || (item.id === "dark-mode" && isDark);
                  return (
                    <button
                      key={item.to ?? item.id}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                        idx === selectedIdx ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50"
                      )}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      onClick={() => handleSelect(item)}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1">{item.label}</span>
                      {isActiveTheme && (
                        <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
                          Active
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{item.section}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2 border-t flex items-center gap-4 text-xs text-muted-foreground bg-muted/30">
              <span className="flex items-center gap-1">
                <kbd className="font-mono rounded border bg-background px-1">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="font-mono rounded border bg-background px-1">↵</kbd> select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="font-mono rounded border bg-background px-1">esc</kbd> close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
