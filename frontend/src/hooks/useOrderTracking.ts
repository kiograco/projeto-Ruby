import { useEffect } from "react";
import { getCableConsumer } from "../lib/cable";
import type { TrackingPoint } from "../api/tracking";

export function useOrderTracking(orderId: number | null, onPoint: (point: TrackingPoint) => void) {
  useEffect(() => {
    if (!orderId) return;

    const consumer = getCableConsumer();
    const subscription = consumer.subscriptions.create(
      { channel: "DeliveryTrackingChannel", order_id: orderId },
      { received: (data: TrackingPoint) => onPoint(data) }
    );

    return () => {
      subscription.unsubscribe();
    };
    // Re-subscribing on every onPoint identity change would tear down and
    // recreate the socket subscription on each render; callers should keep
    // onPoint stable (e.g. via useCallback) rather than this effect
    // depending on it.
  }, [orderId]);
}
