"use client";

import "../components/common/AmplifyConfig";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAuthSession } from "aws-amplify/auth";
import { AdminSidebar } from "../components/admin/AdminSidebar";
import MusicLoading from "../components/common/MusicLoading";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload["cognito:groups"] as string[] | undefined;
        if (groups && (groups.includes("Admin") || groups.includes("Staff"))) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthorized(false);
      }
    };
    init();
  }, []);

  if (isAuthorized === null) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <MusicLoading message="Đang kiểm tra quyền truy cập..." height="200px" />
      </main>
    );
  }

  if (isAuthorized === false) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="font-serif text-2xl text-[#A36B2B] mb-3">Truy Cập Bị Từ Chối</h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Tài khoản của bạn không có quyền truy cập vào khu vực quản trị. Vui lòng đăng nhập bằng tài khoản có đặc quyền Admin.
          </p>
          <Link href="/">
            <button
              type="button"
              className="w-full bg-[#002B1F] hover:bg-[#054030] text-white font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl transition-colors"
            >
              Quay Lại Cửa Hàng
            </button>
          </Link>
          <p className="text-sm text-slate-500 mt-6">
            Có tài khoản Admin?{" "}
            <Link href="/login" className="text-[#A36B2B] font-bold hover:underline">
              Đăng nhập tại đây
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex">
      <AdminSidebar />
      <section className="flex-1 p-8 bg-[#FAFAF8]">{children}</section>
    </main>
  );
}
