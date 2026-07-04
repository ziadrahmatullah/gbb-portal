import { apiClient } from "@/shared/lib/apiClient";

export const categoryService = {
  getAll: async (params = {}) => {
    const { page = 1, limit = 10, search } = params;
    const query = { page, limit };
    if (search) query.search = search;

    const res = await apiClient.get("/api/categories", query);
    // Backend response: { data: [...], message: "success", meta: { current_page, current_item, total_page, total_item } }
    return {
      items: res.data ?? [],
      pagination: {
        current_page: res.meta?.current_page ?? 1,
        total_page: res.meta?.total_page ?? 1,
        total_item: res.meta?.total_item ?? 0,
        current_item: res.meta?.current_item ?? 0,
      },
    };
  },

  getById: async (id) => {
    const res = await apiClient.get(`/api/categories/${id}`);
    return { data: res.data };
  },

  create: (data) => apiClient.post("/api/categories", data),

  update: (id, data) => apiClient.put(`/api/categories/${id}`, data),

  remove: (id) => apiClient.delete(`/api/categories/${id}`),
};
