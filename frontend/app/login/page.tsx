"use client";

import "../components/AmplifyConfig";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { signIn } from "@aws-amplify/auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

      alert("Đăng nhập thành công!");
      // Redirect to home page and refresh to update AuthNav state
      router.refresh();
      window.location.href = "/";
    } catch (err) {
      const error = err as Error;
      console.error("Login error:", error);
      alert(error.message || "Tên đăng nhập hoặc mật khẩu không đúng!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-surface text-on-surface font-body-md">
      {/* Left Side: Branding & Visual Side (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 luxury-gradient z-10 flex flex-col justify-between p-container-margin text-white">
          <div className="z-10">
            <Link
              className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary-fixed inline-block mb-12"
              href="/"
            >
              Nhóm TTTN Music
            </Link>
            <div className="max-w-md">
              <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-widest block mb-4">
                The Art of Woodwinds
              </span>
              <h2 className="font-display-lg text-display-lg leading-tight mb-6 text-white">
                Khơi nguồn cảm hứng nghệ thuật
              </h2>
              <p className="font-body-lg text-body-lg text-primary-fixed/80 italic leading-relaxed">
                &ldquo;Âm nhạc là tiếng vọng của tâm hồn, và chiếc saxophone chính là người dẫn lối.&rdquo;
              </p>
            </div>
          </div>

          <div className="z-10">
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary-fixed/60">
              Aureate Forest Boutique
            </p>
          </div>
        </div>
        <Image
          className="absolute inset-0 w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-[10000ms] ease-out"
          alt="A macro cinematic shot of a professional vintage gold-lacquered saxophone resting against a deep forest green velvet chair in a dimly lit, luxurious jazz lounge. The lighting is warm and directional, catching the intricate engravings on the bell and the mother-of-pearl key touches. The background is a soft bokeh of a mahogany bar and amber-glowing lamps, evoking a high-end, sophisticated boutique atmosphere. The image is rich in texture and follows the brand's distinguished and soulful aesthetic."
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHQJCKH0A3aaCbpuo9oQkVLzDfAc1q5qj7kkSGopzv8h87voG54uF4HV1dKsKfXK8uLNIua4hwoY-dxT-fyyZSR6qFgNCHRjBH8ri91RsveE20KDrwJuRF9g54svJLu84rbImLYWjLjCy20mVNmLYbnRzgX9TAZ45obSqrIrvlS1sSncNxWH7tiQeoC_TVxRw-NtwTzJzM9pAk3tsqxpYT2a3TSkHeUPbSUHzlCPpBr32JiQBJWm0"
          unoptimized
          fill
        />
      </div>

      {/* Right Side: Form Content */}
      <div className="w-full md:w-1/2 bg-surface-cream flex items-center justify-center p-6 md:p-container-margin overflow-y-auto">
        <div className="w-full max-w-md py-12">
          {/* Mobile Logo */}
          <div className="md:hidden mb-8 text-center">
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold">
              Nhóm TTTN Music
            </h2>
          </div>

          <div className="mb-10 text-center md:text-left">
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest block mb-2">
              Chào mừng bạn trở lại
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
              Đăng Nhập
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Truy cập vào tài khoản Nhóm TTTN Music của bạn để khám phá những tuyệt tác âm thanh.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
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
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-label-sm text-label-sm text-primary/80 uppercase" htmlFor="password">
                  Mật khẩu
                </label>
                <a className="font-label-sm text-label-sm text-gold-muted hover:underline" href="#">
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-gold-muted transition-colors">
                  lock
                </span>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-white border border-border-subtle rounded-lg font-body-md focus:outline-none form-input-focus transition-all placeholder:text-outline-variant"
                  id="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-3 pt-2">
              <input
                className="w-4 h-4 text-gold-muted border-border-subtle rounded-sm focus:ring-gold-muted cursor-pointer"
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
              />
              <label
                className="font-body-md text-body-md text-on-surface-variant cursor-pointer select-none"
                htmlFor="remember"
              >
                Ghi nhớ đăng nhập
              </label>
            </div>

            {/* Submit Button */}
            <button
              className="w-full bg-primary text-white font-label-sm text-label-sm uppercase tracking-[0.2em] py-4 rounded-lg hover:bg-primary-container active:scale-[0.98] transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Đăng Nhập"}
            </button>
          </form>

          {/* Social Login Separator */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface-cream text-on-surface-variant font-label-sm">
                Hoặc đăng nhập bằng
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

          {/* Redirect to Register */}
          <div className="mt-10 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Bạn chưa có tài khoản?{" "}
              <Link
                className="text-primary font-bold hover:text-gold-muted transition-colors underline decoration-border-subtle underline-offset-4 ml-1"
                href="/register"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>

          {/* Decorative Badge for TTTN Music */}
          <div className="flex items-center justify-center pt-8 opacity-40">
            <div className="h-[1px] bg-outline-variant flex-grow"></div>
            <span className="mx-4 font-label-sm text-[10px] uppercase tracking-[0.3em] whitespace-nowrap">
              Nhóm TTTN Music
            </span>
            <div className="h-[1px] bg-outline-variant flex-grow"></div>
          </div>
        </div>
      </div>
    </main>
  );
}