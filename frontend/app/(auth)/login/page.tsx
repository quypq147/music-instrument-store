"use client";

import { Amplify } from "aws-amplify";
import { isOAuthConfigured } from "../../components/common/AmplifyConfig";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { signIn, fetchAuthSession, signInWithRedirect } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useToast } from "../../context/ToastContext";
import { Eye, EyeOff, Lock, ArrowRight, Music, Sun, Moon } from "lucide-react";
import { applyRememberMePreference, rememberOAuthAttempt } from "../../lib/authStorage";
import { getOrCreateDeviceId } from "../../lib/deviceId";

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
 
export default function Login() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleOAuth = async (provider: 'Google' | 'Facebook') => {
    try {
      rememberOAuthAttempt(provider);
      await signInWithRedirect({ provider });
    } catch (error) {
      console.error(`OAuth error (${provider}):`, error);
      showToast(`Đăng nhập bằng ${provider} hiện chưa khả dụng (Chưa cấu hình OAuth). Vui lòng sử dụng email.`, "warning");
    }
  };

  // Dịch lỗi Cognito sang thông điệp hành động được — đặc biệt hướng dẫn user từng đăng
  // ký bằng Google/Facebook (tài khoản có sẵn nhưng chưa tự đặt mật khẩu email bao giờ).
  const translateSignInError = (err: { name?: string; message?: string }): string => {
    switch (err.name) {
      case "UserNotFoundException":
        return "Không tìm thấy tài khoản với email này. Nếu bạn từng đăng nhập bằng Google/Facebook, hãy dùng nút bên dưới; hoặc bấm \"Đăng ký ngay\" để tạo tài khoản mới.";
      case "NotAuthorizedException":
        return "Email hoặc mật khẩu không đúng. Nếu tài khoản được tạo bằng Google/Facebook, hãy đăng nhập bằng nút tương ứng, hoặc bấm \"Quên mật khẩu?\" để tự đặt mật khẩu cho email này.";
      case "UserNotConfirmedException":
        return "Tài khoản chưa xác nhận email. Vui lòng kiểm tra hộp thư để lấy mã xác nhận.";
      case "PasswordResetRequiredException":
        return "Tài khoản cần đặt lại mật khẩu. Vui lòng dùng chức năng \"Quên mật khẩu?\".";
      default:
        return err.message || "Tên đăng nhập hoặc mật khẩu không đúng!";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Vui lòng nhập email và mật khẩu!", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      applyRememberMePreference(rememberMe);
      await signIn({
        username: email,
        password: password,
      });

      let isAdminOrStaff = false;
      let token = "";
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload["cognito:groups"] as string[] | undefined;
        isAdminOrStaff = !!(groups && (groups.includes("Admin") || groups.includes("Staff")));
        token = session.tokens?.idToken?.toString() || "";
      } catch (sessionError) {
        console.warn("Could not fetch session in login redirect:", sessionError);
      }

      const redirectTarget = isAdminOrStaff ? "/admin" : "/";

      if (token && !isAdminOrStaff) {
        try {
          const deviceId = getOrCreateDeviceId();
          const checkRes = await fetch("/api/auth/device/check", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ deviceId }),
          });
          const checkData = await checkRes.json();

          if (checkRes.ok && checkData.trusted === false) {
            router.push(`/verify-device?redirect=${encodeURIComponent(redirectTarget)}`);
            return;
          }
        } catch (deviceCheckError) {
          // Nếu bước kiểm tra thiết bị lỗi (vd. mạng chập chờn), không chặn đăng nhập —
          // đây là lớp bảo vệ bổ sung, không phải điều kiện bắt buộc để vào được app.
          console.warn("Device check failed, proceeding without it:", deviceCheckError);
        }
      }

      showToast("Đăng nhập thành công!", "success");
      router.refresh();
      window.location.href = redirectTarget;
    } catch (err) {
      showToast(translateSignInError(err as Error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className={`min-h-screen transition-colors duration-500 flex flex-col items-center justify-start p-4 pt-8 md:pt-8 md:pb-8 md:px-8 font-sans relative ${theme === "dark" ? "dark bg-[#02140f]" : "bg-surface-cream"}`}
      style={{
        backgroundImage: theme === "dark"
          ? 'radial-gradient(circle at 10% 10%, rgba(217, 119, 6, 0.04) 0%, transparent 45%), radial-gradient(circle at 90% 90%, rgba(6, 78, 59, 0.12) 0%, transparent 55%)'
          : 'radial-gradient(circle at 10% 10%, rgba(217, 119, 6, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(0, 53, 39, 0.08) 0%, transparent 50%)',
      }}
    >
      
      {/* Floating Music Symbols - Decorative */}
      <div className="absolute top-12 right-12 opacity-10 dark:opacity-20 animate-float-slow hidden md:block text-primary dark:text-[#80bea6]">
        <Music className="w-12 h-12" />
      </div>
      <div className="absolute bottom-12 left-12 opacity-10 dark:opacity-20 animate-float-slow hidden md:block text-primary dark:text-[#80bea6]" style={{ animationDelay: "3s" }}>
        <Music className="w-16 h-16" />
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        type="button"
        className="absolute top-6 right-6 p-3 bg-white dark:bg-[#06261d] text-primary dark:text-[#80bea6] rounded-md border border-border-subtle dark:border-primary-container/30 hover:border-secondary dark:hover:border-secondary hover:text-secondary dark:hover:text-secondary transition-all shadow-sm cursor-pointer z-50 focus:outline-none flex items-center justify-center"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="w-5 h-5 text-secondary dark:text-[#fe932c] animate-pulse" /> : <Moon className="w-5 h-5" />}
      </button>
      
      {/* MAIN LOGIN CARD */}
      <div className="w-full max-w-[1100px] min-h-0 md:min-h-[620px] bg-white dark:bg-[#06261d] rounded-md border border-border-subtle dark:border-primary-container/20 shadow-[0_15px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* LEFT PANEL: Branding & Image */}
        <div className="w-full md:w-[42%] bg-primary dark:bg-[#002117] relative flex flex-col justify-between p-6 md:p-12 overflow-hidden min-h-[140px] md:min-h-0">

          {/* Top Decorative Line & Logo */}
          <div className="relative z-20 flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-2 md:mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="#D97706"/>
                <circle cx="12" cy="12" r="4" fill="#D97706"/>
              </svg>
              <span className="font-serif text-xl font-bold tracking-widest text-white uppercase">AUREATE FOREST</span>
            </div>

            <div className="w-8 h-[1px] bg-secondary dark:bg-secondary-container mb-2 md:mb-4"></div>

            <p className="text-secondary dark:text-secondary-container text-sm tracking-wider font-medium font-serif italic">
              Âm nhạc kết nối đam mê
            </p>
          </div>

          {/* Bottom Branding info */}
          <div className="hidden md:block relative z-20 text-center md:text-left mt-auto">
            <h2 className="font-serif text-2xl text-white dark:text-emerald-50 font-semibold leading-tight mb-2">
              Sự chính xác trong từng tần số âm thanh.
            </h2>
            <p className="text-white/60 dark:text-emerald-100/60 text-xs tracking-wide">
              Khám phá các dòng saxophone phiên bản giới hạn chế tác thủ công.
            </p>
          </div>

          {/* Instrument Image Background */}
          <div className="absolute inset-0 w-full h-full z-10">
            <div className="absolute inset-0 bg-linear-to-t from-primary dark:from-[#002117] via-primary/80 dark:via-[#002117]/85 to-primary/40 dark:to-[#002117]/40 z-10"></div>
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
        <div className="w-full md:w-[58%] p-6 md:py-6 md:px-16 lg:py-8 lg:px-24 flex flex-col justify-center">
          <div className="mb-5 md:mb-5">
            <span className="text-[10px] font-bold text-secondary dark:text-[#fe932c] uppercase tracking-[0.2em] mb-2 block">
              Chào mừng bạn trở lại
            </span>
            <h1 className="font-serif text-3xl md:text-4xl text-primary dark:text-white font-bold mb-3">
              Đăng Nhập
            </h1>
            <p className="text-gray-500 dark:text-emerald-100/60 text-sm leading-relaxed">
              Truy cập tài khoản Aureate Forest Boutique để tiếp tục hành trình âm nhạc của bạn.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-[10px] font-bold text-primary dark:text-[#80bea6] uppercase tracking-[0.15em] block mb-2" htmlFor="email">
                Email
              </label>
              <input
                className="w-full py-3 px-4 bg-white dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 rounded-sm text-sm text-[#1F2937] dark:text-emerald-50 transition-all focus:outline-none focus:border-secondary dark:focus:border-secondary focus:ring-1 focus:ring-secondary disabled:opacity-60 placeholder:text-gray-400 dark:placeholder:text-emerald-900/60"
                id="email"
                placeholder="email@example.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-primary dark:text-[#80bea6] uppercase tracking-[0.15em] block" htmlFor="password">
                  Mật khẩu
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-secondary dark:text-[#fe932c] hover:text-gold-muted dark:hover:text-amber-400 transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  className="w-full py-3 px-4 bg-white dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 rounded-sm text-sm text-[#1F2937] dark:text-emerald-50 tracking-wide transition-all focus:outline-none focus:border-secondary dark:focus:border-secondary focus:ring-1 focus:ring-secondary pr-12 disabled:opacity-60 placeholder:text-gray-400 dark:placeholder:text-emerald-900/60"
                  id="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Remember Me */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
                className="w-4 h-4 accent-primary dark:accent-[#80bea6] border-border-subtle dark:border-emerald-900/40 rounded-sm cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="text-xs text-gray-600 dark:text-emerald-200/80 cursor-pointer select-none font-medium"
              >
                Ghi nhớ đăng nhập
              </label>
            </div>

            {/* Submit Button */}
            <button
              className="w-full bg-primary dark:bg-[#064e3b] hover:bg-primary-container dark:hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-[0.15em] py-4 rounded-sm flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer shadow-sm disabled:opacity-75 disabled:cursor-not-allowed border-none shimmer-button"
              type="submit"
              disabled={isSubmitting}
            >
              <Lock className="w-3.5 h-3.5" />
              {isSubmitting ? "Đang xử lý..." : "Đăng Nhập"}
            </button>
          </form>

          {/* Social Separator + Social Options — chỉ hiện khi Cognito Hosted UI domain đã được cấu hình,
              tránh hiện nút rồi báo lỗi "Chưa cấu hình OAuth" sau khi người dùng bấm. */}
          {isOAuthConfigured && (
            <>
              <div className="relative my-5 md:my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-subtle dark:border-emerald-900/40"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-[#06261d] px-3 text-gray-400 dark:text-emerald-200/40 text-[10px] tracking-widest font-bold">
                    Hoặc đăng nhập bằng
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 rounded-sm cursor-pointer transition-all hover:bg-surface-cream dark:hover:bg-[#083327] hover:-translate-y-0.5 hover:shadow-sm text-xs font-semibold text-gray-700 dark:text-emerald-100/90 w-full"
                  disabled={isSubmitting}
                  onClick={() => handleOAuth('Google')}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 rounded-sm cursor-pointer transition-all hover:bg-surface-cream dark:hover:bg-[#083327] hover:-translate-y-0.5 hover:shadow-sm text-xs font-semibold text-gray-700 dark:text-emerald-100/90 w-full"
                  disabled={isSubmitting}
                  onClick={() => handleOAuth('Facebook')}
                >
                  <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>
            </>
          )}

          {/* Register Link */}
          <div className="mt-6 md:mt-5 text-center flex items-center justify-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-emerald-200/50">Bạn chưa có tài khoản?</span>
            <Link href="/register" className="text-secondary dark:text-[#fe932c] hover:text-gold-muted dark:hover:text-amber-400 font-bold transition-colors flex items-center gap-1">
              Đăng ký ngay
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="mt-4 md:mt-6 flex items-center justify-center gap-2 text-gray-300 dark:text-emerald-900/30">
            <Music className="w-3 h-3 text-secondary dark:text-[#fe932c]" />
            <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-gray-400 dark:text-emerald-200/30">NHÓM TTTN MUSIC</span>
          </div>

        </div>
      </div>

      <p className="mt-3 md:mt-4 text-gray-400 dark:text-emerald-900/40 text-xs z-10 relative">
        © 2026 Nhóm TTTN Music. All rights reserved.
      </p>
    </main>
  );
}