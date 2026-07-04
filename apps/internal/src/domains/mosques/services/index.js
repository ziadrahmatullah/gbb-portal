import { apiClient } from "@/shared/lib/apiClient";

export const mosqueService = {
  getAll: async (params = {}) => {
    const { page = 1, limit = 10, search, district_id } = params;
    const query = { page, limit };
    if (search) query.search = search;
    if (district_id) query.district_id = district_id;

    const res = await apiClient.get("/api/mosques", query);
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

  getAllForDropdown: async () => {
    const res = await apiClient.get("/api/mosques", { limit: 100 });
    return res.data ?? [];
  },

  getById: async (id) => {
    const res = await apiClient.get(`/api/mosques/${id}`);
    return { data: res.data };
  },

  create: (data) => apiClient.post("/api/mosques", data),

  update: (id, data) => apiClient.put(`/api/mosques/${id}`, data),

  remove: (id) => apiClient.delete(`/api/mosques/${id}`),
};
