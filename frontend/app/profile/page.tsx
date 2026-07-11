"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import "../components/common/AmplifyConfig";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmDialogContext";
import { useTheme } from "../context/ThemeContext";
import { fetchAuthSession, getCurrentUser, updatePassword, signOut, signInWithRedirect } from "aws-amplify/auth";
import { rememberOAuthAttempt } from "../lib/authStorage";
import AddressSelector from "../components/address/AddressSelector";
import { OrderCard } from "../components/order/OrderCard";
import { OrderDetailsModal } from "../components/order/OrderDetailsModal";
import type { Order } from "../../types/cart";
import MusicLoading from "../components/common/MusicLoading";
import { ImagePicker } from "../components/common/ImagePicker";
import { slugify } from "../../lib/products";
import { getProfile, updateProfile, unlinkProvider } from "../../lib/api/profile";
import { getWishlist, removeFromWishlist } from "../../lib/api/wishlist";

interface DbOrderItem {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

interface DbOrder {
  id: string;
  orderNumber?: number;
  customer: {
    name: string;
    phone: string;
    address: string;
    note: string;
  };
  paymentMethod: string;
  items?: DbOrderItem[];
  totalItems: number;
  totalPrice: number;
  status: string;
  createdAt?: string;
}

type UserProfile = {
  userId: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  avatarUrl?: string;
  googleLinked?: boolean;
  facebookLinked?: boolean;
  googleEmail?: string;
  facebookEmail?: string;
  authProvider?: "Google" | "Facebook" | "Email";
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

const inputClasses =
  "w-full px-4 py-3 border border-slate-200 dark:border-emerald-900/40 rounded-xl text-slate-800 dark:text-emerald-50 text-sm outline-none focus:border-[#002B1F] dark:focus:border-secondary focus:shadow-[0_0_0_1px_#002B1F] dark:focus:shadow-[0_0_0_1px_#DF9E47] transition-all bg-white dark:bg-[#031d16]";

function ProfileContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const confirmAction = useConfirm();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "wishlist" | "orders" | "settings" | "connections">("profile");
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 4;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Settings Tab States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailOrder: true,
    smsShipping: false,
    emailPromo: true,
  });

  const { theme, setThemeExplicitly } = useTheme();

  // Liên kết thật trong Cognito: đưa user qua trang đăng nhập của provider — miễn là chọn
  // tài khoản có CÙNG email, PreSignUp trigger phía backend sẽ tự gộp identity đó vào tài
  // khoản hiện tại (cùng sub, giữ nguyên profile/đơn hàng), không cần nhập email thủ công.
  const handleLinkProvider = async (provider: "Google" | "Facebook") => {
    const ok = await confirmAction({
      message: `Bạn sẽ được chuyển sang trang đăng nhập ${provider}. Hãy chọn đúng tài khoản ${provider} dùng email "${profile?.email}" — hệ thống sẽ tự liên kết vào tài khoản hiện tại.`,
    });
    if (!ok) return;

    try {
      rememberOAuthAttempt(provider);
      // Amplify không cho signInWithRedirect khi đang có phiên đăng nhập; đăng xuất cục bộ
      // trước rồi đi tiếp. Sau khi liên kết xong, user đăng nhập lại vào đúng tài khoản này.
      await signOut().catch(() => {});
      await signInWithRedirect({ provider });
    } catch (err) {
      console.error(`Error starting ${provider} linking:`, err);
      showToast(`Không mở được trang đăng nhập ${provider}. Vui lòng thử lại!`, "error");
    }
  };

  const handleUnlinkProvider = async (provider: "Google" | "Facebook") => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No token found");

      const result = await unlinkProvider(token, provider);
      if (result.ok) {
        showToast(`Hủy liên kết tài khoản ${provider} thành công!`, "success");
        // Cập nhật ngay trên UI — GET /users/profile có thể còn trả trạng thái cũ tới khi
        // token của phiên hiện tại được refresh (claim identities nằm trong JWT).
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                ...(provider === "Google"
                  ? { googleLinked: false, googleEmail: "" }
                  : { facebookLinked: false, facebookEmail: "" }),
              }
            : prev
        );
      } else {
        showToast("Thao tác thất bại. Vui lòng thử lại!", "error");
      }
    } catch (err) {
      console.error(`Error unlinking ${provider}:`, err);
      showToast("Đã xảy ra lỗi khi hủy liên kết.", "error");
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [authToken, setAuthToken] = useState("");

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No session token found");
      setAuthToken(token);

      // Fetch Profile
      const profileResult = await getProfile(token);
      if (profileResult.ok) {
        const { profile } = profileResult.data;
        setProfile(profile);
        setFormData({
          name: profile.name || "",
          phone: profile.phone || "",
          address: profile.address || "",
        });
      }

      // Fetch Wishlist
      const wishlistResult = await getWishlist(token);
      if (wishlistResult.ok) {
        setWishlist(wishlistResult.data);
      }

      // Fetch Orders
      const ordersRes = await fetch("/api/users/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const mappedOrders = ordersData.map((order: DbOrder) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customer: order.customer,
          paymentMethod: order.paymentMethod,
          products: (order.items || []).map((item: DbOrderItem) => ({
            id: Number(item.productId) || 0,
            name: item.name,
            price: `${(item.price || 0).toLocaleString("vi-VN")}đ`,
            image: item.imageUrl || "/placeholder.png",
            quantity: item.quantity
          })),
          totalItems: order.totalItems,
          totalPrice: order.totalPrice,
          status: order.status === "PENDING" ? "Chờ xác nhận" : (order.status ?? "Chờ xác nhận"),
          createdAt: order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : ""
        }));
        mappedOrders.sort((a: Order, b: Order) => b.id.localeCompare(a.id));
        setOrders(mappedOrders);
      } else {
        const local = localStorage.getItem("orders");
        if (local) {
          setOrders(JSON.parse(local) as Order[]);
        }
      }
    } catch (err) {
      console.error("Failed to load user profile & wishlist data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
        await fetchData();
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "profile" || tabParam === "wishlist" || tabParam === "orders" || tabParam === "settings" || tabParam === "connections") {
      (() => setActiveTab(tabParam))();
    }
  }, [searchParams]);

  useEffect(() => {
    const orderIdParam = searchParams.get("orderId");
    if (!orderIdParam) return;
    const match = orders.find((o) => o.id === orderIdParam);
    if (match) {
      (() => setSelectedDetailOrder(match))();
    }
  }, [searchParams, orders]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No token found");

      const result = await updateProfile(token, formData);

      if (result.ok) {
        showToast("Cập nhật thông tin cá nhân thành công!", "success");
        fetchData();
      } else {
        showToast("Không thể cập nhật thông tin. Vui lòng thử lại!", "error");
      }
    } catch (err) {
      console.error("Update profile error:", err);
      showToast("Đã xảy ra lỗi khi lưu thông tin.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUploaded = async (publicUrl: string) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No token found");

      const result = await updateProfile(token, { avatarUrl: publicUrl });

      if (result.ok) {
        showToast("Cập nhật ảnh đại diện thành công!", "success");
        fetchData();
      } else {
        showToast("Không thể cập nhật ảnh đại diện. Vui lòng thử lại!", "error");
      }
    } catch (err) {
      console.error("Update avatar error:", err);
      showToast("Đã xảy ra lỗi khi lưu ảnh đại diện.", "error");
    }
  };

  const handleAvatarError = (message: string) => {
    showToast(message, "error");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Mật khẩu mới và mật khẩu xác nhận không khớp!", "warning");
      return;
    }

    if (newPassword.length < 8) {
      showToast("Mật khẩu mới phải chứa ít nhất 8 ký tự!", "warning");
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword({ oldPassword, newPassword });
      showToast("Đổi mật khẩu thành công!", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Change password error:", err);
      const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi đổi mật khẩu.";
      showToast(errMsg, "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const ok = await confirmAction({
      message: "Bạn muốn xóa sản phẩm này khỏi danh sách yêu thích?",
    });
    if (!ok) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No token found");

      const result = await removeFromWishlist(token, productId);

      if (result.ok) {
        showToast("Đã xóa sản phẩm khỏi danh sách yêu thích!", "success");
        fetchData();
      } else {
        showToast("Không thể xóa sản phẩm. Vui lòng thử lại!", "error");
      }
    } catch (err) {
      console.error("Wishlist remove error:", err);
      showToast("Đã xảy ra lỗi.", "error");
    }
  };

  if (isAuthenticated === null) {
    return (
      <main className="min-h-[60vh] flex justify-center items-center bg-slate-50 dark:bg-[#02140f] transition-colors duration-300">
        <MusicLoading message="Xác thực tài khoản..." height="150px" />
      </main>
    );
  }

  if (isAuthenticated === false) {
    return (
      <main className="min-h-[65vh] flex justify-center items-center bg-slate-50 dark:bg-[#02140f] p-6 transition-colors duration-300">
        <div className="bg-white dark:bg-[#06261d] rounded-2xl p-8 max-w-md w-full shadow-md text-center border border-slate-100 dark:border-primary-container/20">
          <span className="text-5xl block mb-4">🔒</span>
          <h1 className="font-serif text-2xl text-[#002B1F] dark:text-[#80bea6] mb-2">Đăng Nhập Để Tiếp Tục</h1>
          <p className="text-slate-600 dark:text-emerald-100/70 mb-6 leading-relaxed">
            Vui lòng đăng nhập để xem thông tin tài khoản, danh sách sản phẩm yêu thích và lịch sử mua sắm.
          </p>
          <Link href="/login">
            <button className="w-full bg-[#002B1F] dark:bg-secondary hover:bg-[#054030] dark:hover:bg-secondary-container text-white dark:text-[#002B1F] font-semibold py-3 rounded-xl transition-all shadow-sm cursor-pointer">
              Đăng Nhập
            </button>
          </Link>
        </div>
      </main>
    );
  }

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: "profile", label: "👤 Thông tin tài khoản" },
    { id: "wishlist", label: "❤️ Sản phẩm yêu thích" },
    { id: "orders", label: "📦 Đơn hàng đã mua" },
    { id: "settings", label: "⚙️ Cài đặt tài khoản" },
    { id: "connections", label: "🔗 Liên kết tài khoản" },
  ];

  return (
    <main className="bg-surface-cream dark:bg-[#02140f] min-h-screen pt-28 pb-12 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar */}
          <aside className="w-full md:w-1/4 bg-white dark:bg-[#06261d] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-primary-container/20 h-fit transition-colors duration-300">
            <div className="text-center mb-6 pb-6 border-b border-slate-100 dark:border-primary-container/20">
              <div className="flex justify-center mb-3">
                <ImagePicker
                  currentImageUrl={profile?.avatarUrl || ""}
                  uploadUrlEndpoint="/api/users/profile/avatar-upload-url"
                  authToken={authToken}
                  onUploaded={handleAvatarUploaded}
                  onError={handleAvatarError}
                  shape="circle"
                />
              </div>
              <h2 className="font-serif text-lg text-[#002B1F] dark:text-[#80bea6]">{profile?.name || "Thành viên"}</h2>
              <p className="text-xs text-slate-400 dark:text-emerald-100/50 mt-1">{profile?.email}</p>
            </div>

            <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible -mx-2 px-2 md:mx-0 md:px-0 pb-1 md:pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-full md:rounded-xl font-semibold text-xs md:text-sm transition-all text-left whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-[#002B1F] dark:bg-secondary text-white dark:text-[#002B1F] shadow-sm"
                      : "text-slate-600 dark:text-emerald-100/70 hover:bg-slate-50 dark:hover:bg-[#031d16] hover:text-slate-900 dark:hover:text-emerald-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <section className="flex-1 bg-white dark:bg-[#06261d] rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-primary-container/20 overflow-hidden transition-colors duration-300">
            {isLoadingData ? (
              <MusicLoading message="Đang tải dữ liệu..." height="300px" />
            ) : (
              <div key={activeTab} className="profile-tab-fade">
                {activeTab === "profile" ? (
                  <div>
                    <h2 className="font-serif text-xl text-[#002B1F] dark:text-[#80bea6] mb-6 pb-2 border-b border-slate-100 dark:border-primary-container/20">
                      Thông Tin Cá Nhân
                    </h2>

                    <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-emerald-100/50 uppercase tracking-wider mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            disabled
                            value={profile?.email || ""}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-[#002117]/50 border border-slate-200 dark:border-emerald-900/30 rounded-xl text-slate-400 dark:text-emerald-200/40 text-sm cursor-not-allowed focus:outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="name" className="block text-xs font-bold text-slate-500 dark:text-emerald-100/50 uppercase tracking-wider mb-2">
                            Họ và Tên
                          </label>
                          <input
                            id="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Nguyễn Văn A"
                            className={inputClasses}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-xs font-bold text-slate-500 dark:text-emerald-100/50 uppercase tracking-wider mb-2">
                          Số Điện Thoại
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="0912345678"
                          className={inputClasses}
                        />
                      </div>

                      <div>
                        <label htmlFor="address" className="block text-xs font-bold text-slate-500 dark:text-emerald-100/50 uppercase tracking-wider mb-2">
                          Địa chỉ nhận hàng mặc định
                        </label>
                        <AddressSelector
                          value={formData.address}
                          onChange={(val) => setFormData({ ...formData, address: val })}
                          disabled={isSubmitting}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#002B1F] dark:bg-secondary hover:bg-[#054030] dark:hover:bg-secondary-container text-white dark:text-[#002B1F] font-semibold px-8 py-3 rounded-xl transition-all text-sm active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                      >
                        {isSubmitting ? "Đang lưu..." : "Cập Nhật Thông Tin"}
                      </button>
                    </form>
                  </div>
                ) : activeTab === "wishlist" ? (
                  <div>
                    <h2 className="font-serif text-xl text-[#002B1F] dark:text-[#80bea6] mb-6 pb-2 border-b border-slate-100 dark:border-primary-container/20">
                      Sản Phẩm Yêu Thích Của Bạn
                    </h2>

                    {wishlist.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 dark:bg-[#031d16] rounded-2xl border border-dashed border-slate-200 dark:border-primary-container/20">
                        <span className="text-4xl block mb-3">❤️</span>
                        <p className="text-sm text-slate-500 dark:text-emerald-100/50 mb-4">Danh sách sản phẩm yêu thích đang trống.</p>
                        <Link href="/products">
                          <button className="bg-[#002B1F] dark:bg-secondary hover:bg-[#054030] dark:hover:bg-secondary-container text-white dark:text-[#002B1F] text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer">
                            Khám phá sản phẩm ngay
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlist.map((item) => (
                          <Link
                            key={item.productId}
                            href={`/products/${slugify(item.name)}-${item.productId}`}
                            className="group flex flex-col justify-between bg-white dark:bg-[#031d16] border border-gray-100 dark:border-primary-container/20 rounded-2xl overflow-hidden hover:border-[#DF9E47]/30 dark:hover:border-secondary/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="p-4 flex-1">
                              <div className="relative w-full aspect-square bg-[#F3EFEA] dark:bg-[#06261d] rounded-xl overflow-hidden mb-4">
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  fill
                                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                              <span className="text-[10px] uppercase font-bold text-[#A36B2B] dark:text-secondary tracking-widest">
                                {item.brand}
                              </span>
                              <h3 className="font-serif text-slate-800 dark:text-emerald-50 text-base font-semibold group-hover:text-[#A36B2B] dark:group-hover:text-secondary transition-colors line-clamp-2 mt-1">
                                {item.name}
                              </h3>
                              <p className="font-extrabold text-[#A36B2B] dark:text-secondary text-sm mt-2">
                                {currencyFormatter.format(item.price)}
                              </p>
                            </div>
                            <div className="p-4 border-t border-gray-100 dark:border-primary-container/20 bg-[#F3EFEA]/40 dark:bg-[#06261d]/40 flex justify-between items-center">
                              <button
                                onClick={(e) => handleRemoveFromWishlist(item.productId, e)}
                                className="text-xs text-rose-600 dark:text-rose-455 hover:text-rose-700 dark:hover:text-rose-400 font-semibold hover:underline cursor-pointer"
                              >
                                Xóa khỏi yêu thích
                              </button>
                              <span className="text-xs text-[#002B1F] dark:text-[#80bea6] font-bold group-hover:underline">
                                Xem chi tiết →
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : activeTab === "orders" ? (
                  <div>
                    <h2 className="font-serif text-xl text-[#002B1F] dark:text-[#80bea6] mb-6 pb-2 border-b border-slate-100 dark:border-primary-container/20">
                      Đơn Hàng Đã Mua
                    </h2>

                    {orders.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 dark:bg-[#031d16] rounded-2xl border border-dashed border-slate-200 dark:border-primary-container/20">
                        <span className="text-4xl block mb-3">📦</span>
                        <p className="text-sm text-slate-500 dark:text-emerald-100/50 mb-4">Bạn chưa có đơn hàng nào.</p>
                        <Link href="/products">
                          <button className="bg-[#002B1F] dark:bg-secondary hover:bg-[#054030] dark:hover:bg-secondary-container text-white dark:text-[#002B1F] text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer">
                            Khám phá sản phẩm ngay
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-6">
                          {orders
                            .slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE)
                            .map((order) => (
                              <OrderCard
                                key={order.id}
                                order={order}
                                showSummaryOnly={true}
                                onViewDetails={() => setSelectedDetailOrder(order)}
                              />
                            ))}
                        </div>
                        {orders.length > ORDERS_PER_PAGE && (
                          <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-primary-container/20">
                            <button
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-primary-container/30 text-xs font-bold text-slate-600 dark:text-emerald-100/70 hover:bg-slate-50 dark:hover:bg-[#031d16] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                              Trước
                            </button>
                            <span className="text-xs font-bold text-slate-500 dark:text-emerald-100/50">
                              Trang {currentPage} / {Math.ceil(orders.length / ORDERS_PER_PAGE)}
                            </span>
                            <button
                              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(orders.length / ORDERS_PER_PAGE), p + 1))}
                              disabled={currentPage === Math.ceil(orders.length / ORDERS_PER_PAGE)}
                              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-primary-container/30 text-xs font-bold text-slate-600 dark:text-emerald-100/70 hover:bg-slate-50 dark:hover:bg-[#031d16] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                              Sau
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : activeTab === "settings" ? (
                  <div>
                    <h2 className="font-serif text-xl text-[#002B1F] dark:text-[#80bea6] mb-6 pb-2 border-b border-slate-100 dark:border-primary-container/20">
                      Cài Đặt Tài Khoản
                    </h2>

                    {/* Section 1: Change Password */}
                    <div className="mb-8">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-emerald-100/80 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span>🔑</span> Đổi mật khẩu
                      </h3>
                      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md bg-slate-50 dark:bg-[#031d16] p-6 rounded-2xl border border-slate-100 dark:border-primary-container/20 transition-colors duration-300">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-emerald-100/50 mb-2">Mật khẩu hiện tại</label>
                          <input
                            type="password"
                            required
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-emerald-100/50 mb-2">Mật khẩu mới</label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-emerald-100/50 mb-2">Xác nhận mật khẩu mới</label>
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={inputClasses}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className="bg-[#002B1F] dark:bg-secondary hover:bg-[#054030] dark:hover:bg-secondary-container text-white dark:text-[#002B1F] font-semibold px-6 py-2.5 rounded-xl transition-all text-xs active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                        >
                          {isChangingPassword ? "Đang cập nhật..." : "Cập Nhật Mật Khẩu"}
                        </button>
                      </form>
                    </div>

                    {/* Section 2: Notifications */}
                    <div className="mb-8 border-t border-slate-100 dark:border-primary-container/20 pt-6">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-emerald-100/80 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span>🔔</span> Cấu hình nhận thông báo
                      </h3>
                      <div className="space-y-4 max-w-xl">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#031d16] rounded-2xl border border-slate-100 dark:border-primary-container/20 transition-colors duration-300">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-emerald-50">Thông báo đơn hàng</h4>
                            <p className="text-xs text-slate-500 dark:text-emerald-100/50">Nhận thông báo qua email khi trạng thái đơn hàng thay đổi</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs.emailOrder}
                              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailOrder: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-[#002117] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 dark:after:border-emerald-900/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#002B1F] dark:peer-checked:bg-secondary"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#031d16] rounded-2xl border border-slate-100 dark:border-primary-container/20 transition-colors duration-300">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-emerald-50">Cập nhật giao hàng qua SMS</h4>
                            <p className="text-xs text-slate-500 dark:text-emerald-100/50">Nhận tin nhắn SMS trực tiếp về hành trình vận chuyển đơn hàng</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs.smsShipping}
                              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, smsShipping: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-[#002117] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 dark:after:border-emerald-900/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#002B1F] dark:peer-checked:bg-secondary"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#031d16] rounded-2xl border border-slate-100 dark:border-primary-container/20 transition-colors duration-300">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-emerald-50">Email khuyến mãi & sự kiện</h4>
                            <p className="text-xs text-slate-500 dark:text-emerald-100/50">Cập nhật các chương trình ưu đãi, giảm giá và nhạc cụ mới</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs.emailPromo}
                              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailPromo: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-[#002117] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 dark:after:border-emerald-900/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#002B1F] dark:peer-checked:bg-secondary"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Interface & Language */}
                    <div className="border-t border-slate-100 dark:border-primary-container/20 pt-6">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-emerald-100/80 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span>⚙️</span> Tùy chọn hiển thị
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                        <div className="p-4 bg-slate-50 dark:bg-[#031d16] rounded-2xl border border-slate-100 dark:border-primary-container/20 transition-colors">
                          <label className="block text-xs font-bold text-slate-500 dark:text-emerald-100/50 mb-2">Giao diện (Theme)</label>
                          <select
                            value={theme}
                            onChange={(e) => setThemeExplicitly(e.target.value as "light" | "dark")}
                            className="w-full px-4 py-2 border border-slate-200 dark:border-primary-container/20 rounded-xl text-slate-800 dark:text-emerald-50 text-sm focus:outline-none bg-white dark:bg-[#06261d] transition-colors cursor-pointer"
                          >
                            <option value="light" className="bg-white dark:bg-[#06261d]">Chế độ sáng</option>
                            <option value="dark" className="bg-white dark:bg-[#06261d]">Chế độ tối</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="font-serif text-xl text-[#002B1F] dark:text-[#80bea6] mb-6 pb-2 border-b border-slate-100 dark:border-primary-container/20">
                      Tài Khoản Liên Kết
                    </h2>
                    <p className="text-slate-600 dark:text-emerald-100/70 text-sm leading-relaxed mb-6">
                      Liên kết tài khoản mạng xã hội dùng <span className="font-semibold">cùng địa chỉ email</span> để
                      đăng nhập nhanh bằng Google hoặc Facebook — vẫn là một tài khoản duy nhất, giữ nguyên
                      đơn hàng và thông tin cá nhân.
                    </p>

                    <div className="space-y-6 max-w-xl">
                      {/* Email connection */}
                      <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-[#031d16] rounded-2xl border border-slate-100 dark:border-primary-container/20 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#06261d] border border-slate-200 dark:border-primary-container/20 shrink-0">
                            <Mail className="w-5 h-5 text-slate-500 dark:text-emerald-100/70" />
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-emerald-50">Email (Tài khoản gốc)</h4>
                            <p className="text-xs text-slate-400 dark:text-emerald-100/40 mt-1">{profile?.email}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Đã kết nối
                        </span>
                      </div>

                      {/* Google Connection */}
                      <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-[#031d16] rounded-2xl border border-slate-100 dark:border-primary-container/20 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#06261d] border border-slate-200 dark:border-primary-container/20 shrink-0">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                            </svg>
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-emerald-50">Google</h4>
                            {profile?.googleLinked ? (
                              <p className="text-xs text-slate-400 dark:text-emerald-100/40 mt-1">{profile.googleEmail}</p>
                            ) : (
                              <p className="text-xs text-slate-400 dark:text-emerald-100/40 mt-1">Chưa liên kết tài khoản Google</p>
                            )}
                          </div>
                        </div>

                        {profile?.googleLinked ? (
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Đã liên kết
                            </span>
                            {/* Tài khoản đang đăng nhập thật bằng Google (qua Hosted UI OAuth) thì
                                không cho hủy liên kết bằng nút này — đó là phương thức đăng nhập
                                chính, không phải cờ liên kết thủ công. */}
                            {profile?.authProvider !== "Google" && (
                              <button
                                onClick={async () => {
                                  const ok = await confirmAction({ message: "Bạn có chắc chắn muốn hủy liên kết với tài khoản Google? Sau khi hủy, bạn sẽ không đăng nhập được bằng Google nữa (đăng nhập lại bằng Google với cùng email sẽ tự liên kết lại)." });
                                  if (ok) handleUnlinkProvider("Google");
                                }}
                                className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                              >
                                Hủy liên kết
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleLinkProvider("Google")}
                            className="bg-[#002B1F] dark:bg-secondary hover:bg-[#054030] dark:hover:bg-secondary-container text-white dark:text-[#002B1F] font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            Liên kết Google
                          </button>
                        )}
                      </div>

                      {/* Facebook Connection */}
                      <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-[#031d16] rounded-2xl border border-slate-100 dark:border-primary-container/20 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#06261d] border border-slate-200 dark:border-primary-container/20 shrink-0">
                            <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-emerald-50">Facebook</h4>
                            {profile?.facebookLinked ? (
                              <p className="text-xs text-slate-400 dark:text-emerald-100/40 mt-1">{profile.facebookEmail}</p>
                            ) : (
                              <p className="text-xs text-slate-400 dark:text-emerald-100/40 mt-1">Chưa liên kết tài khoản Facebook</p>
                            )}
                          </div>
                        </div>

                        {profile?.facebookLinked ? (
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                              Đã liên kết
                            </span>
                            {/* Tài khoản đang đăng nhập thật bằng Facebook (qua Hosted UI OAuth) thì
                                không cho hủy liên kết bằng nút này — đó là phương thức đăng nhập
                                chính, không phải cờ liên kết thủ công. */}
                            {profile?.authProvider !== "Facebook" && (
                              <button
                                onClick={async () => {
                                  const ok = await confirmAction({ message: "Bạn có chắc chắn muốn hủy liên kết với tài khoản Facebook? Sau khi hủy, bạn sẽ không đăng nhập được bằng Facebook nữa (đăng nhập lại bằng Facebook với cùng email sẽ tự liên kết lại)." });
                                  if (ok) handleUnlinkProvider("Facebook");
                                }}
                                className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                              >
                                Hủy liên kết
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleLinkProvider("Facebook")}
                            className="bg-[#002B1F] dark:bg-secondary hover:bg-[#054030] dark:hover:bg-secondary-container text-white dark:text-[#002B1F] font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            Liên kết Facebook
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

        </div>
      </div>

      <OrderDetailsModal
        isOpen={selectedDetailOrder !== null}
        order={selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes profileTabFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .profile-tab-fade {
          animation: profileTabFade 0.25s ease-out;
        }
      `}} />
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <main className="min-h-[60vh] flex justify-center items-center bg-slate-50 dark:bg-[#02140f] transition-colors duration-300">
        <MusicLoading message="Đang tải trang cá nhân..." height="150px" />
      </main>
    }>
      <ProfileContent />
    </Suspense>
  );
}
