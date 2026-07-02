"use client";

import { Amplify } from "aws-amplify";
import "../components/AmplifyConfig";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { signIn, fetchAuthSession, signInWithRedirect } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
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
      alert(`Đăng nhập bằng ${provider} hiện chưa khả dụng (Chưa cấu hình OAuth trên hệ thống). Vui lòng sử dụng đăng nhập bằng email.`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Vui lòng nhập email và mật khẩu!");
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
      alert("Đăng nhập thành công!");
      router.refresh();
      if (isAdminOrStaff) {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      const error = err as Error;
      alert(error.message || "Tên đăng nhập hoặc mật khẩu không đúng!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .login-page-wrapper {
          min-height: 100vh;
          background-color: #FDFBF7;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: var(--font-sans), sans-serif;
        }
        .login-card {
          width: 100%;
          max-width: 1100px;
          min-height: 750px;
          background: #fff;
          border-radius: 2rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: row;
          overflow: hidden;
          position: relative;
          z-index: 10;
        }
        .login-left {
          width: 42%;
          background-color: #1F332A;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 4rem;
          overflow: hidden;
        }
        .login-right {
          width: 58%;
          padding: 4rem 6rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        @media (max-width: 992px) {
          .login-right { padding: 3rem 4rem; }
        }
        @media (max-width: 768px) {
          .login-page-wrapper { padding: 1rem; }
          .login-card {
            flex-direction: column;
            min-height: auto;
            border-radius: 1.5rem;
          }
          .login-left {
            width: 100%;
            min-height: 400px;
            padding-top: 3rem;
          }
          .login-right {
            width: 100%;
            padding: 2rem;
          }
        }
        .login-input {
          width: 100%;
          padding: 14px 16px;
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          font-size: 15px;
          color: #1F2937;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .login-input:focus {
          outline: none;
          border-color: #002B1F;
          box-shadow: 0 0 0 1px #002B1F;
        }
        .login-btn {
          width: 100%;
          background: #002B1F;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 1rem;
          transition: background 0.2s;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(0,43,31,0.2);
          border: none;
        }
        .login-btn:hover:not(:disabled) { background: #054030; }
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          width: 100%;
        }
        .social-btn:hover { background: #F9FAFB; }
        .trust-badges {
          width: 100%;
          max-width: 1100px;
          margin-top: 2rem;
          background: #fff;
          border-radius: 1.5rem;
          padding: 2rem 3rem;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          position: relative;
          z-index: 10;
        }
        @media (max-width: 768px) {
          .trust-badges {
            grid-template-columns: 1fr;
            padding: 2rem;
          }
        }
        .badge-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .badge-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #E8F1EC;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #002B1F;
        }
        .form-group { margin-bottom: 1.25rem; }
        .form-label {
          font-size: 11px;
          font-weight: 700;
          color: #002B1F;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: block;
          margin-bottom: 8px;
        }
        .input-wrapper { position: relative; }
        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9CA3AF;
          pointer-events: none;
          width: 20px;
          height: 20px;
          transition: color 0.2s;
        }
        .input-wrapper:focus-within .input-icon { color: #002B1F; }
        .eye-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9CA3AF;
          cursor: pointer;
          width: 20px;
          height: 20px;
        }
      `}} />

      <main className="login-page-wrapper">
        
        {/* MAIN LOGIN CARD */}
        <div className="login-card">
          
          {/* LEFT PANEL: Branding & Image */}
          <div className="login-left">
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
          <div className="login-right">
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
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <input
                    className="login-input"
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
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }} htmlFor="password">Mật khẩu</label>
                  <a href="#" style={{ fontSize: '12px', fontWeight: 700, color: '#002B1F', textDecoration: 'none' }}>
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="input-wrapper">
                  <input
                    className="login-input"
                    style={{ paddingRight: '48px', fontWeight: 500 }}
                    id="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <svg 
                    className="eye-icon" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
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
              <button className="login-btn" type="submit" disabled={isSubmitting}>
                <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
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
              <button type="button" className="social-btn" disabled={isSubmitting} onClick={() => handleOAuth('Google')}>
                <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                </svg>
                <span>Google</span>
              </button>
              <button type="button" className="social-btn" disabled={isSubmitting} onClick={() => handleOAuth('Facebook')}>
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
                <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#D1D5DB' }}>
              <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: 700 }}>NHÓM TTTN MUSIC</span>
            </div>

          </div>
        </div>

        {/* TRUST BADGES CARD */}
        <div className="trust-badges">
          
          {/* Badge 1 */}
          <div className="badge-item">
            <div className="badge-icon">
              <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 style={{ color: '#002B1F', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Bảo mật</h3>
              <p style={{ color: '#6B7280', fontSize: '13px', lineHeight: 1.4 }}>Thông tin của bạn được bảo vệ tuyệt đối</p>
            </div>
          </div>

          {/* Badge 2 */}
          <div className="badge-item">
            <div className="badge-icon">
              <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.601h-.002c.05.38.1.758.15 1.135A2.25 2.25 0 0011.371 13h1.258a2.25 2.25 0 002.223-2.264c.05-.377.1-.755.15-1.135h-.002a8.288 8.288 0 002.362-4.387zM15.362 5.214a1.866 1.866 0 01-1.066.866 1.866 1.866 0 01-1.066-.866A1.866 1.866 0 0114.296 4.348a1.866 1.866 0 011.066.866z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 style={{ color: '#002B1F', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Âm thanh chất lượng</h3>
              <p style={{ color: '#6B7280', fontSize: '13px', lineHeight: 1.4 }}>Trải nghiệm âm nhạc tuyệt vời nhất</p>
            </div>
          </div>

          {/* Badge 3 */}
          <div className="badge-item">
            <div className="badge-icon">
              <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
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