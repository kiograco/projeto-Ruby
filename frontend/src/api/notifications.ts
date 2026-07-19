import { apiClient } from "./client";
import type { PagyMeta } from "./customers";

export interface Notification {
  id: number;
  order_id: number | null;
  event: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  meta: PagyMeta;
}

export async function fetchNotifications(params: { unread?: boolean } = {}): Promise<NotificationsResponse> {
  const { data } = await apiClient.get<NotificationsResponse>("/notifications", {
    params: params.unread ? { unread: "true" } : undefined,
  });
  return data;
}

export async function markNotificationRead(id: number): Promise<Notification> {
  const { data } = await apiClient.put<Notification>(`/notifications/${id}`);
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/mark_all_read");
}
