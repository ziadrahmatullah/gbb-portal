import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 0 = data langsung dianggap basi: setiap halaman/menu dibuka (mount),
      // list & detail di-refetch ke backend. Cache lama tetap ditampilkan
      // dulu lalu diganti diam-diam (stale-while-revalidate).
      staleTime: 0,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
