import { apiClient } from "./client";

export interface TrackingPoint {
  id: number;
  order_id: number;
  driver_id: number;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
}

export async function fetchLatestTracking(orderId: number): Promise<{ order_status: string; point: TrackingPoint | null }> {
  const { data } = await apiClient.get(`/tracking/${orderId}`);
  return data;
}

export async function fetchTrackingHistory(orderId: number): Promise<{ points: TrackingPoint[] }> {
  const { data } = await apiClient.get(`/tracking/history/${orderId}`);
  return data;
}

export async function reportLocation(
  orderId: number,
  payload: { latitude: number; longitude: number; speed?: number; heading?: number }
): Promise<TrackingPoint> {
  const { data } = await apiClient.post<TrackingPoint>("/tracking/location", { order_id: orderId, ...payload });
  return data;
}
