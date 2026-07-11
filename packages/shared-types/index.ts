export interface SharedProductSummary {
  id: string;
  name: string;
  price: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  avatarUrl?: string;
  role?: "Admin" | "Staff" | "User";
  googleLinked?: boolean;
  facebookLinked?: boolean;
  googleEmail?: string;
  facebookEmail?: string;
  // Nhà cung cấp đăng nhập thật của phiên hiện tại (suy ra từ JWT, không lưu DB) — dùng để
  // phân biệt "liên kết thật qua Hosted UI OAuth" với cờ googleLinked/facebookLinked lưu thủ công.
  authProvider?: "Google" | "Facebook" | "Email";
  updatedAt?: string;
}
