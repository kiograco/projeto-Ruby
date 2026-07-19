import { apiClient } from "./client";

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  document: string;
  created_at: string;
}

export interface PagyMeta {
  page: number;
  pages: number;
  count: number;
  limit: number;
}

export interface CustomersResponse {
  customers: Customer[];
  meta: PagyMeta;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email: string;
  document: string;
}

export async function fetchCustomers(params: { page?: number; q?: string }): Promise<CustomersResponse> {
  const { data } = await apiClient.get<CustomersResponse>("/customers", { params });
  return data;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const { data } = await apiClient.post<Customer>("/customers", input);
  return data;
}

export async function updateCustomer(id: number, input: CustomerInput): Promise<Customer> {
  const { data } = await apiClient.put<Customer>(`/customers/${id}`, input);
  return data;
}

export async function deleteCustomer(id: number): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}
