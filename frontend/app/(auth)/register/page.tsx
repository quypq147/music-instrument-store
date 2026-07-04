"use client";

import "../../components/common/AmplifyConfig";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp, confirmSignUp, signInWithRedirect } from "aws-amplify/auth";
import { useToast } from "../../context/ToastContext";
import { ShieldCheck, Users, Star, Music2, User, Mail, Phone, Lock, KeyRound, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const { showToast } = useToast();
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

  const handleOAuth = async (provider: 'Google' | 'Facebook') => {
    try {
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
    <main className="min-h-screen relative flex items-center justify-center lg:justify-between px-6 lg:px-24 py-12 overflow-hidden">

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hinh duoi trang chu.jpg"
          alt="Background"
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-linear-to-r from-[rgba(2,10,6,0.95)] via-[rgba(2,10,6,0.6)] to-[rgba(2,10,6,0.2)]" />
      </div>

      {/* Left Content */}
      <div className="relative z-10 hidden lg:flex flex-col justify-between h-full max-w-xl text-white py-10">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#DF9E47"><path d="M12 2L9 9H15L12 2Z"/><path d="M12 22C14 17 18 15 18 11C18 7.5 15.5 5 12 5C8.5 5 6 7.5 6 11C6 15 10 17 12 22Z"/></svg>
            <span className="font-serif text-3xl text-white tracking-widest uppercase font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Aureate Forest</span>
          </div>
          
          <h1 className="font-serif text-[5.5rem] leading-[1.1] mb-6" style={{ color: '#ffffff', textShadow: '0 4px 8px rgba(0,0,0,0.6)' }}>
            Crafting the<br/>Soul of <span className="italic text-[#DF9E47]">Sound.</span>
          </h1>
          
          <div className="w-16 h-0.5 bg-[#DF9E47] mb-6"></div>
          
          <p className="text-gray-300 text-xl leading-relaxed max-w-lg">
            Join an exclusive community of musicians dedicated to the artistry of premium woodwinds. Your journey toward musical excellence begins with a single step.
          </p>
        </div>

        <div className="flex gap-8 mt-20">
          <div className="flex flex-col items-center text-center max-w-30">
            <ShieldCheck className="mb-3" width="36" height="36" stroke="#DF9E47" strokeWidth="1.5" />
            <span className="text-xs font-bold tracking-widest text-[#DF9E47] uppercase mb-1">Premium Quality</span>
            <span className="text-[13px] text-gray-400">Nhạc cụ cao cấp chính hãng</span>
          </div>
          <div className="flex flex-col items-center text-center max-w-30">
            <Users className="mb-3" width="36" height="36" stroke="#DF9E47" strokeWidth="1.5" />
            <span className="text-xs font-bold tracking-widest text-[#DF9E47] uppercase mb-1">Exclusive Community</span>
            <span className="text-[13px] text-gray-400">Cộng đồng nghệ sĩ đam mê âm nhạc</span>
          </div>
          <div className="flex flex-col items-center text-center max-w-30">
            <Star className="mb-3" width="36" height="36" stroke="#DF9E47" strokeWidth="1.5" />
            <span className="text-xs font-bold tracking-widest text-[#DF9E47] uppercase mb-1">Expert Support</span>
            <span className="text-[13px] text-gray-400">Hỗ trợ chuyên nghiệp tận tâm</span>
          </div>
        </div>
      </div>

      {/* Right Form Card */}
      <div className="relative z-10 w-full max-w-120 rounded-[20px] border-2 border-[#DF9E47] bg-[rgba(250,247,242,0.95)] backdrop-blur-md shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] py-12 px-10">
        {step === "REGISTER" ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F3E5D0] mb-4">
                <Music2 width="24" height="24" color="#9B6B22" />
              </div>
              <h2 className="font-serif text-3xl text-[#002B1F] font-bold mb-2">Đăng Ký Tài Khoản</h2>
              <p className="text-sm text-gray-600">Khám phá bộ sưu tập nhạc cụ cao cấp và dịch vụ chuyên nghiệp của chúng tôi.</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-8 h-[1px] bg-[#DF9E47]"></div>
                <div className="w-2 h-2 rotate-45 bg-[#DF9E47]"></div>
                <div className="w-8 h-[1px] bg-[#DF9E47]"></div>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5" htmlFor="full-name">Họ và tên</label>
                <div className="flex items-center border border-[#DF9E47] rounded-md overflow-hidden bg-white">
                  <div className="bg-[#F3E5D0] text-[#9B6B22] px-4 py-3 flex items-center justify-center border-r border-[rgba(223,158,71,0.3)]">
                    <User width="18" height="18" />
                  </div>
                  <input className="flex-1 py-3 px-4 border-none outline-none text-[0.9rem] text-gray-700 w-full placeholder:text-gray-400" id="full-name" placeholder="Nguyễn Văn A" type="text" required value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} disabled={isSubmitting} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5" htmlFor="email">Email</label>
                <div className="flex items-center border border-[#DF9E47] rounded-md overflow-hidden bg-white">
                  <div className="bg-[#F3E5D0] text-[#9B6B22] px-4 py-3 flex items-center justify-center border-r border-[rgba(223,158,71,0.3)]">
                    <Mail width="18" height="18" />
                  </div>
                  <input className="flex-1 py-3 px-4 border-none outline-none text-[0.9rem] text-gray-700 w-full placeholder:text-gray-400" id="email" placeholder="tran.thien1830@gmail.com" type="email" required value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} disabled={isSubmitting} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5" htmlFor="phone">Số điện thoại</label>
                <div className="flex items-center border border-[#DF9E47] rounded-md overflow-hidden bg-white">
                  <div className="bg-[#F3E5D0] text-[#9B6B22] px-4 py-3 flex items-center justify-center border-r border-[rgba(223,158,71,0.3)]">
                    <Phone width="18" height="18" />
                  </div>
                  <input className="flex-1 py-3 px-4 border-none outline-none text-[0.9rem] text-gray-700 w-full placeholder:text-gray-400" id="phone" placeholder="090 123 4567" type="tel" value={user.phone} onChange={(e) => setUser({ ...user, phone: e.target.value })} disabled={isSubmitting} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5" htmlFor="password">Mật khẩu</label>
                <div className="flex items-center border border-[#DF9E47] rounded-md overflow-hidden bg-white relative">
                  <div className="bg-[#F3E5D0] text-[#9B6B22] px-4 py-3 flex items-center justify-center border-r border-[rgba(223,158,71,0.3)]">
                    <Lock width="18" height="18" />
                  </div>
                  <input className="flex-1 py-3 px-4 border-none outline-none text-[0.9rem] text-gray-700 w-full placeholder:text-gray-400 pr-10" id="password" placeholder="••••••••" type={showPassword ? "text" : "password"} required value={user.password} onChange={(e) => setUser({ ...user, password: e.target.value })} disabled={isSubmitting} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5" htmlFor="confirmPassword">Nhập lại mật khẩu</label>
                <div className="flex items-center border border-[#DF9E47] rounded-md overflow-hidden bg-white relative">
                  <div className="bg-[#F3E5D0] text-[#9B6B22] px-4 py-3 flex items-center justify-center border-r border-[rgba(223,158,71,0.3)]">
                    <Lock width="18" height="18" />
                  </div>
                  <input className="flex-1 py-3 px-4 border-none outline-none text-[0.9rem] text-gray-700 w-full placeholder:text-gray-400 pr-10" id="confirmPassword" placeholder="••••••••" type={showPassword ? "text" : "password"} required value={user.confirmPassword} onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })} disabled={isSubmitting} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2 pb-2">
                <input id="terms" type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-1" />
                <label htmlFor="terms" className="text-xs text-gray-700 leading-tight">
                  Tôi đồng ý với <b>Điều khoản & Chính sách</b> của Aureate Forest Boutique.
                </label>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-[#C58A3E] via-[#E6C280] to-[#C58A3E] bg-[length:200%_auto] text-white uppercase tracking-[2px] font-bold py-4 rounded-lg border-none cursor-pointer transition-all duration-500 shadow-[0_10px_20px_rgba(197,138,62,0.3)] hover:bg-right" disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Đăng Ký"}
              </button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-[1px] bg-gray-200"></div>
              <span className="text-xs text-gray-500 uppercase">Hoặc đăng ký bằng</span>
              <div className="flex-1 h-[1px] bg-gray-200"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => handleOAuth('Google')} className="flex items-center justify-center gap-2.5 p-2.5 bg-white border border-gray-200 rounded-lg text-[0.85rem] font-semibold text-gray-700 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-300">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button type="button" onClick={() => handleOAuth('Facebook')} className="flex items-center justify-center gap-2.5 p-2.5 bg-white border border-gray-200 rounded-lg text-[0.85rem] font-semibold text-gray-700 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-300">
                <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                Facebook
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản? <Link href="/login" className="text-[#9B6B22] font-bold hover:underline">Đăng nhập ngay</Link>
              </p>
            </div>
          </>
        ) : (
          <div className="text-center">
            <h2 className="font-serif text-3xl text-[#002B1F] font-bold mb-2">Xác Nhận Tài Khoản</h2>
            <p className="text-sm text-gray-600 mb-8">Vui lòng nhập mã xác nhận (OTP) đã được gửi đến email <b>{user.email}</b></p>

            <form onSubmit={handleConfirmCode} className="space-y-4">
              <div className="text-left">
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5" htmlFor="otp">Mã xác nhận (OTP)</label>
                <div className="flex items-center border border-[#DF9E47] rounded-md overflow-hidden bg-white">
                  <div className="bg-[#F3E5D0] text-[#9B6B22] px-4 py-3 flex items-center justify-center border-r border-[rgba(223,158,71,0.3)]">
                    <KeyRound width="18" height="18" />
                  </div>
                  <input className="flex-1 py-3 px-4 border-none outline-none text-[0.9rem] text-gray-700 w-full placeholder:text-gray-400 text-center font-bold tracking-widest text-lg" id="otp" placeholder="123456" type="text" required value={confirmationCode} onChange={(e) => setConfirmationCode(e.target.value)} disabled={isSubmitting} />
                </div>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-[#C58A3E] via-[#E6C280] to-[#C58A3E] bg-[length:200%_auto] text-white uppercase tracking-[2px] font-bold py-4 rounded-lg border-none cursor-pointer transition-all duration-500 shadow-[0_10px_20px_rgba(197,138,62,0.3)] hover:bg-right mt-6" disabled={isSubmitting}>
                {isSubmitting ? "Đang xác thực..." : "Xác Nhận OTP"}
              </button>

              <button type="button" onClick={() => setStep("REGISTER")} className="w-full py-4 mt-4 border border-[#C58A3E] text-[#C58A3E] font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-orange-50 transition-colors" disabled={isSubmitting}>
                Quay lại
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}