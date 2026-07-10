import { apiFetch } from "./client";

export type WishlistItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
  type: string;
  addedAt: string;
};

export function getWishlist(token: string) {
  return apiFetch<WishlistItem[]>("/users/wishlist", { token });
}

export function addToWishlist(token: string, productId: string | number) {
  return apiFetch<unknown>("/users/wishlist", {
    method: "POST",
    token,
    body: { productId },
  });
}

export function removeFromWishlist(token: string, productId: string | number) {
  return apiFetch<unknown>(`/users/wishlist/${productId}`, {
    method: "DELETE",
    token,
  });
}
