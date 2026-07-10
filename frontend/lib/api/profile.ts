import { apiFetch } from "./client";

export type UserProfile = {
  userId: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  role?: string;
  avatarUrl?: string;
  googleLinked?: boolean;
  facebookLinked?: boolean;
  googleEmail?: string;
  facebookEmail?: string;
};

export function getProfile(token: string) {
  return apiFetch<{ profile: UserProfile }>("/users/profile", { token });
}

export function updateProfile(token: string, payload: Record<string, unknown>) {
  return apiFetch<{ profile?: UserProfile }>("/users/profile", {
    method: "PUT",
    token,
    body: payload,
  });
}
