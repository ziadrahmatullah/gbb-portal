import { useQuery } from "@tanstack/react-query";
import { activityLogService } from "../services";

const KEY = "activity-logs";

export function useActivityLogs(params = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => activityLogService.getAll(params),
  });
}
