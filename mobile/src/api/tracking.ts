import { apiClient } from "./client";

export async function reportLocation(
  orderId: number,
  payload: { latitude: number; longitude: number; speed?: number; heading?: number }
): Promise<void> {
  await apiClient.post("/tracking/location", { order_id: orderId, ...payload });
}
