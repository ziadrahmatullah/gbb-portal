import { apiClient } from "@/shared/lib/apiClient";

export const eventService = {
  // Get events list with filters
  getAll: async (params = {}) => {
    const { page = 1, limit = 10, search, order_by } = params;
    const queryParams = { page, limit };
    if (search) queryParams.search = search;
    if (order_by) queryParams.order_by = order_by;

    const res = await apiClient.get("/api/events", queryParams);
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

  // Get single event by id
  getById: async (id) => {
    const res = await apiClient.get(`/api/events/${id}`);
    return res;
  },

  // Create new event
  create: async (data) => {
    const res = await apiClient.post("/api/events", data);
    return res.data;
  },

  // Update event
  update: async (id, data) => {
    const res = await apiClient.put(`/api/events/${id}`, data);
    return res.data;
  },

  // Delete event
  remove: async (id) => {
    const res = await apiClient.delete(`/api/events/${id}`);
    return res.data;
  },

  // Get events for dropdown (for galleries)
  getAllForDropdown: async () => {
    const res = await apiClient.get("/api/events", { page: 1, limit: 100 });
    return res.data ?? [];
  },
};
