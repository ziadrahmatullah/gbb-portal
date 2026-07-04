import { apiClient } from "@/shared/lib/apiClient";

export const qurbanService = {
  getAll: async (params = {}) => {
    const { page = 1, limit = 10, search, mosque_id, district_id, animal_type_id, start_date, end_date } = params;
    const query = { page, limit };
    if (search) query.search = search;
    if (mosque_id) query.mosque_id = mosque_id;
    if (district_id) query.district_id = district_id;
    if (animal_type_id) query.animal_type_id = animal_type_id;
    if (start_date) query.start_date = start_date;
    if (end_date) query.end_date = end_date;

    const res = await apiClient.get("/api/qurbans", query);
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
    const res = await apiClient.get(`/api/qurbans/${id}`);
    return { data: res.data };
  },

  getSummary: async () => {
    const res = await apiClient.get("/api/qurbans/summary");
    return res.data ?? {};
  },

  download: async (params = {}) => {
    const { search, mosque_id, district_id, animal_type_id, start_date, end_date } = params;
    const query = { page: 1, limit: 10000, download: true };
    if (search) query.search = search;
    if (mosque_id) query.mosque_id = mosque_id;
    if (district_id) query.district_id = district_id;
    if (animal_type_id) query.animal_type_id = animal_type_id;
    if (start_date) query.start_date = start_date;
    if (end_date) query.end_date = end_date;

    const blob = await apiClient.getBlob("/api/qurbans", query);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qurbans_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true };
  },

  bulkUpload: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/api/qurbans/bulk-upload", formData);
    return res.data;
  },

  create: (data) => apiClient.post("/api/qurbans", data),

  update: (id, data) => apiClient.put(`/api/qurbans/${id}`, data),

  remove: (id) => apiClient.delete(`/api/qurbans/${id}`),
};
