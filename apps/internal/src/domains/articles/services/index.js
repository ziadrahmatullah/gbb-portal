import { apiClient } from "@/shared/lib/apiClient";

export const articleService = {
  getAll: async (params = {}) => {
    const { page = 1, limit = 10, search, status, is_highlight } = params;
    const queryParams = { page, limit };
    if (search) queryParams.search = search;
    if (status) queryParams.status = status;
    if (is_highlight !== undefined && is_highlight !== "") queryParams.is_highlight = is_highlight;

    const res = await apiClient.get("/api/articles", queryParams);
    return { items: res.data ?? [], pagination: { ...res.meta } };
  },

  getById: async (id) => {
    const res = await apiClient.get(`/api/articles/${id}`);
    return { data: res.data };
  },

  // Create new article with FormData (multipart)
  create: async (data) => {
    // data is FormData - apiClient will handle Content-Type automatically
    const res = await apiClient.post("/api/articles", data);
    return res.data;
  },

  // Update article with JSON (not FormData)
  update: async (id, data) => {
    const res = await apiClient.put(`/api/articles/${id}`, data);
    return res.data;
  },

  setHighlight: async (id, is_highlight) => {
    const res = await apiClient.patch(`/api/articles/${id}/highlight`, { is_highlight });
    return res.data;
  },

  remove: async (id) => {
    const res = await apiClient.delete(`/api/articles/${id}`);
    return res.data;
  },
};

// Helper to generate slug from title
export function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}
