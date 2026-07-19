import { apiClient } from "./client";

export interface DashboardOverview {
  active_drivers: number;
  online_drivers: number;
  deliveries_today: number;
  average_delivery_time_minutes: number | null;
  revenue_today: number;
  pending_deliveries: number;
  completed_deliveries: number;
}

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const { data } = await apiClient.get<DashboardOverview>("/dashboard/overview");
  return data;
}
