import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  downloadReport,
  fetchCustomersReport,
  fetchDeliveriesReport,
  fetchDriversReport,
  fetchMonthlyReport,
  fetchPerformanceReport,
  type ReportName,
} from "../api/reports";

type Tab = ReportName;

const TABS: { key: Tab; label: string }[] = [
  { key: "deliveries", label: "Deliveries" },
  { key: "monthly", label: "Monthly" },
  { key: "drivers", label: "Driver ranking" },
  { key: "customers", label: "Customer activity" },
  { key: "performance", label: "Performance" },
];

function ExportButtons({ report, params }: { report: ReportName; params?: Record<string, string | undefined> }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => downloadReport(report, "csv", params)}
        className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Export CSV
      </button>
      <button
        type="button"
        onClick={() => downloadReport(report, "pdf", params)}
        className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Export PDF
      </button>
    </div>
  );
}

function DeliveriesReportSection() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "deliveries", from, to],
    queryFn: () => fetchDeliveriesReport({ from, to }),
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="from-date">
              From
            </label>
            <input
              id="from-date"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="to-date">
              To
            </label>
            <input
              id="to-date"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <ExportButtons report="deliveries" params={{ from, to }} />
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      {data && (
        <div className="overflow-x-auto rounded border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Total</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Delivered</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Failed</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Cancelled</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.rows.map((row) => (
                <tr key={row.date}>
                  <td className="px-4 py-2 text-gray-900">{row.date}</td>
                  <td className="px-4 py-2 text-gray-600">{row.total}</td>
                  <td className="px-4 py-2 text-gray-600">{row.delivered}</td>
                  <td className="px-4 py-2 text-gray-600">{row.failed}</td>
                  <td className="px-4 py-2 text-gray-600">{row.cancelled}</td>
                  <td className="px-4 py-2 text-gray-600">${row.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DriversReportSection() {
  const { data, isLoading } = useQuery({ queryKey: ["reports", "drivers"], queryFn: fetchDriversReport });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <ExportButtons report="drivers" />
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      {data && (
        <div className="overflow-x-auto rounded border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Driver</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Deliveries</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Avg time</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.rows.map((row) => (
                <tr key={row.driver_id}>
                  <td className="px-4 py-2 text-gray-900">{row.name}</td>
                  <td className="px-4 py-2 text-gray-600">{row.deliveries_completed}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {row.average_delivery_time_minutes != null ? `${row.average_delivery_time_minutes}m` : "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-600">${row.revenue.toFixed(2)}</td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No drivers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MonthlyReportSection() {
  const { data, isLoading } = useQuery({ queryKey: ["reports", "monthly"], queryFn: () => fetchMonthlyReport({}) });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <ExportButtons report="monthly" />
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      {data && (
        <div className="overflow-x-auto rounded border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Month</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Total</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Delivered</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Failed</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Cancelled</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.rows.map((row) => (
                <tr key={row.month}>
                  <td className="px-4 py-2 text-gray-900">{row.month}</td>
                  <td className="px-4 py-2 text-gray-600">{row.total}</td>
                  <td className="px-4 py-2 text-gray-600">{row.delivered}</td>
                  <td className="px-4 py-2 text-gray-600">{row.failed}</td>
                  <td className="px-4 py-2 text-gray-600">{row.cancelled}</td>
                  <td className="px-4 py-2 text-gray-600">${row.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CustomersReportSection() {
  const { data, isLoading } = useQuery({ queryKey: ["reports", "customers"], queryFn: fetchCustomersReport });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <ExportButtons report="customers" />
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      {data && (
        <div className="overflow-x-auto rounded border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Customer</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Orders</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Delivered</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.rows.map((row) => (
                <tr key={row.customer_id}>
                  <td className="px-4 py-2 text-gray-900">{row.name}</td>
                  <td className="px-4 py-2 text-gray-600">{row.orders_count}</td>
                  <td className="px-4 py-2 text-gray-600">{row.delivered}</td>
                  <td className="px-4 py-2 text-gray-600">${row.revenue.toFixed(2)}</td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No customer activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PerformanceReportSection() {
  const { data, isLoading } = useQuery({ queryKey: ["reports", "performance"], queryFn: fetchPerformanceReport });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <ExportButtons report="performance" />
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">Total orders</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{data.total_orders}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">Delivered</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{data.delivered}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">Failed</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{data.failed}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">Cancelled</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{data.cancelled}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">Avg delivery time</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {data.average_delivery_time_minutes != null ? `${data.average_delivery_time_minutes}m` : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">On-time rate</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {data.on_time_rate != null ? `${data.on_time_rate}%` : "—"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>("deliveries");

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Reports</h1>

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === item.key
                ? "border-b-2 border-indigo-600 text-indigo-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "deliveries" && <DeliveriesReportSection />}
      {tab === "monthly" && <MonthlyReportSection />}
      {tab === "drivers" && <DriversReportSection />}
      {tab === "customers" && <CustomersReportSection />}
      {tab === "performance" && <PerformanceReportSection />}
    </div>
  );
}
