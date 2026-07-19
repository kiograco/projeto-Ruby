import { apiClient } from "./client";

export interface DeliveriesReportRow {
  date: string;
  total: number;
  delivered: number;
  failed: number;
  cancelled: number;
  revenue: number;
}

export interface DeliveriesReport {
  from: string;
  to: string;
  rows: DeliveriesReportRow[];
}

export interface DriverReportRow {
  driver_id: number;
  name: string;
  deliveries_completed: number;
  average_delivery_time_minutes: number | null;
  revenue: number;
}

export interface DriversReport {
  rows: DriverReportRow[];
}

export interface PerformanceReport {
  total_orders: number;
  delivered: number;
  failed: number;
  cancelled: number;
  average_delivery_time_minutes: number | null;
  on_time_rate: number | null;
}

export async function fetchDeliveriesReport(params: { from?: string; to?: string }): Promise<DeliveriesReport> {
  const { data } = await apiClient.get<DeliveriesReport>("/reports/deliveries", { params });
  return data;
}

export async function fetchDriversReport(): Promise<DriversReport> {
  const { data } = await apiClient.get<DriversReport>("/reports/drivers");
  return data;
}

export async function fetchPerformanceReport(): Promise<PerformanceReport> {
  const { data } = await apiClient.get<PerformanceReport>("/reports/performance");
  return data;
}

export type ReportName = "deliveries" | "drivers" | "performance";

export async function downloadReport(
  report: ReportName,
  format: "csv" | "pdf",
  params: Record<string, string | undefined> = {}
): Promise<void> {
  const response = await apiClient.get(`/reports/${report}`, {
    params: { ...params, export: format },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
