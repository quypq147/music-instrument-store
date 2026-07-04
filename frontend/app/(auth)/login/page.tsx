"use client";

import { Amplify } from "aws-amplify";
import "../../components/common/AmplifyConfig";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { signIn, fetchAuthSession, signInWithRedirect } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useToast } from "../../context/ToastContext";
import { Eye, EyeOff, Lock, ArrowRight, Music, ShieldCheck, Headphones, Users } from "lucide-react";

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

  const handleOAuth = async (provider: 'Google' | 'Facebook') => {
    try {
      await signInWithRedirect({ provider });
    } catch (error) {
      console.error(`OAuth error (${provider}):`, error);
      showToast(`Đăng nhập bằng ${provider} hiện chưa khả dụng (Chưa cấu hình OAuth). Vui lòng sử dụng email.`, "warning");
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
      await signIn({
        username: email,
        password: password,
      });

      let isAdminOrStaff = false;
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload["cognito:groups"] as string[] | undefined;
        isAdminOrStaff = !!(groups && (groups.includes("Admin") || groups.includes("Staff")));
      } catch (sessionError) {
        console.warn("Could not fetch session in login redirect:", sessionError);
      }
      showToast("Đăng nhập thành công!", "success");
      router.refresh();
      if (isAdminOrStaff) {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      const error = err as Error;
      showToast(error.message || "Tên đăng nhập hoặc mật khẩu không đúng!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>

      <main className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4 md:p-8 font-sans">
        
        {/* MAIN LOGIN CARD */}
        <div className="w-full max-w-[1100px] min-h-0 md:min-h-[750px] bg-white rounded-3xl md:rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] flex flex-col md:flex-row overflow-hidden relative z-10">
          
          {/* LEFT PANEL: Branding & Image */}
          <div className="w-full md:w-[42%] bg-[#1F332A] relative flex flex-col items-center pt-12 md:pt-16 overflow-hidden min-h-[400px] md:min-h-0">
            {/* Logo Area */}
            <div style={{ zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 24px' }}>
              <svg width="80" height="120" viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '12px' }}>
                <path d="M30 0C32.5 0 34 2 34 5V30C40 31 46 35 48 42C51 52 56 55 56 65C56 80 46 90 30 90C14 90 4 80 4 65C4 55 9 52 12 42C14 35 20 31 26 30V5C26 2 27.5 0 30 0Z" stroke="#DF9E47" strokeWidth="2" fill="transparent"/>
                <circle cx="30" cy="55" r="8" stroke="#DF9E47" strokeWidth="2" fill="transparent"/>
                <line x1="28" y1="5" x2="28" y2="47" stroke="#DF9E47" strokeWidth="1"/>
                <line x1="32" y1="5" x2="32" y2="47" stroke="#DF9E47" strokeWidth="1"/>
                <path d="M12 25 C20 15, 40 15, 48 25" stroke="#DF9E47" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
                <text x="30" y="80" textAnchor="middle" fill="#DF9E47" fontSize="9" fontWeight="bold" letterSpacing="1">TTTN</text>
                <text x="30" y="88" textAnchor="middle" fill="#DF9E47" fontSize="7" letterSpacing="2">MUSIC</text>
              </svg>
              
              <p style={{ color: '#DF9E47', fontSize: '15px', letterSpacing: '0.05em', marginTop: '8px', fontWeight: 500 }}>
                Âm nhạc kết nối đam mê
              </p>
            </div>

            {/* Instrument Image Background */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', width: '100%' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', zIndex: 10 }}></div>
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHQJCKH0A3aaCbpuo9oQkVLzDfAc1q5qj7kkSGopzv8h87voG54uF4HV1dKsKfXK8uLNIua4hwoY-dxT-fyyZSR6qFgNCHRjBH8ri91RsveE20KDrwJuRF9g54svJLu84rbImLYWjLjCy20mVNmLYbnRzgX9TAZ45obSqrIrvlS1sSncNxWH7tiQeoC_TVxRw-NtwTzJzM9pAk3tsqxpYT2a3TSkHeUPbSUHzlCPpBr32JiQBJWm0"
                alt="Saxophone Background"
                fill
                style={{ objectFit: 'cover', objectPosition: 'bottom', opacity: 0.8, mixBlendMode: 'luminosity' }}
                unoptimized
              />
            </div>
          </div>

          {/* RIGHT PANEL: Form */}
          <div className="w-full md:w-[58%] p-8 md:py-12 md:px-16 lg:py-16 lg:px-24 flex flex-col justify-center">
            <div style={{ marginBottom: '2rem' }}>
              <span style={{ color: '#002B1F', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px', display: 'block' }}>
                Chào mừng bạn trở lại 👋
              </span>
              <h1 style={{ fontSize: '2.5rem', color: '#002B1F', marginBottom: '12px', fontFamily: 'var(--font-serif), serif', fontWeight: 600 }}>
                Đăng Nhập
              </h1>
              <p style={{ color: '#6B7280', fontSize: '15px', lineHeight: 1.6, paddingRight: '1rem' }}>
                Truy cập vào tài khoản Nhóm TTTN Music để khám phá những tuyệt tác âm thanh.
              </p>
            </div>

            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="mb-5">
                <label className="text-[11px] font-bold text-[#002B1F] uppercase tracking-[0.1em] block mb-2" htmlFor="email">Email</label>
                <div className="relative">
                  <input
                    className="w-full py-[14px] px-4 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#1F2937] transition-all box-border focus:outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F]"
                    id="email"
                    placeholder="email@example.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-5">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="text-[11px] font-bold text-[#002B1F] uppercase tracking-[0.1em] block" htmlFor="password">Mật khẩu</label>
                  <a href="#" style={{ fontSize: '12px', fontWeight: 700, color: '#002B1F', textDecoration: 'none' }}>
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <input
                    className="w-full py-[14px] px-4 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#1F2937] transition-all box-border focus:outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F]"
                    style={{ paddingRight: '48px', fontWeight: 500 }}
                    id="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {showPassword ? (
                    <EyeOff
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] cursor-pointer w-5 h-5"
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  ) : (
                    <Eye
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] cursor-pointer w-5 h-5"
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  )}
                </div>
              </div>

              {/* Remember Me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isSubmitting}
                    style={{ width: '16px', height: '16px', accentColor: '#002B1F', cursor: 'pointer' }}
                  />
                </div>
                <label
                  htmlFor="remember"
                  style={{ fontSize: '14px', color: '#374151', cursor: 'pointer', userSelect: 'none', fontWeight: 500 }}
                >
                  Ghi nhớ đăng nhập
                </label>
              </div>

              {/* Submit Button */}
              <button className="w-full bg-[#002B1F] text-white font-bold text-sm uppercase tracking-[0.1em] p-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-colors cursor-pointer shadow-[0_8px_20px_rgba(0,43,31,0.2)] border-none enabled:hover:bg-[#054030] disabled:opacity-70 disabled:cursor-not-allowed" type="submit" disabled={isSubmitting}>
                <Lock style={{ width: '16px', height: '16px' }} />
                {isSubmitting ? "Đang xử lý..." : "Đăng Nhập"}
              </button>
            </form>

            {/* Social Separator */}
            <div style={{ position: 'relative', margin: '2rem 0' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', borderTop: '1px solid #E5E7EB' }}></div>
              </div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <span style={{ padding: '0 16px', background: '#fff', color: '#9CA3AF', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700 }}>
                  Hoặc đăng nhập bằng
                </span>
              </div>
            </div>

            {/* Social Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button type="button" className="flex items-center justify-center gap-2.5 p-3 bg-white border border-[#E5E7EB] rounded-xl cursor-pointer transition-colors text-sm font-semibold text-[#374151] w-full hover:bg-[#F9FAFB]" disabled={isSubmitting} onClick={() => handleOAuth('Google')}>
                <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                </svg>
                <span>Google</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-2.5 p-3 bg-white border border-[#E5E7EB] rounded-xl cursor-pointer transition-colors text-sm font-semibold text-[#374151] w-full hover:bg-[#F9FAFB]" disabled={isSubmitting} onClick={() => handleOAuth('Facebook')}>
                <svg style={{ width: '18px', height: '18px', color: '#1877F2' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </button>
            </div>

            {/* Register Link */}
            <div style={{ marginTop: '2.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}>
              <span style={{ color: '#6B7280' }}>Bạn chưa có tài khoản?</span>
              <Link href="/register" style={{ color: '#002B1F', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Đăng ký ngay
                <ArrowRight style={{ width: '12px', height: '12px' }} />
              </Link>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#D1D5DB' }}>
              <Music style={{ width: '12px', height: '12px' }} />
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: 700 }}>NHÓM TTTN MUSIC</span>
            </div>

          </div>
        </div>

        {/* TRUST BADGES CARD */}
        <div className="w-full max-w-[1100px] mt-8 bg-white rounded-3xl py-8 px-8 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative z-10">
          
          {/* Badge 1 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E8F1EC] flex items-center justify-center shrink-0 text-[#002B1F]">
              <ShieldCheck style={{ width: '24px', height: '24px' }} />
            </div>
            <div>
              <h3 style={{ color: '#002B1F', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Bảo mật</h3>
              <p style={{ color: '#6B7280', fontSize: '13px', lineHeight: 1.4 }}>Thông tin của bạn được bảo vệ tuyệt đối</p>
            </div>
          </div>

          {/* Badge 2 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E8F1EC] flex items-center justify-center shrink-0 text-[#002B1F]">
              <Headphones style={{ width: '24px', height: '24px' }} />
            </div>
            <div>
              <h3 style={{ color: '#002B1F', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Âm thanh chất lượng</h3>
              <p style={{ color: '#6B7280', fontSize: '13px', lineHeight: 1.4 }}>Trải nghiệm âm nhạc tuyệt vời nhất</p>
            </div>
          </div>

          {/* Badge 3 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E8F1EC] flex items-center justify-center shrink-0 text-[#002B1F]">
              <Users style={{ width: '24px', height: '24px' }} />
            </div>
            <div>
              <h3 style={{ color: '#002B1F', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Cộng đồng đam mê</h3>
              <p style={{ color: '#6B7280', fontSize: '13px', lineHeight: 1.4 }}>Kết nối với những người yêu âm nhạc</p>
            </div>
          </div>
        </div>

        <p style={{ marginTop: '2rem', color: '#9CA3AF', fontSize: '12px', paddingBottom: '1rem' }}>
          © 2026 Nhóm TTTN Music. All rights reserved.
        </p>
      </main>
    </>
  );
}