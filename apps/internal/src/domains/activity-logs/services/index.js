import { apiClient } from "@/shared/lib/apiClient";

export const activityLogService = {
  getAll: async (params = {}) => {
    const { page = 1, limit = 10, start_date, end_date } = params;
    const query = { page, limit };
    if (start_date) query.start_date = start_date;
    if (end_date) query.end_date = end_date;
    const res = await apiClient.get("/api/activity-logs", query);
    return { items: res.data ?? [], pagination: { ...res.meta } };
  },
};
