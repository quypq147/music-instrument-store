"use client";

import "../components/AmplifyConfig";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchAuthSession, getCurrentUser } from "@aws-amplify/auth";

type UserProfile = {
  userId: string;
  email: string;
  name: string;
  phone: string;
  address: string;
};

type WishlistItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
  type: string;
  addedAt: string;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export default function ProfilePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "wishlist">("profile");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await getCurrentUser();
        setIsAuthenticated(true);
        await fetchData();
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
      }
    };
    init();
  }, []);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No session token found");

      // Fetch Profile
      const profileRes = await fetch("/api/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (profileRes.ok) {
        const { profile } = await profileRes.json();
        setProfile(profile);
        setFormData({
          name: profile.name || "",
          phone: profile.phone || "",
          address: profile.address || "",
        });
      }

      // Fetch Wishlist
      const wishlistRes = await fetch("/api/users/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (wishlistRes.ok) {
        const wishlistData = await wishlistRes.json();
        setWishlist(wishlistData);
      }
    } catch (err) {
      console.error("Failed to load user profile & wishlist data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No token found");

      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Cập nhật thông tin cá nhân thành công!");
        fetchData();
      } else {
        alert("Không thể cập nhật thông tin. Vui lòng thử lại!");
      }
    } catch (err) {
      console.error("Update profile error:", err);
      alert("Đã xảy ra lỗi khi lưu thông tin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!confirm("Bạn muốn xóa sản phẩm này khỏi danh sách yêu thích?")) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No token found");

      const res = await fetch(`/api/users/wishlist/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Đã xóa sản phẩm khỏi danh sách yêu thích!");
        fetchData();
      } else {
        alert("Không thể xóa sản phẩm. Vui lòng thử lại!");
      }
    } catch (err) {
      console.error("Wishlist remove error:", err);
      alert("Đã xảy ra lỗi.");
    }
  };

  if (isAuthenticated === null) {
    return (
      <main className="min-h-[60vh] flex justify-center items-center bg-slate-50">
        <div className="text-emerald-900 font-semibold tracking-wider animate-pulse uppercase">
          Đang tải thông tin tài khoản...
        </div>
      </main>
    );
  }

  if (isAuthenticated === false) {
    return (
      <main className="min-h-[65vh] flex justify-center items-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-md text-center border border-slate-100">
          <span className="text-5xl block mb-4">🔒</span>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Đăng Nhập Để Tiếp Tục</h1>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Vui lòng đăng nhập để xem thông tin tài khoản, danh sách sản phẩm yêu thích và lịch sử mua sắm.
          </p>
          <Link href="/login">
            <button className="w-full bg-emerald-900 hover:bg-emerald-950 text-white font-semibold py-3 rounded-xl transition-all shadow-sm">
              Đăng Nhập
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full md:w-1/4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-fit">
            <div className="text-center mb-6 pb-6 border-b border-slate-100">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-3xl font-extrabold text-emerald-900 mx-auto mb-3 border border-emerald-100">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
              </div>
              <h2 className="text-lg font-bold text-slate-800">{profile?.name || "Thành viên"}</h2>
              <p className="text-xs text-slate-400 mt-1">{profile?.email}</p>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all text-left ${
                  activeTab === "profile"
                    ? "bg-emerald-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                👤 Thông tin tài khoản
              </button>
              <button
                onClick={() => setActiveTab("wishlist")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all text-left ${
                  activeTab === "wishlist"
                    ? "bg-emerald-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                ❤️ Sản phẩm yêu thích
              </button>
            </nav>
          </aside>

          {/* Content */}
          <section className="flex-1 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
            {isLoadingData ? (
              <div className="h-64 flex justify-center items-center">
                <div className="text-slate-400 text-sm animate-pulse">Đang tải dữ liệu...</div>
              </div>
            ) : activeTab === "profile" ? (
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">
                  Thông Tin Cá Nhân
                </h2>
                
                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        disabled
                        value={profile?.email || ""}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-sm cursor-not-allowed focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Họ và Tên
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Số Điện Thoại
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0912345678"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Địa chỉ nhận hàng mặc định
                    </label>
                    <textarea
                      id="address"
                      rows={3}
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Đường ABC, Quận X, TP. Hồ Chí Minh"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 focus:border-emerald-900 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-900 hover:bg-emerald-950 text-white font-semibold px-8 py-3 rounded-xl transition-all text-sm active:scale-[0.98] disabled:opacity-60"
                  >
                    {isSubmitting ? "Đang lưu..." : "Cập Nhật Thông Tin"}
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">
                  Sản Phẩm Yêu Thích Của Bạn
                </h2>

                {wishlist.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <span className="text-4xl block mb-3">❤️</span>
                    <p className="text-sm text-slate-500 mb-4">Danh sách sản phẩm yêu thích đang trống.</p>
                    <Link href="/products">
                      <button className="bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-lg">
                        Khám phá sản phẩm ngay
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((item) => (
                      <Link 
                        key={item.productId} 
                        href={`/product/${item.productId}`}
                        className="group flex flex-col justify-between bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="p-4 flex-1">
                          <div className="relative w-full aspect-square bg-slate-50 rounded-lg overflow-hidden mb-4">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {item.brand}
                          </span>
                          <h3 className="font-bold text-sm text-slate-800 group-hover:text-emerald-900 transition-colors line-clamp-2 mt-1">
                            {item.name}
                          </h3>
                          <p className="font-extrabold text-amber-700 text-sm mt-2">
                            {currencyFormatter.format(item.price)}
                          </p>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                          <button
                            onClick={(e) => handleRemoveFromWishlist(item.productId, e)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline"
                          >
                            Xóa khỏi yêu thích
                          </button>
                          <span className="text-xs text-emerald-800 font-bold group-hover:underline">
                            Xem chi tiết →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}
