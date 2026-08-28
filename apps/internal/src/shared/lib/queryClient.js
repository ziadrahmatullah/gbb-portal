import { MutationCache, QueryClient } from "@tanstack/react-query";

// Jaminan global: SETIAP mutation sukses (create/edit/delete di domain mana
// pun) → semua query di-invalidate; yang sedang tampil langsung refetch ke
// backend. Callback di level MutationCache selalu jalan walau komponen
// pemanggil (mis. dialog form) sudah unmount sebelum respons datang — beda
// dengan onSuccess di useMutation yang bisa ter-skip pada kondisi itu.
// Invalidasi per-hook di masing-masing domain tetap ada sebagai dokumentasi
// intent; dengan handler ini keduanya redundant tapi aman.
const mutationCache = new MutationCache({
  onSuccess: () => queryClient.invalidateQueries(),
});

export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
