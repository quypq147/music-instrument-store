"use client";

import { Amplify } from "aws-amplify";
import "../../components/common/AmplifyConfig";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { resetPassword, confirmResetPassword } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useToast } from "../../context/ToastContext";
import { Eye, EyeOff, KeyRound, ArrowLeft, Music, Sun, Moon } from "lucide-react";

// Fallback configuration if not initialized in the module scope
if (!Amplify.getConfig().Auth?.Cognito) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
      },
    },
  });
}

type Step = "request" | "confirm";

export default function ForgotPassword() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedTheme = localStorage.getItem("auth-theme") as "light" | "dark" | null;
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("auth-theme", newTheme);
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast("Vui lòng nhập email!", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword({ username: email });
      showToast("Mã xác nhận đã được gửi tới email của bạn!", "success");
      setStep("confirm");
    } catch (err) {
      const error = err as Error;
      showToast(error.message || "Không thể gửi mã xác nhận. Vui lòng thử lại!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !newPassword || !confirmPassword) {
      showToast("Vui lòng nhập đầy đủ thông tin!", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
      showToast("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.", "success");
      router.push("/login");
    } catch (err) {
      const error = err as Error;
      showToast(error.message || "Mã xác nhận không đúng hoặc đã hết hạn!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className={`min-h-screen transition-colors duration-500 flex flex-col items-center justify-start p-4 pt-8 md:pt-12 md:pb-12 md:px-8 font-sans relative ${theme === "dark" ? "dark bg-[#02140f]" : "bg-surface-cream"}`}
      style={{
        backgroundImage: theme === "dark"
          ? 'radial-gradient(circle at 10% 10%, rgba(217, 119, 6, 0.04) 0%, transparent 45%), radial-gradient(circle at 90% 90%, rgba(6, 78, 59, 0.12) 0%, transparent 55%)'
          : 'radial-gradient(circle at 10% 10%, rgba(217, 119, 6, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(0, 53, 39, 0.08) 0%, transparent 50%)',
      }}
    >
      <div className="absolute top-12 right-12 opacity-10 dark:opacity-20 animate-float-slow hidden md:block text-primary dark:text-[#80bea6]">
        <Music className="w-12 h-12" />
      </div>
      <div className="absolute bottom-12 left-12 opacity-10 dark:opacity-20 animate-float-slow hidden md:block text-primary dark:text-[#80bea6]" style={{ animationDelay: "3s" }}>
        <Music className="w-16 h-16" />
      </div>

      <button
        onClick={toggleTheme}
        type="button"
        className="absolute top-6 right-6 p-3 bg-white dark:bg-[#06261d] text-primary dark:text-[#80bea6] rounded-md border border-border-subtle dark:border-primary-container/30 hover:border-secondary dark:hover:border-secondary hover:text-secondary dark:hover:text-secondary transition-all shadow-sm cursor-pointer z-50 focus:outline-none flex items-center justify-center"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="w-5 h-5 text-secondary dark:text-[#fe932c] animate-pulse" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-275 min-h-0 md:min-h-140 bg-white dark:bg-[#06261d] rounded-md border border-border-subtle dark:border-primary-container/20 shadow-[0_15px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex flex-col md:flex-row overflow-hidden relative z-10">

        {/* LEFT PANEL: Branding & Image */}
        <div className="w-full md:w-[42%] bg-primary-container dark:bg-[#003527] relative flex flex-col justify-between p-6 md:p-12 overflow-hidden min-h-35 md:min-h-0">
          <div className="relative z-20 flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-2 md:mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="#D97706"/>
                <circle cx="12" cy="12" r="4" fill="#D97706"/>
              </svg>
              <span className="font-serif text-xl font-bold tracking-widest text-white uppercase">AUREATE FOREST</span>
            </div>
            <div className="w-8 h-px bg-secondary-container dark:bg-[#d97706] mb-2 md:mb-4"></div>
            <p className="text-secondary-container dark:text-[#d97706] text-sm tracking-wider font-medium font-serif italic">
              Khôi phục quyền truy cập tài khoản
            </p>
          </div>

          <div className="hidden md:block relative z-20 text-center md:text-left mt-auto">
            <h2 className="font-serif text-2xl text-white font-semibold leading-tight mb-2">
              Đừng lo, chuyện này vẫn thường xảy ra.
            </h2>
            <p className="text-white/60 text-xs tracking-wide">
              Chúng tôi sẽ gửi mã xác nhận qua email để bạn đặt lại mật khẩu mới.
            </p>
          </div>

          <div className="absolute inset-0 w-full h-full z-10">
            <div className="absolute inset-0 bg-linear-to-t from-primary-container dark:from-[#003527] via-primary-container/80 dark:via-[#003527]/85 to-primary-container/40 dark:to-[#003527]/40 z-10"></div>
            <Image
              src="/images/hinh duoi trang chu.jpg"
              alt="Saxophone Background"
              fill
              className="animate-kenburns"
              style={{ objectFit: 'cover', opacity: 0.35, mixBlendMode: 'luminosity' }}
              unoptimized
            />
          </div>
        </div>

        {/* RIGHT PANEL: Form */}
        <div className="w-full md:w-[58%] p-6 md:py-12 md:px-16 lg:py-16 lg:px-24 flex flex-col justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-emerald-200/50 hover:text-secondary dark:hover:text-[#fe932c] transition-colors mb-6 w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại đăng nhập
          </Link>

          {step === "request" ? (
            <>
              <div className="mb-8">
                <span className="text-[10px] font-bold text-secondary dark:text-[#fe932c] uppercase tracking-[0.2em] mb-2 block">
                  Quên mật khẩu
                </span>
                <h1 className="font-serif text-3xl md:text-4xl text-primary dark:text-white font-bold mb-3">
                  Khôi Phục Mật Khẩu
                </h1>
                <p className="text-gray-500 dark:text-emerald-100/60 text-sm leading-relaxed">
                  Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác nhận để bạn đặt lại mật khẩu mới.
                </p>
              </div>

              <form onSubmit={handleRequestCode} className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-primary dark:text-[#80bea6] uppercase tracking-[0.15em] block mb-2" htmlFor="email">
                    Email
                  </label>
                  <input
                    className="w-full py-3 px-4 bg-white dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 rounded-sm text-sm text-[#1F2937] dark:text-emerald-50 transition-all focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary disabled:opacity-60 placeholder:text-gray-400 dark:placeholder:text-emerald-900/60"
                    id="email"
                    placeholder="email@example.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  className="w-full bg-primary dark:bg-[#064e3b] hover:bg-primary-container dark:hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-[0.15em] py-4 rounded-sm flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer shadow-sm disabled:opacity-75 disabled:cursor-not-allowed border-none"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {isSubmitting ? "Đang gửi mã..." : "Gửi Mã Xác Nhận"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <span className="text-[10px] font-bold text-secondary dark:text-[#fe932c] uppercase tracking-[0.2em] mb-2 block">
                  Bước 2/2
                </span>
                <h1 className="font-serif text-3xl md:text-4xl text-primary dark:text-white font-bold mb-3">
                  Đặt Mật Khẩu Mới
                </h1>
                <p className="text-gray-500 dark:text-emerald-100/60 text-sm leading-relaxed">
                  Nhập mã xác nhận vừa gửi tới <strong>{email}</strong> và mật khẩu mới của bạn.
                </p>
              </div>

              <form onSubmit={handleConfirmReset} className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-primary dark:text-[#80bea6] uppercase tracking-[0.15em] block mb-2" htmlFor="code">
                    Mã xác nhận
                  </label>
                  <input
                    className="w-full py-3 px-4 bg-white dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 rounded-sm text-sm text-[#1F2937] dark:text-emerald-50 tracking-widest transition-all focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary disabled:opacity-60 placeholder:text-gray-400 dark:placeholder:text-emerald-900/60"
                    id="code"
                    placeholder="123456"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-primary dark:text-[#80bea6] uppercase tracking-[0.15em] block mb-2" htmlFor="newPassword">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      className="w-full py-3 px-4 bg-white dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 rounded-sm text-sm text-[#1F2937] dark:text-emerald-50 tracking-wide transition-all focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary pr-12 disabled:opacity-60 placeholder:text-gray-400 dark:placeholder:text-emerald-900/60"
                      id="newPassword"
                      placeholder="••••••••"
                      required
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-emerald-700 hover:text-gray-600 dark:hover:text-emerald-500 transition-colors focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-primary dark:text-[#80bea6] uppercase tracking-[0.15em] block mb-2" htmlFor="confirmPassword">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    className="w-full py-3 px-4 bg-white dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 rounded-sm text-sm text-[#1F2937] dark:text-emerald-50 tracking-wide transition-all focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary disabled:opacity-60 placeholder:text-gray-400 dark:placeholder:text-emerald-900/60"
                    id="confirmPassword"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  className="w-full bg-primary dark:bg-[#064e3b] hover:bg-primary-container dark:hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-[0.15em] py-4 rounded-sm flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer shadow-sm disabled:opacity-75 disabled:cursor-not-allowed border-none"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {isSubmitting ? "Đang xử lý..." : "Đặt Lại Mật Khẩu"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="w-full text-center text-xs font-semibold text-gray-500 dark:text-emerald-200/50 hover:text-secondary dark:hover:text-[#fe932c] transition-colors py-2"
                  disabled={isSubmitting}
                >
                  Chưa nhận được mã? Gửi lại
                </button>
              </form>
            </>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-gray-300 dark:text-emerald-900/30">
            <Music className="w-3 h-3 text-secondary dark:text-[#fe932c]" />
            <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-gray-400 dark:text-emerald-200/30">NHÓM TTTN MUSIC</span>
          </div>
        </div>
      </div>

      <p className="mt-6 text-gray-400 dark:text-emerald-900/40 text-xs z-10 relative">
        © 2026 Nhóm TTTN Music. All rights reserved.
      </p>
    </main>
  );
}
