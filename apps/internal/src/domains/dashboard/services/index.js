import { apiClient } from "@/shared/lib/apiClient";

export const dashboardService = {
  getMasterData: async () => {
    const res = await apiClient.get("/api/dashboard/master-data");
    return res.data ?? {};
  },

  getTransaction: async (params = {}) => {
    const { filter = "ytd", year, month } = params;
    const query = { filter, year };
    if (month) query.month = month;
    const res = await apiClient.get("/api/dashboard/transaction", query);
    return res.data ?? {};
  },

  getQurban: async (params = {}) => {
    const { year } = params;
    const query = {};
    if (year) query.year = year;
    const res = await apiClient.get("/api/dashboard/qurban", query);
    return res.data ?? {};
  },
};
