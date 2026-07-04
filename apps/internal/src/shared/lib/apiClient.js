import axios from "axios";
import { toast } from "sonner";

// Base URL from env or default to localhost:6017
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:6017";

// Flag to prevent multiple 401 redirects
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Request interceptor - attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData/URLSearchParams (browser sets it with boundary)
    if (config.data instanceof FormData || config.data instanceof URLSearchParams) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Logout & redirect on 401 (no refresh token support for now)
      processQueue(new Error("Session expired"));
      logout();
      isRefreshing = false;

      window.location.href = "/";
      return Promise.reject(new Error("Session expired. Please login again."));
    }

    // Handle 403 Forbidden - permission denied
    if (error.response?.status === 403) {
      logout();
      window.location.href = "/";
      return Promise.reject(new Error("Permission denied. Please login again."));
    }

    // Handle other errors
    const data = error.response?.data;
    const msg = data?.message || data?.error || error.message;

    // Show toast for non-401/403 errors
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      toast.error(msg);
    }

    return Promise.reject(new Error(msg));
  }
);

// Token helpers
const TOKEN_KEY = "auth_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  // Also clear any other auth-related data
  localStorage.removeItem("auth-storage");
}

// API client methods
function makeClient(instance) {
  return {
    get: (path, params) => instance.get(path, { params }),
    getBlob: (path, params) => instance.get(path, { params, responseType: "blob" }),
    post: (path, body) => instance.post(path, body),
    put: (path, body) => instance.put(path, body),
    patch: (path, body) => instance.patch(path, body),
    delete: (path) => instance.delete(path),
  };
}

export const apiClient = makeClient(axiosInstance);
export { getToken, setToken, logout };
export { API_BASE_URL };
