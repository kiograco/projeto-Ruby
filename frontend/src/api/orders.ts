import { apiClient } from "./client";
import type { PagyMeta } from "./customers";

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

export interface Address {
  id: number;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
}

export type AddressInput = Omit<Address, "id" | "latitude" | "longitude">;

export interface OrderItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
}

export type OrderItemInput = Omit<OrderItem, "id">;

export interface Order {
  id: number;
  status: OrderStatus;
  total_price: number;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  customer: { id: number; name: string };
  driver: { id: number; name: string } | null;
  pickup_address: Address;
  delivery_address: Address;
  order_items: OrderItem[];
  created_at: string;
}

export interface OrdersResponse {
  orders: Order[];
  meta: PagyMeta;
}

export interface OrderCreateInput {
  customer_id: number;
  total_price?: number;
  pickup_address_attributes: AddressInput;
  delivery_address_attributes: AddressInput;
  order_items_attributes?: OrderItemInput[];
}

export async function fetchOrders(params: { page?: number; status?: string }): Promise<OrdersResponse> {
  const { data } = await apiClient.get<OrdersResponse>("/orders", { params });
  return data;
}

export async function createOrder(input: OrderCreateInput): Promise<Order> {
  const { data } = await apiClient.post<Order>("/orders", input);
  return data;
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  const { data } = await apiClient.patch<Order>(`/orders/${id}`, { status });
  return data;
}

export async function assignDriver(id: number, driverId: number | null): Promise<Order> {
  const { data } = await apiClient.patch<Order>(`/orders/${id}`, { driver_id: driverId });
  return data;
}

export async function deleteOrder(id: number): Promise<void> {
  await apiClient.delete(`/orders/${id}`);
}
