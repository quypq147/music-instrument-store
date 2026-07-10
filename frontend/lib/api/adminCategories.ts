import { apiFetch } from "./client";

export type Category = {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

export function listCategories() {
  return apiFetch<Category[]>("/categories");
}

export function deleteCategory(id: string) {
  return apiFetch<unknown>(`/categories/${id}`, { method: "DELETE" });
}

export function saveCategory(id: string | null, payload: { name: string; description: string }) {
  return apiFetch<Category>(id ? `/categories/${id}` : "/categories", {
    method: id ? "PUT" : "POST",
    body: payload,
  });
}
