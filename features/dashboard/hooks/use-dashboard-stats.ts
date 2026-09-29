import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats } from "@/services/dashboard-service";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });
}
