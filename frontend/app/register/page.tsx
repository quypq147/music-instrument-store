"use client";

import "../components/AmplifyConfig";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp, confirmSignUp, signInWithRedirect } from "aws-amplify/auth";

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

  const handleOAuth = async (provider: 'Google' | 'Facebook') => {
    try {
      await signInWithRedirect({ provider });
    } catch (error) {
      console.error(`OAuth error (${provider}):`, error);
      alert(`Đăng nhập bằng ${provider} hiện chưa khả dụng (Chưa cấu hình OAuth trên hệ thống). Vui lòng sử dụng đăng ký bằng email tĩnh.`);
    }
  };

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
    <main className="min-h-screen relative flex items-center justify-center lg:justify-between px-6 lg:px-24 py-12 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        .luxury-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .luxury-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(2,10,6,0.95) 0%, rgba(2,10,6,0.6) 40%, rgba(2,10,6,0.2) 100%);
        }
        .glass-card {
          background: rgba(250, 247, 242, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 2px solid #DF9E47;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          padding: 3rem 2.5rem;
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 480px;
        }
        .luxury-input-group {
          display: flex;
          align-items: center;
          border: 1px solid #DF9E47;
          border-radius: 6px;
          overflow: hidden;
          background: #fff;
        }
        .luxury-input-icon {
          background: #F3E5D0;
          color: #9B6B22;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid rgba(223, 158, 71, 0.3);
        }
        .luxury-input {
          flex: 1;
          padding: 12px 16px;
          border: none;
          outline: none;
          font-size: 0.9rem;
          color: #374151;
          width: 100%;
        }
        .luxury-input::placeholder {
          color: #9CA3AF;
        }
        .luxury-btn {
          background: linear-gradient(135deg, #C58A3E 0%, #E6C280 50%, #C58A3E 100%);
          background-size: 200% auto;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 700;
          padding: 16px;
          border-radius: 8px;
          border: none;
          width: 100%;
          cursor: pointer;
          transition: 0.5s;
          box-shadow: 0 10px 20px rgba(197, 138, 62, 0.3);
        }
        .luxury-btn:hover {
          background-position: right center;
        }
        .social-btn-lux {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 10px;
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }
        .social-btn-lux:hover {
          background: #F9FAFB;
          border-color: #D1D5DB;
        }
      `}} />

      {/* Background Image */}
      <div className="luxury-bg">
        <Image 
          src="/images/hinh duoi trang chu.jpg" 
          alt="Background" 
          fill 
          className="object-cover"
          unoptimized
        />
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
          
          <div className="w-16 h-[2px] bg-[#DF9E47] mb-6"></div>
          
          <p className="text-gray-300 text-xl leading-relaxed max-w-lg">
            Join an exclusive community of musicians dedicated to the artistry of premium woodwinds. Your journey toward musical excellence begins with a single step.
          </p>
        </div>

        <div className="flex gap-8 mt-20">
          <div className="flex flex-col items-center text-center max-w-[120px]">
            <svg className="mb-3" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#DF9E47" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            <span className="text-xs font-bold tracking-widest text-[#DF9E47] uppercase mb-1">Premium Quality</span>
            <span className="text-[13px] text-gray-400">Nhạc cụ cao cấp chính hãng</span>
          </div>
          <div className="flex flex-col items-center text-center max-w-[120px]">
            <svg className="mb-3" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#DF9E47" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span className="text-xs font-bold tracking-widest text-[#DF9E47] uppercase mb-1">Exclusive Community</span>
            <span className="text-[13px] text-gray-400">Cộng đồng nghệ sĩ đam mê âm nhạc</span>
          </div>
          <div className="flex flex-col items-center text-center max-w-[120px]">
            <svg className="mb-3" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#DF9E47" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span className="text-xs font-bold tracking-widest text-[#DF9E47] uppercase mb-1">Expert Support</span>
            <span className="text-[13px] text-gray-400">Hỗ trợ chuyên nghiệp tận tâm</span>
          </div>
        </div>
      </div>

      {/* Right Form Card */}
      <div className="glass-card">
        {step === "REGISTER" ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F3E5D0] mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#9B6B22"><path d="M12 3C10 3 8 4.5 8 6V18C8 19.5 10 21 12 21C14 21 16 19.5 16 18V6C16 4.5 14 3 12 3ZM10 18V6H11V18H10ZM13 18V6H14V18H13Z"/></svg>
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
                <div className="luxury-input-group">
                  <div className="luxury-input-icon">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  </div>
                  <input className="luxury-input" id="full-name" placeholder="Nguyễn Văn A" type="text" required value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} disabled={isSubmitting} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5" htmlFor="email">Email</label>
                <div className="luxury-input-group">
                  <div className="luxury-input-icon">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  </div>
                  <input className="luxury-input" id="email" placeholder="tran.thien1830@gmail.com" type="email" required value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} disabled={isSubmitting} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5" htmlFor="phone">Số điện thoại</label>
                <div className="luxury-input-group">
                  <div className="luxury-input-icon">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  </div>
                  <input className="luxury-input" id="phone" placeholder="090 123 4567" type="tel" value={user.phone} onChange={(e) => setUser({ ...user, phone: e.target.value })} disabled={isSubmitting} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5" htmlFor="password">Mật khẩu</label>
                <div className="luxury-input-group relative">
                  <div className="luxury-input-icon">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  </div>
                  <input className="luxury-input pr-10" id="password" placeholder="••••••••" type={showPassword ? "text" : "password"} required value={user.password} onChange={(e) => setUser({ ...user, password: e.target.value })} disabled={isSubmitting} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5" htmlFor="confirmPassword">Nhập lại mật khẩu</label>
                <div className="luxury-input-group relative">
                  <div className="luxury-input-icon">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  </div>
                  <input className="luxury-input pr-10" id="confirmPassword" placeholder="••••••••" type={showPassword ? "text" : "password"} required value={user.confirmPassword} onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })} disabled={isSubmitting} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2 pb-2">
                <input id="terms" type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-1" />
                <label htmlFor="terms" className="text-xs text-gray-700 leading-tight">
                  Tôi đồng ý với <b>Điều khoản & Chính sách</b> của Aureate Forest Boutique.
                </label>
              </div>

              <button type="submit" className="luxury-btn" disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Đăng Ký"}
              </button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-[1px] bg-gray-200"></div>
              <span className="text-xs text-gray-500 uppercase">Hoặc đăng ký bằng</span>
              <div className="flex-1 h-[1px] bg-gray-200"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => handleOAuth('Google')} className="social-btn-lux">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button type="button" onClick={() => handleOAuth('Facebook')} className="social-btn-lux">
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
                <div className="luxury-input-group">
                  <div className="luxury-input-icon">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  </div>
                  <input className="luxury-input text-center font-bold tracking-widest text-lg" id="otp" placeholder="123456" type="text" required value={confirmationCode} onChange={(e) => setConfirmationCode(e.target.value)} disabled={isSubmitting} />
                </div>
              </div>

              <button type="submit" className="luxury-btn mt-6" disabled={isSubmitting}>
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