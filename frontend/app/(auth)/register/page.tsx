"use client";

import { isOAuthConfigured } from "../../components/common/AmplifyConfig";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signUp, confirmSignUp, signInWithRedirect } from "aws-amplify/auth";
import { useToast } from "../../context/ToastContext";
import { rememberOAuthAttempt } from "../../lib/authStorage";
import { User, Mail, Phone, Lock, KeyRound, Eye, EyeOff, Music, Sun, Moon } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<"REGISTER" | "CONFIRM_CODE">("REGISTER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));

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

  const handleOtpChange = (val: string, index: number) => {
    // Only accept numbers
    if (val !== "" && isNaN(Number(val))) return;
    
    // Take only the last character entered
    const lastChar = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = lastChar;
    setOtp(newOtp);
    
    const combinedCode = newOtp.join("");
    setConfirmationCode(combinedCode);

    // Auto-focus next input field
    if (lastChar !== "" && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          const newOtp = [...otp];
          newOtp[index - 1] = "";
          setOtp(newOtp);
          setConfirmationCode(newOtp.join(""));
        }
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      setConfirmationCode(pastedData);
      
      // Focus on the last input field
      const lastInput = document.getElementById("otp-5");
      if (lastInput) lastInput.focus();
    }
  };

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleOAuth = async (provider: 'Google' | 'Facebook') => {
    try {
      rememberOAuthAttempt(provider);
      await signInWithRedirect({ provider });
    } catch (error) {
      console.error(`OAuth error (${provider}):`, error);
      showToast(`Đăng nhập bằng ${provider} hiện chưa khả dụng (Chưa cấu hình OAuth). Vui lòng sử dụng email.`, "warning");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user.name || !user.email || !user.password || !user.confirmPassword) {
      showToast("Vui lòng nhập đầy đủ thông tin!", "warning");
      return;
    }

    if (user.password !== user.confirmPassword) {
      showToast("Mật khẩu nhập lại không khớp!", "warning");
      return;
    }

    if (!agreeTerms) {
      showToast("Vui lòng đồng ý với Điều khoản & Chính sách!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
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
        showToast("Mã xác nhận (OTP) đã được gửi đến email của bạn. Vui lòng kiểm tra!", "success");
      } else if (isSignUpComplete) {
        showToast("Đăng ký thành công!", "success");
        router.push("/login");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Sign up error:", error);
      showToast(error.message || "Không thể đăng ký. Vui lòng thử lại!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmationCode) {
      showToast("Vui lòng nhập mã xác nhận!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmSignUp({
        username: user.email,
        confirmationCode: confirmationCode,
      });

      showToast("Xác nhận tài khoản thành công! Bạn có thể đăng nhập.", "success");
      router.push("/login");
    } catch (err) {
      const error = err as Error;
      console.error("Confirmation error:", error);
      showToast(error.message || "Mã xác nhận không chính xác. Vui lòng thử lại!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className={`min-h-screen transition-colors duration-500 flex flex-col items-center justify-start p-4 pt-6 md:pt-6 md:pb-6 md:px-8 font-sans relative ${theme === "dark" ? "dark bg-[#02140f]" : "bg-surface-cream"}`}
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

      {/* MAIN REGISTER CARD */}
      <div className="w-full max-w-[1100px] min-h-0 md:min-h-[650px] bg-white dark:bg-[#06261d] rounded-md border border-border-subtle dark:border-primary-container/20 shadow-[0_15px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex flex-col md:flex-row overflow-hidden relative z-10">
        
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
              Chế tác cho tâm hồn của âm thanh.
            </h2>
            <p className="text-white/60 dark:text-emerald-100/60 text-xs tracking-wide">
              Tham gia cộng đồng đặc quyền dành riêng cho nghệ thuật gió gỗ cao cấp.
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
        <div className="w-full md:w-[58%] p-6 md:py-8 md:px-12 lg:px-16 flex flex-col justify-center">
          {step === "REGISTER" ? (
            <>
              <div className="mb-4 md:mb-4">
                <span className="text-[10px] font-bold text-secondary dark:text-[#fe932c] uppercase tracking-[0.2em] mb-1.5 block">
                  Đăng ký tài khoản
                </span>
                <h1 className="font-serif text-2xl md:text-3xl text-primary dark:text-white font-bold mb-2">
                  Tạo Tài Khoản Mới
                </h1>
                <p className="text-gray-500 dark:text-emerald-100/60 text-xs leading-relaxed">
                  Khám phá bộ sưu tập nhạc cụ cao cấp và dịch vụ chuyên nghiệp của chúng tôi.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3 md:space-y-4">
                {/* Full name + Phone (gộp 1 hàng từ sm: trở lên để giảm chiều cao form) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-primary dark:text-[#80bea6] uppercase tracking-[0.15em] block mb-1" htmlFor="full-name">
                      Họ và tên
                    </label>
                    <div className="relative flex items-center border border-border-subtle dark:border-emerald-900/40 rounded-sm bg-white dark:bg-[#031d16] focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all">
                      <div className="pl-3.5 text-gray-400 dark:text-emerald-700">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        className="flex-1 py-2.5 px-3 bg-transparent text-sm text-[#1F2937] dark:text-emerald-50 outline-none placeholder:text-gray-400 dark:placeholder:text-emerald-900/60 disabled:opacity-60"
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

                  <div>
                    <label className="text-[10px] font-bold text-primary dark:text-[#80bea6] uppercase tracking-[0.15em] block mb-1" htmlFor="phone">
                      Số điện thoại
                    </label>
                    <div className="relative flex items-center border border-border-subtle dark:border-emerald-900/40 rounded-sm bg-white dark:bg-[#031d16] focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all">
                      <div className="pl-3.5 text-gray-400 dark:text-emerald-700">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        className="flex-1 py-2.5 px-3 bg-transparent text-sm text-[#1F2937] dark:text-emerald-50 outline-none placeholder:text-gray-400 dark:placeholder:text-emerald-900/60 disabled:opacity-60"
                        id="phone"
                        placeholder="090 123 4567"
                        type="tel"
                        value={user.phone}
                        onChange={(e) => setUser({ ...user, phone: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-[10px] font-bold text-primary dark:text-[#80bea6] uppercase tracking-[0.15em] block mb-1" htmlFor="email">
                    Email
                  </label>
                  <div className="relative flex items-center border border-border-subtle dark:border-emerald-900/40 rounded-sm bg-white dark:bg-[#031d16] focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all">
                    <div className="pl-3.5 text-gray-400 dark:text-emerald-700">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      className="flex-1 py-2.5 px-3 bg-transparent text-sm text-[#1F2937] dark:text-emerald-50 outline-none placeholder:text-gray-400 dark:placeholder:text-emerald-900/60 disabled:opacity-60"
                      id="email"
                      placeholder="tran.thien1830@gmail.com"
                      type="email"
                      required
                      value={user.email}
                      onChange={(e) => setUser({ ...user, email: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Password + Confirm Password (gộp 1 hàng từ sm: trở lên) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-primary dark:text-[#80bea6] uppercase tracking-[0.15em] block mb-1" htmlFor="password">
                      Mật khẩu
                    </label>
                    <div className="relative flex items-center border border-border-subtle dark:border-emerald-900/40 rounded-sm bg-white dark:bg-[#031d16] focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all">
                      <div className="pl-3.5 text-gray-400 dark:text-emerald-700">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        className="flex-1 py-2.5 px-3 bg-transparent text-sm text-[#1F2937] dark:text-emerald-50 outline-none placeholder:text-gray-400 dark:placeholder:text-emerald-900/60 pr-10 disabled:opacity-60"
                        id="password"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        required
                        value={user.password}
                        onChange={(e) => setUser({ ...user, password: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-emerald-700 hover:text-gray-600 dark:hover:text-emerald-500 focus:outline-none cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-primary dark:text-[#80bea6] uppercase tracking-[0.15em] block mb-1" htmlFor="confirmPassword">
                      Nhập lại mật khẩu
                    </label>
                    <div className="relative flex items-center border border-border-subtle dark:border-emerald-900/40 rounded-sm bg-white dark:bg-[#031d16] focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all">
                      <div className="pl-3.5 text-gray-400 dark:text-emerald-700">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        className="flex-1 py-2.5 px-3 bg-transparent text-sm text-[#1F2937] dark:text-emerald-50 outline-none placeholder:text-gray-400 dark:placeholder:text-emerald-900/60 pr-10 disabled:opacity-60"
                        id="confirmPassword"
                        placeholder="••••••••"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={user.confirmPassword}
                        onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-emerald-700 hover:text-gray-600 dark:hover:text-emerald-500 focus:outline-none cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Terms and conditions */}
                <div className="flex items-start gap-2.5 pt-1.5">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary dark:accent-[#80bea6] border-border-subtle dark:border-emerald-900/40 rounded-sm cursor-pointer"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="terms" className="text-xs text-gray-600 dark:text-emerald-200/80 leading-normal cursor-pointer select-none">
                    Tôi đồng ý với <span className="font-bold text-primary dark:text-[#80bea6]">Điều khoản & Chính sách</span> của Aureate Forest Boutique.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-primary dark:bg-[#064e3b] hover:bg-primary-container dark:hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-[0.15em] py-4 rounded-sm mt-3 transition-all cursor-pointer shadow-sm disabled:opacity-75 disabled:cursor-not-allowed border-none shimmer-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang xử lý..." : "Đăng Ký"}
                </button>
              </form>

              {/* Social Login Separator + Social Options — chỉ hiện khi Cognito Hosted UI domain đã
                  được cấu hình, tránh hiện nút rồi báo lỗi "Chưa cấu hình OAuth" sau khi bấm. */}
              {isOAuthConfigured && (
                <>
                  <div className="relative my-4 md:my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border-subtle dark:border-emerald-900/40"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-[#06261d] px-3 text-gray-400 dark:text-emerald-200/40 text-[10px] tracking-widest font-bold">
                        Hoặc đăng ký bằng
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleOAuth('Google')}
                      className="flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 rounded-sm cursor-pointer transition-all hover:bg-surface-cream dark:hover:bg-[#083327] hover:-translate-y-0.5 hover:shadow-sm text-xs font-semibold text-gray-700 dark:text-emerald-100/90 w-full"
                      disabled={isSubmitting}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                      </svg>
                      <span>Google</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuth('Facebook')}
                      className="flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 rounded-sm cursor-pointer transition-all hover:bg-surface-cream dark:hover:bg-[#083327] hover:-translate-y-0.5 hover:shadow-sm text-xs font-semibold text-gray-700 dark:text-emerald-100/90 w-full"
                      disabled={isSubmitting}
                    >
                      <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Facebook</span>
                    </button>
                  </div>
                </>
              )}

              {/* Login Page Redirect */}
              <div className="mt-4 md:mt-5 text-center flex items-center justify-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-emerald-200/50">Đã có tài khoản?</span>
                <Link href="/login" className="text-secondary dark:text-[#fe932c] hover:text-gold-muted dark:hover:text-amber-400 font-bold transition-colors">
                  Đăng nhập ngay
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-surface-cream dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 text-secondary dark:text-[#fe932c] mb-4">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-2xl text-primary dark:text-white font-bold mb-2">Xác Nhận Tài Khoản</h2>
              <p className="text-sm text-gray-500 dark:text-emerald-200/60 mb-8 max-w-sm mx-auto">
                Vui lòng nhập mã xác nhận (OTP) đã được gửi đến email <b className="text-primary dark:text-[#80bea6]">{user.email}</b>
              </p>

              <form onSubmit={handleConfirmCode} className="space-y-5 text-left max-w-sm mx-auto">
                <div>
                  <label className="block text-[10px] font-bold text-primary dark:text-[#80bea6] uppercase tracking-[0.15em] mb-3" htmlFor="otp-0">
                    Mã xác nhận (OTP)
                  </label>
                  
                  {/* 6-Digit OTP Block Input Component */}
                  <div className="flex justify-between gap-2 md:gap-3 mb-6" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        className="w-11 h-12 md:w-12 md:h-14 text-center text-lg font-bold bg-white dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 rounded-sm text-primary dark:text-emerald-50 focus:outline-none focus:border-secondary dark:focus:border-secondary focus:ring-1 focus:ring-secondary focus:scale-105 transition-all outline-none"
                        disabled={isSubmitting}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary dark:bg-[#064e3b] hover:bg-primary-container dark:hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-[0.15em] py-4 rounded-sm mt-6 transition-all cursor-pointer shadow-sm disabled:opacity-75 disabled:cursor-not-allowed border-none shimmer-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang xác thực..." : "Xác Nhận OTP"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("REGISTER")}
                  className="w-full py-3.5 border border-border-subtle dark:border-emerald-900/40 bg-white dark:bg-[#031d16] hover:bg-surface-cream dark:hover:bg-[#083327] text-gray-700 dark:text-emerald-100/90 font-bold uppercase tracking-widest text-xs rounded-sm transition-all cursor-pointer"
                  disabled={isSubmitting}
                >
                  Quay lại
                </button>
              </form>
            </div>
          )}

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