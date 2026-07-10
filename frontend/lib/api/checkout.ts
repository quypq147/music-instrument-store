import { apiFetch } from "./client";

export type CheckoutInitPayload = {
  customer: { name: string; phone: string; address: string; note: string };
  paymentMethod: "Momo" | "Stripe" | string;
  idempotencyKey: string;
  items: { productId: string; name: string; price: number; quantity: number }[];
};

export type CheckoutInitResult = {
  payUrl?: string;
  clientSecret?: string;
  isMock?: boolean;
};

export function initCheckoutPayment(payload: CheckoutInitPayload) {
  return apiFetch<CheckoutInitResult>("/checkout", {
    method: "POST",
    body: payload,
  });
}

export function notifyStripeWebhook(payload: unknown) {
  return apiFetch<unknown>("/payment-webhook/stripe", {
    method: "POST",
    body: payload,
  });
}

export function notifyMomoWebhook(payload: unknown) {
  return apiFetch<unknown>("/payment-webhook/momo", {
    method: "POST",
    body: payload,
  });
}
