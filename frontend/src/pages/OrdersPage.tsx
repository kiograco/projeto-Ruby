import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  ORDER_STATUS_TRANSITIONS,
  assignDriver,
  createOrder,
  deleteOrder,
  fetchOrders,
  updateOrderStatus,
  type Order,
  type OrderCreateInput,
  type OrderStatus,
} from "../api/orders";
import { fetchDrivers } from "../api/drivers";
import { useAuth } from "../contexts/AuthContext";
import { OrderFormPanel } from "../components/orders/OrderFormPanel";
import { OrderTimelinePanel } from "../components/orders/OrderTimelinePanel";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  picked_up: "Picked up",
  in_transit: "In transit",
  near_destination: "Near destination",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Failed",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  assigned: "bg-blue-100 text-blue-700",
  picked_up: "bg-blue-100 text-blue-700",
  in_transit: "bg-indigo-100 text-indigo-700",
  near_destination: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  failed: "bg-red-100 text-red-700",
};

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "assigned",
  "picked_up",
  "in_transit",
  "near_destination",
  "delivered",
  "cancelled",
  "failed",
];

export function OrdersPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "dispatcher";
  const isDriver = user?.role === "driver";
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [timelineOrder, setTimelineOrder] = useState<Order | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", page, statusFilter],
    queryFn: () => fetchOrders({ page, status: statusFilter || undefined }),
  });

  const { data: driversData } = useQuery({
    queryKey: ["drivers", "for-select"],
    queryFn: () => fetchDrivers({ page: 1 }),
    enabled: canManage,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }

  function extractErrors(err: unknown): string[] {
    if (isAxiosError(err) && Array.isArray(err.response?.data?.errors)) {
      return err.response.data.errors;
    }
    return ["Something went wrong. Please try again."];
  }

  const createMutation = useMutation({
    mutationFn: (input: OrderCreateInput) => createOrder(input),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setFormErrors([]);
    },
    onError: (err) => setFormErrors(extractErrors(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => updateOrderStatus(id, status),
    onSuccess: () => invalidate(),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, driverId }: { id: number; driverId: number | null }) => assignDriver(id, driverId),
    onSuccess: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteOrder(id),
    onSuccess: () => invalidate(),
  });

  function handleDelete(order: Order) {
    if (window.confirm(`Delete order #${order.id}?`)) {
      deleteMutation.mutate(order.id);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        {!isDriver && (
          <button
            type="button"
            onClick={() => {
              setFormErrors([]);
              setShowForm(true);
            }}
            className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
          >
            New order
          </button>
        )}
      </div>

      <select
        value={statusFilter}
        onChange={(event) => {
          setPage(1);
          setStatusFilter(event.target.value);
        }}
        className="mb-4 w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">All statuses</option>
        {ALL_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABEL[status]}
          </option>
        ))}
      </select>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {isError && <p className="text-red-600">Failed to load orders.</p>}

      {data && (
        <>
          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">#</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Total</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Driver</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.orders.map((order) => {
                  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status];
                  const canUpdateStatus = canManage || (isDriver && order.driver);

                  return (
                    <tr key={order.id}>
                      <td className="px-4 py-2 text-gray-900">#{order.id}</td>
                      <td className="px-4 py-2 text-gray-600">{order.customer.name}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_COLOR[order.status]}`}>
                          {STATUS_LABEL[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">${order.total_price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {canManage ? (
                          <select
                            value={order.driver?.id ?? ""}
                            onChange={(event) =>
                              assignMutation.mutate({
                                id: order.id,
                                driverId: event.target.value ? Number(event.target.value) : null,
                              })
                            }
                            className="rounded border border-gray-300 px-2 py-1 text-xs"
                          >
                            <option value="">Unassigned</option>
                            {driversData?.drivers.map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          (order.driver?.name ?? "—")
                        )}
                      </td>
                      <td className="space-x-2 px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setTimelineOrder(order)}
                          className="text-gray-500 hover:underline"
                        >
                          History
                        </button>
                        {canUpdateStatus &&
                          nextStatuses.map((next) => (
                            <button
                              key={next}
                              type="button"
                              onClick={() => statusMutation.mutate({ id: order.id, status: next })}
                              className="text-indigo-600 hover:underline"
                            >
                              {STATUS_LABEL[next]}
                            </button>
                          ))}
                        {user?.role === "admin" && (
                          <button
                            type="button"
                            onClick={() => handleDelete(order)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {data.orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Page {data.meta.page} of {data.meta.pages} ({data.meta.count} total)
            </span>
            <div className="space-x-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= data.meta.pages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <OrderFormPanel
          errors={formErrors}
          isSubmitting={createMutation.isPending}
          onSubmit={(input) => createMutation.mutate(input)}
          onCancel={() => {
            setShowForm(false);
            setFormErrors([]);
          }}
        />
      )}

      {timelineOrder && (
        <OrderTimelinePanel
          order={data?.orders.find((candidate) => candidate.id === timelineOrder.id) ?? timelineOrder}
          canUploadProof={canManage || isDriver}
          onClose={() => setTimelineOrder(null)}
        />
      )}
    </div>
  );
}
