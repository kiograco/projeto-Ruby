import { apiClient } from "./client";
import type { PagyMeta } from "./customers";
import type { Vehicle } from "./vehicles";

export interface Driver {
  id: number;
  name: string;
  email: string;
  license_number: string;
  status: "offline" | "available" | "on_delivery";
  current_latitude: number | null;
  current_longitude: number | null;
  vehicle: Vehicle | null;
}

export interface DriversResponse {
  drivers: Driver[];
  meta: PagyMeta;
}

export interface DriverCreateInput {
  name: string;
  email: string;
  password: string;
  license_number: string;
  vehicle_id?: number | null;
  status?: string;
}

export interface DriverUpdateInput {
  license_number: string;
  vehicle_id?: number | null;
  status?: string;
}

export async function fetchDrivers(params: { page?: number; q?: string }): Promise<DriversResponse> {
  const { data } = await apiClient.get<DriversResponse>("/drivers", { params });
  return data;
}

export async function createDriver(input: DriverCreateInput): Promise<Driver> {
  const { data } = await apiClient.post<Driver>("/drivers", input);
  return data;
}

export async function updateDriver(id: number, input: DriverUpdateInput): Promise<Driver> {
  const { data } = await apiClient.put<Driver>(`/drivers/${id}`, input);
  return data;
}

export async function deleteDriver(id: number): Promise<void> {
  await apiClient.delete(`/drivers/${id}`);
}
