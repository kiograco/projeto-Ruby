import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrderTimeline, uploadProofOfDelivery, type Order, type OrderTimelineEvent } from "../../api/orders";

interface OrderTimelinePanelProps {
  order: Order;
  canUploadProof: boolean;
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

export function OrderTimelinePanel({ order, canUploadProof, onClose }: OrderTimelinePanelProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["order-timeline", order.id],
    queryFn: () => fetchOrderTimeline(order.id),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadProofOfDelivery(order.id, file),
    onSuccess: () => {
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: () => setUploadError("Upload failed. Please try again."),
  });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    event.target.value = "";
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Order #{order.id} history</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mb-4 rounded border border-gray-200 p-3">
          <div className="mb-1 text-sm font-medium text-gray-700">Proof of delivery</div>
          {order.proof_of_delivery_url ? (
            <a
              href={order.proof_of_delivery_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-indigo-600 hover:underline"
            >
              View attached file
            </a>
          ) : (
            <p className="text-sm text-gray-500">No file attached yet.</p>
          )}
          {canUploadProof && (
            <div className="mt-2">
              <input ref={fileInputRef} type="file" onChange={handleFileChange} className="text-xs" />
              {uploadMutation.isPending && <p className="mt-1 text-xs text-gray-500">Uploading…</p>}
              {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
            </div>
          )}
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
