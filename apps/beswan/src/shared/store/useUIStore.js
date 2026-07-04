import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUIStore = create(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      isDark: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleDark: () => {
        const next = !get().isDark;
        set({ isDark: next });
        document.documentElement.classList.toggle("dark", next);
      },
      initTheme: () => {
        document.documentElement.classList.toggle("dark", get().isDark);
      },
    }),
    { name: "beswan-ui-storage" }
  )
);
