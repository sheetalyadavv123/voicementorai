import type { DashboardStats } from "@/app/api/dashboard/stats/route";

export type { DashboardStats };

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch("/api/dashboard/stats");
  if (!response.ok) throw new Error("Failed to load dashboard stats");
  return response.json();
}
