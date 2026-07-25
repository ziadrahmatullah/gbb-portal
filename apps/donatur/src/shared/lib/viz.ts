import { useUIStore } from "@/shared/store/useUIStore";

// Palet dataviz tervalidasi (light/dark) — konsisten dengan Portal Beswan/Internal
export const VIZ = {
  light: { series1: "#2a78d6", series2: "#1baf7a", grid: "#e4e4ec", text: "#52514e", surface: "#ffffff" },
  dark: { series1: "#3987e5", series2: "#199e70", grid: "#33363a", text: "#c3c2b7", surface: "#1a1c1e" },
};

export function useVizColors() {
  const isDark = useUIStore((s: { isDark: boolean }) => s.isDark);
  return isDark ? VIZ.dark : VIZ.light;
}
