import { apiFetch } from "./client";
import type { Product } from "../../types/product";

export function listProducts() {
  return apiFetch<Product[]>("/products");
}

export function deleteProduct(token: string | null | undefined, id: string) {
  return apiFetch<unknown>(`/products/${id}`, {
    method: "DELETE",
    token,
  });
}

export function saveProduct(
  token: string | null | undefined,
  id: string,
  isEdit: boolean,
  payload: Record<string, unknown>
) {
  return apiFetch<Product>(isEdit ? `/products/${id}` : "/products", {
    method: isEdit ? "PUT" : "POST",
    token,
    body: payload,
  });
}
