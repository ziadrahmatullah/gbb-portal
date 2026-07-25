import axios from "axios";
import type { AxiosError, AxiosInstance } from "axios";
import { toast } from "sonner";
import { getErrorMessage } from "./apiTypes";
import type { ApiEnvelope } from "./apiTypes";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:6099";

// Kunci BERBEDA dari Portal Internal & Portal Beswan — token/portal JWT terpisah
// (Auth("donatur")), supaya login di 3 portal pada browser yang sama tidak saling menimpa.
const TOKEN_KEY = "donatur_auth_token";
const AUTH_STORAGE_KEY = "donatur-auth-storage";

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
  if (config.data instanceof FormData || config.data instanceof URLSearchParams) {
    delete config.headers["Content-Type"];
  }
  return config;
});

let redirectingToLogin = false;

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<ApiEnvelope>) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const msg = getErrorMessage(data, error.message);

    // Error dari /auth/* (mis. email tidak terdaftar sebagai donatur) ditampilkan
    // inline oleh LoginPage — jangan toast, jangan logout, jangan redirect.
    const isAuthRequest = Boolean(error.config?.url?.startsWith("/auth/"));

    if (!isAuthRequest && status === 401) {
      logout();
      if (!redirectingToLogin) {
        redirectingToLogin = true;
        window.location.href = "/";
      }
      return Promise.reject(new Error("Sesi berakhir. Silakan login kembali."));
    }

    if (!isAuthRequest && status === 403) {
      toast.error("Tidak memiliki akses");
      return Promise.reject(new ApiError(msg, status));
    }

    if (!isAuthRequest) {
      toast.error(msg);
    }
    return Promise.reject(new ApiError(msg, status));
  }
);

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
