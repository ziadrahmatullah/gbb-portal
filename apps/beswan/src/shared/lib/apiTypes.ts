// Mirror dari gbb-backend dto/response.go — semua field omitempty.
// Error response menaruh pesan di field `error`: string (middleware/apperror)
// atau string[] (error validasi binding).
export interface ApiEnvelope<T = unknown> {
  data?: T;
  error?: string | string[];
  message?: string;
  current_page?: number;
  current_item?: number;
  total_page?: number;
  total_item?: number;
}

// Ekstraksi pesan error dari envelope. Backend TIDAK konsisten (dikonfirmasi dari
// source): middleware auth (middleware/auth.go) menaruh string di `error`, sedangkan
// error validasi/lainnya (middleware/error_middleware.go) menaruh string[].
// Helper ini menangani keduanya; jangan disederhanakan sebelum backend distandardisasi.
export function getErrorMessage(data: ApiEnvelope | undefined, fallback: string): string {
  const rawError = Array.isArray(data?.error) ? data.error.join(", ") : data?.error;
  return rawError || data?.message || fallback;
}

export interface Paged<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}

export function toPaged<T>(env: ApiEnvelope<T[]>): Paged<T> {
  return {
    items: env.data ?? [],
    page: env.current_page ?? 1,
    totalPages: env.total_page ?? 1,
    totalItems: env.total_item ?? env.data?.length ?? 0,
  };
}

// Param standar list endpoint backend: page (default 1), limit (default 20), search,
// plus filter spesifik per resource (periode_id, status, dst).
export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
} & Record<string, string | number | boolean | undefined>;
