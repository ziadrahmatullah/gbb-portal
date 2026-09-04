import { MutationCache, QueryClient } from "@tanstack/react-query";

// Jaminan global: SETIAP mutation sukses (create/edit/delete di domain mana
// pun) → semua query di-invalidate; yang sedang tampil langsung refetch ke
// backend. Callback di level MutationCache selalu jalan walau komponen
// pemanggil (mis. dialog form) sudah unmount sebelum respons datang.
//
// Pengecualian: mutation yang mendeklarasikan `meta: { invalidates: "self" }`
// dilepas dari jaminan ini dan bertanggung jawab meng-invalidate key domainnya
// sendiri lewat onSuccess di useMutation (yang juga selalu jalan walau
// komponen unmount — berbeda dari callback di pemanggilan mutate()).
// Dipakai untuk mutation kecil-beruntun (toggle periode/tag donatur) yang kalau
// ikut invalidate-all akan me-refetch dashboard, monitoring, dan semua list
// yang kebetulan masih hidup di cache — itu sumber "Simpan Perubahan lambat".
const mutationCache = new MutationCache({
  onSuccess: (_data, _vars, _ctx, mutation) => {
    if (mutation.meta?.invalidates === "self") return;
    queryClient.invalidateQueries();
  },
});

export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      // 0 = data langsung dianggap basi: setiap halaman/menu dibuka (mount),
      // list & detail di-refetch ke backend. Cache lama tetap ditampilkan
      // dulu lalu diganti diam-diam (stale-while-revalidate), jadi tidak
      // flicker/loading ulang.
      staleTime: 0,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
