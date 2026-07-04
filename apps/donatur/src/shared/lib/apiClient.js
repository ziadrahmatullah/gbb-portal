import axios from "axios";
import { toast } from "sonner";

// Base URL from env or default to localhost:6017
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:6017";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      logout();
      window.location.href = "/";
      return Promise.reject(new Error("Sesi berakhir. Silakan login kembali."));
    }

    const data = error.response?.data;
    const msg = data?.message || data?.error || error.message;
    toast.error(msg);
    return Promise.reject(new Error(msg));
  }
);

// Token helpers
const TOKEN_KEY = "donatur_auth_token";

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
  localStorage.removeItem("donatur-auth-storage");
}

function makeClient(instance) {
  return {
    get: (path, params) => instance.get(path, { params }),
    post: (path, body) => instance.post(path, body),
    put: (path, body) => instance.put(path, body),
    patch: (path, body) => instance.patch(path, body),
    delete: (path) => instance.delete(path),
  };
}

export const apiClient = makeClient(axiosInstance);
export { getToken, setToken, logout };
export { API_BASE_URL };
