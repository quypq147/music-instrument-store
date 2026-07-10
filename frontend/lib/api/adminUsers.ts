import { apiFetch } from "./client";
import type { AdminUser } from "../../app/components/admin/UserTable";

export function listAdminUsers(token: string) {
  return apiFetch<AdminUser[]>("/admin/users", { token });
}

export function updateAdminUser(
  token: string,
  userId: string,
  payload: { name: string; phone: string; address: string; role: string; email?: string }
) {
  return apiFetch<AdminUser>(`/admin/users/${userId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteAdminUser(token: string, userId: string) {
  return apiFetch<unknown>(`/admin/users/${userId}`, {
    method: "DELETE",
    token,
  });
}
