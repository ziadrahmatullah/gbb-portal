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

// Sebagian endpoint mengirim payload BERSAMA error, bukan cuma pesan — pola
// { error: "...", data: { ... } }. Error bawaan JS cuma membawa string, jadi
// status + envelope.data ditempelkan di sini supaya caller yang butuh bisa
// membacanya. Caller lain tetap memperlakukannya sebagai Error biasa.
// Bentuknya sengaja identik dengan apps/internal.
export class ApiError extends Error {
  readonly status?: number;
  readonly data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
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
