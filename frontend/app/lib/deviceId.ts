const DEVICE_ID_KEY = "music-store-device-id";

// Định danh trình duyệt này (không phải định danh user) — dùng localStorage (không phải
// sessionStorage) vì cần nhận ra "thiết bị quen" ngay cả khi người dùng chọn không ghi nhớ
// đăng nhập ở lần đó; việc gợi nhớ device khác hoàn toàn việc ghi nhớ phiên đăng nhập.
export function getOrCreateDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const generated = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}
