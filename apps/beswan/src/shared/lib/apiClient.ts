import axios from "axios";
import type { AxiosError, AxiosInstance } from "axios";
import { toast } from "sonner";
import { ApiError, getErrorMessage } from "./apiTypes";
import type { ApiEnvelope } from "./apiTypes";

// Sebelumnya ApiError dideklarasikan di file ini — tetap diekspor ulang
// supaya jalur import lama tidak putus
export { ApiError };

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:6099";

// Error ber-status untuk caller yang perlu membedakan kode HTTP
// Kunci BERBEDA dari Portal Internal — token/portal JWT terpisah (Auth("beswan")),
// supaya login di kedua portal pada browser yang sama tidak saling menimpa.
const TOKEN_KEY = "beswan_auth_token";
const AUTH_STORAGE_KEY = "beswan-auth-storage";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Browser harus set Content-Type + boundary sendiri untuk FormData/URLSearchParams
  if (config.data instanceof FormData || config.data instanceof URLSearchParams) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// Mencegah redirect ganda saat beberapa request 401 bersamaan
let redirectingToLogin = false;

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<ApiEnvelope>) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const msg = getErrorMessage(data, error.message);

    // Error dari /auth/* (mis. password salah = 401) ditampilkan inline oleh
    // LoginPage — jangan toast, jangan logout, jangan redirect.
    const isAuthRequest = Boolean(error.config?.url?.startsWith("/auth/"));

    if (!isAuthRequest && status === 401) {
      // Token invalid/kedaluwarsa → sesi berakhir
      logout();
      if (!redirectingToLogin) {
        redirectingToLogin = true;
        window.location.href = "/";
      }
      return Promise.reject(new ApiError("Sesi berakhir. Silakan login kembali.", status));
    }

    if (!isAuthRequest && status === 403) {
      // Portal mismatch / kepemilikan ditolak — jangan paksa logout
      toast.error("Tidak memiliki akses");
      return Promise.reject(new ApiError(msg, status, data?.data));
    }

    if (!isAuthRequest) {
      toast.error(msg);
    }
    return Promise.reject(new ApiError(msg, status, data?.data));
  }
);

// Token helpers
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

type Params = Record<string, unknown>;

// Interceptor sudah meng-unwrap response.data, jadi return type method = envelope
function makeClient(instance: AxiosInstance) {
  return {
    get: <T = unknown>(path: string, params?: Params) =>
      instance.get<T, ApiEnvelope<T>>(path, { params }),
    getBlob: (path: string, params?: Params) =>
      instance.get<Blob, Blob>(path, { params, responseType: "blob" }),
    post: <T = unknown>(path: string, body?: unknown) =>
      instance.post<T, ApiEnvelope<T>>(path, body),
    put: <T = unknown>(path: string, body?: unknown) =>
      instance.put<T, ApiEnvelope<T>>(path, body),
    patch: <T = unknown>(path: string, body?: unknown) =>
      instance.patch<T, ApiEnvelope<T>>(path, body),
    delete: <T = unknown>(path: string) => instance.delete<T, ApiEnvelope<T>>(path),
  };
}

export const apiClient = makeClient(axiosInstance);
