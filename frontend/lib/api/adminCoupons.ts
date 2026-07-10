import { apiFetch } from "./client";

export type Coupon = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number;
  usageLimit: number | null;
  usageCount: number;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
};

export function listCoupons(token: string) {
  return apiFetch<Coupon[]>("/admin/coupons", { token });
}

export function createCoupon(
  token: string,
  payload: {
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minOrderValue: number;
    usageLimit: number | null;
    validUntil: string | null;
  }
) {
  return apiFetch<Coupon>("/admin/coupons", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateCoupon(token: string, code: string, payload: Partial<Coupon>) {
  return apiFetch<Coupon>(`/admin/coupons/${encodeURIComponent(code)}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteCoupon(token: string, code: string) {
  return apiFetch<unknown>(`/admin/coupons/${encodeURIComponent(code)}`, {
    method: "DELETE",
    token,
  });
}
