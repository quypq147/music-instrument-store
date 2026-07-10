"use client";

import "../components/common/AmplifyConfig";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAuthSession } from "aws-amplify/auth";
import { AdminSidebar } from "../components/admin/AdminSidebar";
import MusicLoading from "../components/common/MusicLoading";
import { Menu, X } from "lucide-react";
import { getProfile } from "../../lib/api/profile";
import { updateAdminUser } from "../../lib/api/adminUsers";
import { getStoreOrigin } from "../../lib/adminHost";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload["cognito:groups"] as string[] | undefined;
        const idToken = session.tokens?.idToken;
        const email = idToken?.payload["email"] as string | undefined;
        const name = (idToken?.payload["name"] || idToken?.payload["cognito:username"]) as string | undefined;
        const userId = idToken?.payload["sub"] as string | undefined;

        let determinedRole = "User";
        if (groups) {
          if (groups.includes("Admin")) determinedRole = "Admin";
          else if (groups.includes("Staff")) determinedRole = "Staff";
        }

        if (determinedRole === "Admin" || determinedRole === "Staff") {
          setIsAuthorized(true);

          // Proactively initialize/sync staff/admin profile in DynamoDB
          if (userId) {
            try {
              const token = idToken?.toString() || "";
              const profileResult = await getProfile(token);
              if (profileResult.ok) {
                const { profile } = profileResult.data;
                if (!profile || profile.role !== determinedRole) {
                  await updateAdminUser(token, userId, {
                    name: profile?.name || name || "Support Staff",
                    phone: profile?.phone || "",
                    address: profile?.address || "",
                    role: determinedRole,
                    email: email || ""
                  });
                }
              }
            } catch (profileErr) {
              console.error("Auto-sync profile failed:", profileErr);
            }
          }
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
          <Link href={getStoreOrigin() || "/"}>
            <button
              type="button"
              className="w-full bg-[#002B1F] hover:bg-[#054030] text-white font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl transition-colors"
            >
              Quay Lại Cửa Hàng
            </button>
          </Link>
          <p className="text-sm text-slate-500 mt-6">
            Có tài khoản Admin?{" "}
            <Link href={`${getStoreOrigin()}/login`} className="text-[#A36B2B] font-bold hover:underline">
              Đăng nhập tại đây
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col md:flex-row relative">
      {/* Mobile Top Navbar with Hamburger */}
      <div className="md:hidden w-full bg-[#001A12] text-white px-6 py-4 flex items-center justify-between z-30 border-b border-white/5">
        <h3 className="font-serif text-base text-[#DF9E47]">Bảng Quản Trị</h3>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 -mr-2 text-white/80 hover:text-white transition-colors cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar with mobile drawer mode */}
      <div className={`
        fixed inset-y-0 left-0 z-45 transform transition-transform duration-300 md:translate-x-0 md:relative md:flex md:w-64
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="relative h-full flex flex-col w-full">
          {/* Close button inside sidebar on mobile */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden absolute top-4 right-4 z-50 p-2 text-white/60 hover:text-white bg-black/25 hover:bg-black/40 rounded-lg transition-colors cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
          <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
        </div>
      </div>

      {/* Overlay on mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Main Content Area */}
      <section className="flex-1 p-4 md:p-8 bg-[#FAFAF8] overflow-x-hidden">{children}</section>
    </main>
  );
}
