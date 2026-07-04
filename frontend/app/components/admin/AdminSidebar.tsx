"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, fetchAuthSession } from "aws-amplify/auth";

import { useState, useEffect } from "react";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload["cognito:groups"] as string[] | undefined;
        if (groups && groups.includes("Admin")) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Sidebar role check failed:", err);
      }
    };
    checkRole();
  }, []);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.refresh();
      window.location.href = "/";
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  const items = [
    { href: "/admin", label: "📊 Tổng Quan", exact: true },
    { href: "/admin/products", label: "🎷 Quản Lý Sản Phẩm" },
    { href: "/admin/orders", label: "📦 Quản Lý Đơn Hàng" },
    { href: "/admin/users", label: "👥 Quản Lý Người Dùng" },
  ];

  if (isAdmin) {
    items.push({ href: "/admin/staff", label: "👔 Quản Lý Nhân Sự" });
  }

  return (
    <aside className="w-64 shrink-0 bg-[#001A12] text-white h-screen sticky top-0 p-6 flex flex-col overflow-y-auto">
      <div className="mb-8">
        <h3 className="font-serif text-lg text-[#DF9E47]">Bảng Quản Trị</h3>
        <p className="text-xs text-white/50 mt-1">Nhóm TTTN Music</p>
      </div>

      <nav className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-left text-sm font-semibold px-4 py-3 rounded-xl transition-colors ${
              isActive(item.href, item.exact)
                ? "bg-[#DF9E47] text-[#002B1F]"
                : "text-white/70 hover:bg-white/10"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-1">
        <Link
          href="/"
          className="text-sm font-semibold text-white/60 hover:text-[#DF9E47] transition-colors px-4 py-3"
        >
          🏠 Quay lại Cửa Hàng
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-left text-sm font-semibold text-rose-300 hover:text-rose-200 hover:bg-white/10 transition-colors px-4 py-3 rounded-xl"
        >
          🚪 Đăng Xuất
        </button>
      </div>
    </aside>
  );
}
