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

const OAUTH_PENDING_PROVIDER_KEY = "music-store-oauth-pending-provider";
const OAUTH_LINK_RETRIED_KEY = "music-store-oauth-link-retried";

// Gọi ngay trước mỗi lần signInWithRedirect. Backend PreSignUp trigger sẽ chặn lần
// federated sign-up đầu tiên sau khi tự liên kết tài khoản (xem services/auth-pre-signup);
// nhớ lại provider ở đây để AmplifyConfig có thể tự động thử đăng nhập lại đúng provider
// khi Cognito redirect về kèm marker AUTO_LINKED trong error_description.
export function rememberOAuthAttempt(provider: "Google" | "Facebook"): void {
  try {
    window.sessionStorage.setItem(OAUTH_PENDING_PROVIDER_KEY, provider);
    window.sessionStorage.removeItem(OAUTH_LINK_RETRIED_KEY);
  } catch {
    // sessionStorage bị chặn (vd. chế độ riêng tư khắt khe) — bỏ qua, user chỉ phải
    // tự bấm đăng nhập Google/Facebook lần thứ hai thay vì được retry tự động.
  }
}

// Trả về provider cần retry (đúng 1 lần) sau khi bị PreSignUp trigger chặn để liên kết.
export function takeOAuthRetryProvider(): "Google" | "Facebook" | null {
  try {
    const provider = window.sessionStorage.getItem(OAUTH_PENDING_PROVIDER_KEY);
    if (provider !== "Google" && provider !== "Facebook") return null;
    if (window.sessionStorage.getItem(OAUTH_LINK_RETRIED_KEY)) return null;
    window.sessionStorage.setItem(OAUTH_LINK_RETRIED_KEY, "1");
    return provider;
  } catch {
    return null;
  }
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
