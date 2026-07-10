import { create } from "zustand";
import { persist } from "zustand/middleware";

// Filter periode global (dropdown di bagian bawah sidebar, sesuai wireframe).
// Dibaca semua modul yang menerima query param periode_id.
interface PeriodeFilterState {
  periodeId: string | null; // null = semua periode
  setPeriodeId: (id: string | null) => void;
}

export const usePeriodeFilter = create<PeriodeFilterState>()(
  persist(
    (set) => ({
      periodeId: null,
      setPeriodeId: (id) => set({ periodeId: id }),
    }),
    { name: "periode-filter-storage" }
  )
);
