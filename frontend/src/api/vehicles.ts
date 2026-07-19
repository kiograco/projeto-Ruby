import { apiClient } from "./client";
import type { PagyMeta } from "./customers";

export interface Vehicle {
  id: number;
  plate: string;
  model: string;
  year: number;
  vehicle_type: string;
  capacity: number;
}

export interface VehiclesResponse {
  vehicles: Vehicle[];
  meta: PagyMeta;
}

export interface VehicleInput {
  plate: string;
  model: string;
  year: number;
  vehicle_type: string;
  capacity: number;
}

export const VEHICLE_TYPES = ["car", "motorcycle", "van", "truck"] as const;

export async function fetchVehicles(params: { page?: number; q?: string }): Promise<VehiclesResponse> {
  const { data } = await apiClient.get<VehiclesResponse>("/vehicles", { params });
  return data;
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const { data } = await apiClient.post<Vehicle>("/vehicles", input);
  return data;
}

export async function updateVehicle(id: number, input: VehicleInput): Promise<Vehicle> {
  const { data } = await apiClient.put<Vehicle>(`/vehicles/${id}`, input);
  return data;
}

export async function deleteVehicle(id: number): Promise<void> {
  await apiClient.delete(`/vehicles/${id}`);
}
