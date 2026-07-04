import { apiClient } from "@/shared/lib/apiClient";

export const districtService = {
  getAll: async (params = {}) => {
    const { page = 1, limit = 10, search } = params;
    const query = { page, limit };
    if (search) query.search = search;

    const res = await apiClient.get("/api/districts", query);
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
    const res = await apiClient.get(`/api/districts/${id}`);
    return { data: res.data };
  },

  create: (data) => apiClient.post("/api/districts", data),

  update: (id, data) => apiClient.put(`/api/districts/${id}`, data),

  remove: (id) => apiClient.delete(`/api/districts/${id}`),
};
