"use client";

import "../../components/common/AmplifyConfig";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchAuthSession } from "aws-amplify/auth";
import { useToast } from "../../context/ToastContext";
import { getOrCreateDeviceId } from "../../lib/deviceId";

// Chỉ chấp nhận đường dẫn nội bộ dạng "/xxx" (một dấu / duy nhất ở đầu, không phải "//" hay
// "https://..."), để tránh open-redirect qua query param "redirect" mà kẻ tấn công tự chèn vào link.
function getSafeRedirectTarget(value: string | null): string {
  if (value && /^\/(?!\/)[^\s\\]*$/.test(value)) {
    return value;
  }
  return "/";
}

function VerifyDeviceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const redirectTarget = getSafeRedirectTarget(searchParams.get("redirect"));

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Gửi lại mã bằng cách gọi lại /auth/device/check: backend thấy thiết bị chưa tin cậy sẽ tự
  // sinh OTP mới (ghi đè mã cũ trong DB) và gửi email — không cần endpoint riêng cho resend.
  const handleResend = async () => {
    if (isResending || resendCooldown > 0) return;
    setIsResending(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No session token found");

      const deviceId = getOrCreateDeviceId();
      const res = await fetch("/api/auth/device/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deviceId }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Không thể gửi lại mã. Vui lòng thử lại.", "error");
        return;
      }
      if (data.trusted === true) {
        // Thiết bị đã được tin cậy trong lúc chờ (vd. xác minh xong ở tab khác) — vào thẳng app.
        window.location.href = redirectTarget;
        return;
      }

      showToast("Đã gửi mã mới tới email của bạn.", "success");
      setResendCooldown(60);
    } catch (err) {
      console.error("Resend device OTP error:", err);
      showToast("Không thể gửi lại mã. Vui lòng thử lại.", "error");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      showToast("Vui lòng nhập đủ 6 chữ số.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No session token found");

      const deviceId = getOrCreateDeviceId();
      const res = await fetch("/api/auth/device/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deviceId, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Mã xác minh không đúng.", "error");
        return;
      }

      showToast("Xác minh thiết bị thành công!", "success");
      router.refresh();
      window.location.href = redirectTarget;
    } catch (err) {
      console.error("Device verify error:", err);
      showToast("Đã xảy ra lỗi khi xác minh. Vui lòng thử lại.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-cream dark:bg-[#02140f] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#06261d] rounded-md border border-border-subtle dark:border-primary-container/20 shadow-sm p-8">
        <h1 className="font-serif text-2xl text-primary dark:text-white font-bold mb-3">
          Xác minh thiết bị mới
        </h1>
        <p className="text-gray-500 dark:text-emerald-100/60 text-sm leading-relaxed mb-6">
          Chúng tôi phát hiện bạn đăng nhập từ một thiết bị hoặc trình duyệt chưa từng dùng gần đây.
          Vui lòng nhập mã 6 chữ số vừa được gửi tới email của bạn để tiếp tục.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={isSubmitting}
            placeholder="000000"
            className="w-full py-3 px-4 bg-white dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 rounded-sm text-center text-2xl tracking-[0.5em] text-[#1F2937] dark:text-emerald-50 outline-none focus:border-secondary disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary dark:bg-[#064e3b] hover:bg-primary-container dark:hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-[0.15em] py-4 rounded-sm transition-all disabled:opacity-75"
          >
            {isSubmitting ? "Đang xác minh..." : "Xác Minh"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || resendCooldown > 0}
          className="w-full mt-3 py-3 text-secondary dark:text-[#fe932c] font-bold text-xs uppercase tracking-[0.15em] border border-secondary/40 dark:border-[#fe932c]/40 rounded-sm hover:bg-secondary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending
            ? "Đang gửi lại mã..."
            : resendCooldown > 0
              ? `Gửi lại mã sau ${resendCooldown}s`
              : "Gửi lại mã"}
        </button>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-emerald-900/40">
          Mã hết hạn sau 5 phút. Không nhận được email? Kiểm tra hộp thư rác hoặc bấm
          &quot;Gửi lại mã&quot;.
        </p>
        <p className="mt-3 text-center text-sm">
          <Link href="/login" className="text-secondary dark:text-[#fe932c] font-bold">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function VerifyDevicePage() {
  return (
    <Suspense fallback={null}>
      <VerifyDeviceContent />
    </Suspense>
  );
}
