"use client";

import "../components/AmplifyConfig";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp, confirmSignUp } from "@aws-amplify/auth";

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<"REGISTER" | "CONFIRM_CODE">("REGISTER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
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

    if (!agreeTerms) {
      alert("Vui lòng đồng ý với Điều khoản & Chính sách của Aureate Forest Boutique!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Format phone number to E.164 format if provided
      let formattedPhone = user.phone.trim();
      if (formattedPhone) {
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "+84" + formattedPhone.substring(1);
        }
        formattedPhone = formattedPhone.replace(/\s+/g, "");
      }

      const signUpParams = {
        username: user.email,
        password: user.password,
        options: {
          userAttributes: {
            email: user.email,
            name: user.name,
            ...(formattedPhone ? { phone_number: formattedPhone } : {}),
          },
        },
      };

      const { isSignUpComplete, nextStep } = await signUp(signUpParams);

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
    <main className="min-h-screen flex flex-col md:flex-row bg-surface text-on-surface font-body-md">
      {/* Branding & Visual Side (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 luxury-gradient relative flex-col justify-between p-container-margin text-on-primary overflow-hidden">
        <div className="z-10">
          <Link
            className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary-fixed inline-block mb-12"
            href="/"
          >
            Nhóm TTTN Music
          </Link>
          <div className="max-w-md">
            <h1 className="font-display-lg text-display-lg mb-stack-md leading-tight text-white">
              Crafting the Soul of <span className="italic text-secondary-fixed">Sound.</span>
            </h1>
            <p className="font-body-lg text-body-lg text-primary-fixed/80 leading-relaxed">
              Join an exclusive community of musicians dedicated to the artistry of premium woodwinds. Your journey toward musical excellence begins with a single step.
            </p>
          </div>
        </div>

        <div className="z-10 flex items-center gap-stack-md">
          <div className="flex -space-x-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden bg-surface-container">
              <Image
                className="w-full h-full object-cover"
                alt="Professional saxophonist holding vintage alto saxophone"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJhb2YFU951VZxRdfbKT4gRNfecMCxzFrjlE29HL6kXoy2a9fntlHb5ExMMIqXTj8b2Kn-Mf4Jknf6IV0urY3DaunwNPhI-DKsRhdFsOVm-HWd4pNKDKUskhz4Y77rlwkHZ2bN5iW-egpKmbYs99jntLQaqAxnVYWV2sqfqOVtYZBzyTRewzMqes_CHS7sIetxZhrRFLGC_VSYX3W6gkaFXjoRHh8aC6Wt-ivusWviVuswJauWFPw"
                width={48}
                height={48}
                unoptimized
              />
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden bg-surface-container">
              <Image
                className="w-full h-full object-cover"
                alt="Musician practicing tenor saxophone"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiHnTCMcAi6RaKeEWXmf_4B-OyACe7dO67Pw-44kUiSUBcMXTx-BFZ-JBJMgCaUL2dscBHEy1sLSnDZPfSTuBtTjFY2upYG_qWAwA9vZ1iVcuZft0bfik35cjh6LuM8tJ0DerxCR0kFA_HIvUp9dG-uVQyJXueNJzm-ANmEppKUydAvDKw3H7lCn5Vaml83_HVdUMloJ6bkpxOQZR2hn9v1DfJf4R8UZx0lm43pQS-aAJpibgfzeI"
                width={48}
                height={48}
                unoptimized
              />
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden bg-surface-container">
              <Image
                className="w-full h-full object-cover"
                alt="Elegant soprano saxophone rehearsal"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgfgNE-AN2lfHgwbPhQlMdOm5ee-B1gBFgaajNATeCICl64Gi61m2AMXQepIqn9-2DVnmZ5aNq6dD6rb81tZHjRhKJWHW2w6f1DYNyVnrHM6EYfGx3fmR4OXGa-Wd1H7I5HC41nWByko1Ye1kyD02NL6VyDkys9KQ-QdRGPzzHMO1Bgq_zftmTdx6ltJ02oRFTnVGyCmSsEqTHAy3apz8xj9yAHlCickwNnjjSEehcujGLKrYb6gE"
                width={48}
                height={48}
                unoptimized
              />
            </div>
          </div>
          <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary-fixed/60">
            Trusted by 500+ Virtuosos
          </p>
        </div>

        {/* Background Atmosphere */}
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <Image
            className="w-full h-full object-cover mix-blend-overlay"
            alt="Gold saxophone abstract closeup"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuChWBCBo_hhAjN1hxulC5zYoWLX8bBAuHeRgkCZH94oG3fWdO4uIFFuoCGKkolxGLR3mxuHo8EcWSJaXFa9nMewIF3mtjV9hpyOaCBWFTv4qFhqqlXKDGVEyGdXNodunNLaJYG0DpQESFIVJ0MHFnw16_F60YbQtEcTtrmPZTPXI6XQDRPvJyMKJ_jJ6IKyiBPP2E_HuTxjjf9IEIuGgfP3rqvmi6EH9wcV1WOQQnVcz9EjcwNRXMo"
            fill
            unoptimized
          />
        </div>
      </div>

      {step === "REGISTER" ? (
        /* Form Side (Register Step) */
        <div className="w-full md:w-1/2 bg-surface flex items-center justify-center p-6 md:p-container-margin overflow-y-auto">
          <div className="w-full max-w-md py-12">
            {/* Mobile Logo */}
            <div className="md:hidden mb-8 text-center">
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold">
                Nhóm TTTN Music
              </h2>
            </div>

            <div className="mb-10 text-center md:text-left">
              <h2 className="font-headline-lg text-headline-lg text-primary mb-2">
                Đăng Ký Tài Khoản
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Khám phá bộ sưu tập nhạc cụ cao cấp và dịch vụ chuyên nghiệp của chúng tôi.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm text-primary/80 uppercase" htmlFor="full-name">
                  Họ và tên
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-gold-muted transition-colors">
                    person
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-white border border-border-subtle rounded-lg font-body-md focus:outline-none form-input-focus transition-all placeholder:text-outline-variant"
                    id="full-name"
                    placeholder="Nguyễn Văn A"
                    type="text"
                    required
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm text-primary/80 uppercase" htmlFor="email">
                  Email
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-gold-muted transition-colors">
                    mail
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-white border border-border-subtle rounded-lg font-body-md focus:outline-none form-input-focus transition-all placeholder:text-outline-variant"
                    id="email"
                    placeholder="example@tttn.music"
                    type="email"
                    required
                    value={user.email}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm text-primary/80 uppercase" htmlFor="phone">
                  Số điện thoại
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-gold-muted transition-colors">
                    call
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-white border border-border-subtle rounded-lg font-body-md focus:outline-none form-input-focus transition-all placeholder:text-outline-variant"
                    id="phone"
                    placeholder="090 123 4567"
                    type="tel"
                    value={user.phone}
                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm text-primary/80 uppercase" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-gold-muted transition-colors">
                    lock
                  </span>
                  <input
                    className="w-full pl-10 pr-12 py-3 bg-white border border-border-subtle rounded-lg font-body-md focus:outline-none form-input-focus transition-all placeholder:text-outline-variant"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    required
                    value={user.password}
                    onChange={(e) => setUser({ ...user, password: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors cursor-pointer"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm text-primary/80 uppercase" htmlFor="confirmPassword">
                  Nhập lại mật khẩu
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-gold-muted transition-colors">
                    lock
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-white border border-border-subtle rounded-lg font-body-md focus:outline-none form-input-focus transition-all placeholder:text-outline-variant"
                    id="confirmPassword"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    required
                    value={user.confirmPassword}
                    onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Agreement */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  className="mt-1 w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer"
                  id="terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={isSubmitting}
                />
                <label className="font-body-md text-body-md text-on-surface-variant select-none cursor-pointer" htmlFor="terms">
                  Tôi đồng ý với{" "}
                  <a className="text-gold-muted hover:underline font-semibold" href="#">
                    Điều khoản & Chính sách
                  </a>{" "}
                  của Aureate Forest Boutique.
                </label>
              </div>

              {/* Submit Button */}
              <button
                className="w-full bg-secondary text-on-secondary font-label-sm text-label-sm uppercase tracking-[0.2em] py-4 rounded-lg hover:bg-gold-muted active:scale-[0.98] transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xử lý..." : "Đăng Ký"}
              </button>
            </form>

            {/* Social Login Separator */}
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface text-on-surface-variant font-label-sm">
                  Hoặc đăng ký bằng
                </span>
              </div>
            </div>

            {/* Social Options */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 border border-border-subtle rounded-lg hover:bg-surface-container-low transition-colors group cursor-pointer"
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="font-label-sm text-on-surface">Google</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 border border-border-subtle rounded-lg hover:bg-surface-container-low transition-colors group cursor-pointer"
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="font-label-sm text-on-surface">Facebook</span>
              </button>
            </div>

            {/* Redirect to Login */}
            <div className="mt-10 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Đã có tài khoản?{" "}
                <Link
                  className="text-primary font-bold hover:text-gold-muted transition-colors underline decoration-border-subtle underline-offset-4"
                  href="/login"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Form Side (OTP Step) */
        <div className="w-full md:w-1/2 bg-surface flex items-center justify-center p-6 md:p-container-margin overflow-y-auto">
          <div className="w-full max-w-md py-12">
            {/* Mobile Logo */}
            <div className="md:hidden mb-8 text-center">
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold">
                Nhóm TTTN Music
              </h2>
            </div>

            <div className="mb-10 text-center md:text-left">
              <h2 className="font-headline-lg text-headline-lg text-primary mb-2">
                Xác Nhận Tài Khoản
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Vui lòng nhập mã xác nhận (OTP) đã được gửi đến email <b>{user.email}</b>
              </p>
            </div>

            <form onSubmit={handleConfirmCode} className="space-y-6">
              {/* OTP Input */}
              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm text-primary/80 uppercase" htmlFor="otp">
                  Mã xác nhận (OTP)
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-gold-muted transition-colors">
                    lock_open
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-white border border-border-subtle rounded-lg font-body-md focus:outline-none form-input-focus transition-all text-center font-bold tracking-[0.2em] text-lg"
                    id="otp"
                    placeholder="123456"
                    type="text"
                    required
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                className="w-full bg-secondary text-on-secondary font-label-sm text-label-sm uppercase tracking-[0.2em] py-4 rounded-lg hover:bg-gold-muted active:scale-[0.98] transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xác thực..." : "Xác Nhận OTP"}
              </button>

              {/* Back to Register Button */}
              <button
                type="button"
                className="w-full py-4 border border-primary text-primary font-label-sm text-label-sm uppercase tracking-[0.2em] rounded-lg hover:bg-surface-container-low transition-all active:scale-[0.98] cursor-pointer"
                onClick={() => setStep("REGISTER")}
                disabled={isSubmitting}
              >
                Quay lại
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}