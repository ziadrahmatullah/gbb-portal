import { useQuery } from "@tanstack/react-query";
import { GATING_ENABLED, getDonaturStatus } from "@/shared/lib/donaturStatus";
import type { DonaturStatus } from "@/shared/lib/donaturStatus";

export const STATUS_KEY = "donatur-status";

export interface DonaturStatusView {
  // Sedang memuat pertama kali (cache kosong) — render skeleton, bukan gembok
  isPending: boolean;
  // true = donatur belum aktif bulan ini DAN gating menyala DAN status berhasil
  // dimuat. Error/500 di endpoint ini = FAIL OPEN (locked false): endpoint
  // penentu menu tidak boleh mengunci donatur yang membayar.
  locked: boolean;
  status: DonaturStatus | undefined;
  refetch: () => void;
}

// Satu sumber kebenaran status donatur untuk sidebar, guard rute, dan CTA di
// Beranda. staleTime pendek + refetch saat tab difokuskan = donatur yang baru
// direkonsiliasi AnC terbuka menunya tanpa logout.
export function useDonaturStatus(): DonaturStatusView {
  const query = useQuery({
    queryKey: [STATUS_KEY],
    queryFn: getDonaturStatus,
    enabled: GATING_ENABLED,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  if (!GATING_ENABLED) {
    return { isPending: false, locked: false, status: undefined, refetch: () => {} };
  }

  const status = query.data;
  return {
    isPending: query.isPending,
    locked: query.isSuccess && !!status && !status.is_aktif_bulan_ini,
    status,
    refetch: () => void query.refetch(),
  };
}
