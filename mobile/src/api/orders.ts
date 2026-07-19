import { apiClient } from "./client";

export type OrderStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "near_destination"
  | "delivered"
  | "cancelled"
  | "failed";

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "failed"],
  in_transit: ["near_destination", "failed"],
  near_destination: ["delivered", "failed"],
  delivered: [],
  cancelled: [],
  failed: [],
};

export interface Order {
  id: number;
  status: OrderStatus;
  total_price: number;
  delivered_at: string | null;
  customer: { id: number; name: string };
  driver: { id: number; name: string } | null;
  pickup_address: { street: string; number: string; city: string; state: string };
  delivery_address: { street: string; number: string; city: string; state: string; latitude: number | null; longitude: number | null };
  proof_of_delivery_url: string | null;
  created_at: string;
}

export interface OrdersResponse {
  orders: Order[];
  meta: { page: number; pages: number; count: number; limit: number };
}

export async function fetchMyOrders(): Promise<OrdersResponse> {
  const { data } = await apiClient.get<OrdersResponse>("/orders");
  return data;
}

export async function fetchAvailableOrders(): Promise<OrdersResponse> {
  const { data } = await apiClient.get<OrdersResponse>("/orders/available");
  return data;
}

export async function acceptOrder(id: number): Promise<Order> {
  const { data } = await apiClient.post<Order>(`/orders/${id}/accept`);
  return data;
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  const { data } = await apiClient.patch<Order>(`/orders/${id}`, { status });
  return data;
}

export async function uploadProofOfDelivery(id: number, photo: { uri: string; name: string; type: string }): Promise<Order> {
  const formData = new FormData();
  formData.append("file", {
    uri: photo.uri,
    name: photo.name,
    type: photo.type,
  } as unknown as Blob);

  const { data } = await apiClient.post<Order>(`/orders/${id}/proof_of_delivery`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
