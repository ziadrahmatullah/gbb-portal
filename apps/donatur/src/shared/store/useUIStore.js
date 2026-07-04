import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUIStore = create(
  persist(
    (set, get) => ({
      isDark: false,
      toggleDark: () => {
        const next = !get().isDark;
        set({ isDark: next });
        document.documentElement.classList.toggle("dark", next);
      },
      initTheme: () => {
        document.documentElement.classList.toggle("dark", get().isDark);
      },
    }),
    { name: "donatur-ui-storage" }
  )
);
