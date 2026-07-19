import { apiClient } from "./client";
import type { PagyMeta } from "./customers";

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export interface UsersResponse {
  users: AppUser[];
  meta: PagyMeta;
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  active?: boolean;
}

export const ROLES = ["admin", "dispatcher", "driver", "customer"] as const;

export async function fetchUsers(params: { page?: number; q?: string }): Promise<UsersResponse> {
  const { data } = await apiClient.get<UsersResponse>("/users", { params });
  return data;
}

export async function createUser(input: UserCreateInput): Promise<AppUser> {
  const { data } = await apiClient.post<AppUser>("/users", input);
  return data;
}

export async function updateUser(id: number, input: UserUpdateInput): Promise<AppUser> {
  const { data } = await apiClient.put<AppUser>(`/users/${id}`, input);
  return data;
}

export async function deactivateUser(id: number): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
