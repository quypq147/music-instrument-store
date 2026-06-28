"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp, confirmSignUp } from "@aws-amplify/auth";

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<"REGISTER" | "CONFIRM_CODE">("REGISTER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user.name || !user.email || !user.password || !user.confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (user.password !== user.confirmPassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    setIsSubmitting(true);
    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: user.email,
        password: user.password,
        options: {
          userAttributes: {
            email: user.email,
            name: user.name,
          },
        },
      });

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setStep("CONFIRM_CODE");
        alert("Một mã xác nhận (OTP) đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!");
      } else if (isSignUpComplete) {
        alert("Đăng ký thành công!");
        router.push("/login");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Sign up error:", error);
      alert(error.message || "Không thể đăng ký. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmationCode) {
      alert("Vui lòng nhập mã xác nhận!");
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmSignUp({
        username: user.email,
        confirmationCode: confirmationCode,
      });

      alert("Xác nhận tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.");
      router.push("/login");
    } catch (err) {
      const error = err as Error;
      console.error("Confirmation error:", error);
      alert(error.message || "Mã xác nhận không chính xác. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="register-page">
      {step === "REGISTER" ? (
        <form className="register-card" onSubmit={handleRegister}>
          <div className="register-icon">🎷</div>

          <h1>Đăng Ký</h1>
          <p className="register-desc">
            Tạo tài khoản để mua hàng và theo dõi đơn hàng
          </p>

          <input
            type="text"
            placeholder="Họ và tên"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            disabled={isSubmitting}
          />

          <input
            type="email"
            placeholder="Email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            disabled={isSubmitting}
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            disabled={isSubmitting}
          />

          <input
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={user.confirmPassword}
            onChange={(e) =>
              setUser({ ...user, confirmPassword: e.target.value })
            }
            disabled={isSubmitting}
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : "Đăng Ký"}
          </button>

          <p className="register-login">
            Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
          </p>
        </form>
      ) : (
        <form className="register-card" onSubmit={handleConfirmCode}>
          <div className="register-icon">🔒</div>

          <h1>Xác Nhận Tài Khoản</h1>
          <p className="register-desc">
            Vui lòng nhập mã xác nhận (OTP) đã được gửi đến email <b>{user.email}</b>
          </p>

          <input
            type="text"
            placeholder="Mã xác nhận (OTP)"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            disabled={isSubmitting}
            style={{ textAlign: "center", fontWeight: "bold", letterSpacing: "0.2em", fontSize: "18px" }}
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang xác thực..." : "Xác Nhận OTP"}
          </button>

          <button
            type="button"
            className="back-btn"
            style={{ marginTop: "10px", width: "100%", backgroundColor: "transparent", color: "var(--color-primary)", border: "1px solid var(--color-primary)", padding: "14px", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}
            onClick={() => setStep("REGISTER")}
            disabled={isSubmitting}
          >
            Quay lại
          </button>
        </form>
      )}
    </main>
  );
}