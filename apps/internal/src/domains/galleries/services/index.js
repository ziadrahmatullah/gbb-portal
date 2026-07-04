import { apiClient } from "@/shared/lib/apiClient";

export const galleryService = {
  getAll: async (params = {}) => {
    const { page = 1, limit = 10, search, event_id } = params;
    const query = { page, limit };
    if (search) query.search = search;
    if (event_id) query.event_id = event_id;

    const res = await apiClient.get("/api/galleries", query);
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
    const res = await apiClient.get(`/api/galleries/${id}`);
    return { data: res.data };
  },

  create: async (data) => {
    const res = await apiClient.post("/api/galleries", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await apiClient.put(`/api/galleries/${id}`, data);
    return res.data;
  },

  remove: async (id) => {
    const res = await apiClient.delete(`/api/galleries/${id}`);
    return res.data;
  },
};
