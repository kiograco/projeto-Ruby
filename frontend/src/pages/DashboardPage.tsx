import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { fetchDashboardOverview } from "../api/dashboard";
import { StatTile } from "../components/dashboard/StatTile";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMinutes(value: number | null) {
  if (value == null) return "—";
  if (value < 60) return `${value.toFixed(0)}m`;
  return `${(value / 60).toFixed(1)}h`;
}

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: fetchDashboardOverview,
    refetchInterval: 15000,
  });

  const isForbidden = isAxiosError(error) && error.response?.status === 403;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Dashboard</h1>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {isForbidden && <p className="text-gray-500">The dashboard is available to admins and dispatchers.</p>}
      {error && !isForbidden && <p className="text-red-600">Failed to load dashboard metrics.</p>}

      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatTile label="Active drivers" value={data.active_drivers.toString()} />
          <StatTile label="Online drivers" value={data.online_drivers.toString()} />
          <StatTile label="Deliveries today" value={data.deliveries_today.toString()} />
          <StatTile label="Pending deliveries" value={data.pending_deliveries.toString()} />
          <StatTile label="Completed today" value={data.completed_deliveries.toString()} />
          <StatTile label="Revenue today" value={formatCurrency(data.revenue_today)} />
          <StatTile label="Avg delivery time" value={formatMinutes(data.average_delivery_time_minutes)} />
        </div>
      )}
    </div>
  );
}
