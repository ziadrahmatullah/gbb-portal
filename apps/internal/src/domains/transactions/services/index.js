import { apiClient } from "@/shared/lib/apiClient";

// Import other services for dropdown data
import { categoryService } from "@/domains/categories/services";
import { districtService } from "@/domains/districts/services";
import { mosqueService } from "@/domains/mosques/services";

export const transactionService = {
  // Get transactions list with filters
  getAll: async (params = {}) => {
    const {
      page = 1,
      limit = 10,
      search,
      category_id,
      category_type,
      district_id,
      mosque_id,
      start_date,
      end_date,
      order_by,
    } = params;

    const query = { page, limit };
    if (search) query.search = search;
    if (category_id) query.category_id = category_id;
    if (category_type) query.category_type = category_type;
    if (district_id) query.district_id = district_id;
    if (mosque_id) query.mosque_id = mosque_id;
    if (start_date) query.start_date = start_date;
    if (end_date) query.end_date = end_date;
    if (order_by) query.order_by = order_by;

    const res = await apiClient.get("/api/transactions", query);
    return {
      items: res.data?.data ?? [],
      pagination: {
        current_page: res.data?.meta?.current_page ?? 1,
        total_page: res.data?.meta?.total_page ?? 1,
        total_item: res.data?.meta?.total_item ?? 0,
        current_item: res.data?.meta?.current_item ?? 0,
      },
      summary: {
        total_income: res.data?.total_income ?? 0,
        total_expense: res.data?.total_expense ?? 0,
        total_net: res.data?.total_net ?? 0,
      },
    };
  },

  // Get single transaction by id
  getById: async (id) => {
    const res = await apiClient.get(`/api/transactions/${id}`);
    return { data: res.data };
  },

  // Create new transaction
  create: async (data) => {
    const res = await apiClient.post("/api/transactions", data);
    return res.data;
  },

  // Update transaction
  update: async (id, data) => {
    const res = await apiClient.put(`/api/transactions/${id}`, data);
    return res.data;
  },

  // Delete transaction
  remove: async (id) => {
    const res = await apiClient.delete(`/api/transactions/${id}`);
    return res.data;
  },

  // Bulk upload transactions
  bulkUpload: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiClient.post("/api/transactions/bulk-upload", formData);
    return res.data;
  },

  // Download transactions as Excel file
  download: async (params = {}) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      category_id = "",
      category_type = "",
      district_id = "",
      mosque_id = "",
      start_date = "",
      end_date = "",
    } = params;

    const query = { page, limit, download: true };
    if (search) query.search = search;
    if (category_id) query.category_id = category_id;
    if (category_type) query.category_type = category_type;
    if (district_id) query.district_id = district_id;
    if (mosque_id) query.mosque_id = mosque_id;
    if (start_date) query.start_date = start_date;
    if (end_date) query.end_date = end_date;

    const blob = await apiClient.getBlob("/api/transactions", query);

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  },

  // Get transaction trend
  getTrend: async (params = {}) => {
    const { filter = "mtd", year, month, category_id, district_id, mosque_id } = params;
    const query = { filter, year };
    if (month) query.month = month;
    if (category_id) query.category_id = category_id;
    if (district_id) query.district_id = district_id;
    if (mosque_id) query.mosque_id = mosque_id;

    const res = await apiClient.get("/api/transactions/trend", query);
    return res.data ?? { data: [] };
  },

  // Get categories for dropdown - use categoryService
  getCategoriesDropdown: async () => {
    const result = await categoryService.getAll({ limit: 100 });
    return result.items ?? [];
  },

  // Get districts for dropdown - use districtService
  getDistrictsDropdown: async () => {
    const result = await districtService.getAll({ limit: 100 });
    return result.items ?? [];
  },

  // Get mosques for dropdown - use mosqueService
  getMosquesDropdown: async () => {
    const result = await mosqueService.getAll({ limit: 100 });
    return result.items ?? [];
  },
};
