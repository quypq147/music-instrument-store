import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { defaultStorage, type KeyValueStorageInterface } from "@aws-amplify/core";

const STORAGE_MODE_KEY = "music-store-auth-storage-mode";

// Adapter phù hợp KeyValueStorageInterface của Amplify, dùng sessionStorage thay vì
// localStorage mặc định — token sẽ tự mất khi đóng tab/trình duyệt (không "ghi nhớ đăng nhập").
const sessionStorageAdapter: KeyValueStorageInterface = {
  async setItem(key: string, value: string) {
    window.sessionStorage.setItem(key, value);
  },
  async getItem(key: string) {
    return window.sessionStorage.getItem(key);
  },
  async removeItem(key: string) {
    window.sessionStorage.removeItem(key);
  },
  async clear() {
    window.sessionStorage.clear();
  },
};

// Gọi ngay sau khi signIn() thành công, dựa trên trạng thái checkbox "Ghi nhớ đăng nhập".
// Không tích -> chuyển Amplify sang lưu token ở sessionStorage (mất khi đóng trình duyệt).
// Có tích -> giữ hành vi mặc định của Amplify (localStorage, tồn tại qua các lần mở lại).
export function applyRememberMePreference(rememberMe: boolean): void {
  if (rememberMe) {
    window.sessionStorage.removeItem(STORAGE_MODE_KEY);
    // Luôn đặt lại tường minh về localStorage mặc định — cognitoUserPoolsTokenProvider là
    // singleton toàn cục, nếu một lần đăng nhập trước đó (trong cùng tab) đã chuyển sang
    // sessionStorage thì việc chỉ xoá cờ sentinel ở trên không đủ để đổi lại storage đang dùng.
    cognitoUserPoolsTokenProvider.setKeyValueStorage(defaultStorage);
    return;
  }

  window.sessionStorage.setItem(STORAGE_MODE_KEY, "session");
  cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorageAdapter);
}

// Gọi 1 lần khi app khởi động (module scope của AmplifyConfig). sessionStorage (khác với
// token bên trong nó) sống sót qua F5/refresh trong cùng tab, nên đây là cách duy nhất để
// một phiên "không ghi nhớ" tiếp tục đọc đúng token từ sessionStorage sau khi người dùng
// refresh trang, thay vì Amplify quay về đọc nhầm localStorage (rỗng) và tưởng đã đăng xuất.
export function initAuthStorageFromPreference(): void {
  if (typeof window === "undefined") return;
  if (window.sessionStorage.getItem(STORAGE_MODE_KEY) === "session") {
    cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorageAdapter);
  }
}
