import { apiFetch } from "./client";
import type { Order } from "../../types/cart";

export function listAdminOrders(token: string) {
  return apiFetch<Order[]>("/admin/orders", { token });
}

export function updateAdminOrderStatus(token: string, orderId: string, status: string, reason?: string) {
  return apiFetch<unknown>(`/admin/orders/${orderId}`, {
    method: "PUT",
    token,
    body: { status, reason },
  });
}
