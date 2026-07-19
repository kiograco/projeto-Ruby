import { apiClient } from "./client";
import type { PagyMeta } from "./customers";
import type { Vehicle } from "./vehicles";

export interface DriverDocument {
  id: number;
  filename: string;
  url: string;
}

export interface Driver {
  id: number;
  name: string;
  email: string;
  license_number: string;
  status: "offline" | "available" | "on_delivery";
  current_latitude: number | null;
  current_longitude: number | null;
  vehicle: Vehicle | null;
  documents: DriverDocument[];
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

export async function uploadDriverDocument(id: number, file: File): Promise<Driver> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<Driver>(`/drivers/${id}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteDriverDocument(id: number, documentId: number): Promise<Driver> {
  const { data } = await apiClient.delete<Driver>(`/drivers/${id}/documents/${documentId}`);
  return data;
}
