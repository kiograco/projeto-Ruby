import { useQuery } from "@tanstack/react-query";
import { fetchOrderTimeline, type OrderTimelineEvent } from "../../api/orders";

interface OrderTimelinePanelProps {
  orderId: number;
  onClose: () => void;
}

const ACTION_LABEL: Record<string, string> = {
  order_created: "Order created",
  driver_assigned: "Driver assigned",
  status_change: "Status changed",
};

function describeEvent(event: OrderTimelineEvent): string {
  if (event.action === "status_change") {
    return `${String(event.before_state?.status ?? "?")} → ${String(event.after_state?.status ?? "?")}`;
  }
  if (event.action === "driver_assigned") {
    return `Driver #${String(event.after_state?.driver_id ?? "?")}`;
  }
  return "";
}

export function OrderTimelinePanel({ orderId, onClose }: OrderTimelinePanelProps) {
  const { data: events, isLoading } = useQuery({
    queryKey: ["order-timeline", orderId],
    queryFn: () => fetchOrderTimeline(orderId),
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Order #{orderId} history</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

        {events && events.length === 0 && <p className="text-sm text-gray-500">No history yet.</p>}

        {events && events.length > 0 && (
          <ol className="space-y-3 border-l border-gray-200 pl-4">
            {events.map((event) => (
              <li key={event.id} className="relative text-sm">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-indigo-600" />
                <div className="font-medium text-gray-900">{ACTION_LABEL[event.action] ?? event.action}</div>
                <div className="text-gray-600">{describeEvent(event)}</div>
                <div className="text-xs text-gray-400">
                  {new Date(event.created_at).toLocaleString()}
                  {event.user_name ? ` · ${event.user_name}` : ""}
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
