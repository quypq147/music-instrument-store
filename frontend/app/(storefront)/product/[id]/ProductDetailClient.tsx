"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import "../../../components/common/AmplifyConfig";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useRouter } from "next/navigation";

import { useCart } from "../../../context/CartContext";
import { useToast } from "../../../context/ToastContext";
import type { Product } from "../../../../types/product";

type ProductDetailClientProps = {
  product: Product;
};

type Rating = {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type Comment = {
  commentId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  // Authentication State
  const [user, setUser] = useState<{ userId: string; username: string } | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"ratings" | "comments">("ratings");

  // Ratings State
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingInput, setRatingInput] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [averageRating, setAverageRating] = useState(product.averageRating || 0);
  const [ratingCount, setRatingCount] = useState(product.ratingCount || 0);

  // Comments State
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Wishlist State
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);

  const fetchWishlistStatus = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;

      const res = await fetch("/api/users/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        interface WishlistItem {
          productId: string | number;
        }
        const wishlist = await res.json() as WishlistItem[];
        const found = wishlist.some((item) => String(item.productId) === String(product.id));
        setIsInWishlist(found);
      }
    } catch (err) {
      console.error("Failed to check wishlist status:", err);
    }
  };

  const fetchRatingsAndComments = async () => {
    try {
      // Fetch ratings
      const ratingsRes = await fetch(`/api/products/${product.id}/ratings`);
      if (ratingsRes.ok) {
        const data = await ratingsRes.json();
        setRatings(data);
        if (data.length > 0) {
          const sum = data.reduce((acc: number, r: Rating) => acc + r.rating, 0);
          setAverageRating(parseFloat((sum / data.length).toFixed(1)));
          setRatingCount(data.length);
        }
      }

      // Fetch comments
      const commentsRes = await fetch(`/api/products/${product.id}/comments`);
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Failed to fetch reviews/comments:", err);
    }
  };

  useEffect(() => {
    // Check if user is signed in
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // Fetch wishlist status
        fetchWishlistStatus();
      } catch {
        setUser(null);
      }
    };

    checkUser();
    fetchRatingsAndComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const handleAddToCart = () => {
    addToCart({
      id: Number(product.id),
      name: product.name,
      price: currencyFormatter.format(product.price),
      image: product.imageUrl,
      quantity: 1,
    });

    showToast(`Đã thêm ${product.name} vào giỏ hàng!`, "success");
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      showToast("Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!", "warning");
      router.push("/login");
      return;
    }

    setIsUpdatingWishlist(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No token found");

      if (isInWishlist) {
        // Remove from wishlist
        const res = await fetch(`/api/users/wishlist/${product.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          setIsInWishlist(false);
          showToast("Đã xóa sản phẩm khỏi danh sách yêu thích!", "info");
        } else {
          showToast("Lỗi khi xóa khỏi danh sách yêu thích.", "error");
        }
      } else {
        // Add to wishlist
        const res = await fetch("/api/users/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: product.id }),
        });
        if (res.ok) {
          setIsInWishlist(true);
          showToast("Đã thêm sản phẩm vào danh sách yêu thích!", "success");
        } else {
          showToast("Lỗi khi thêm vào danh sách yêu thích.", "error");
        }
      }
    } catch (err) {
      console.error("Wishlist action failed:", err);
      showToast("Đã xảy ra lỗi. Vui lòng thử lại sau!", "error");
    } finally {
      setIsUpdatingWishlist(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("Vui lòng đăng nhập để đánh giá!", "warning");
      return;
    }

    setIsSubmittingRating(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No token found");

      const res = await fetch(`/api/products/${product.id}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: ratingInput,
          comment: ratingComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Gửi đánh giá thất bại.", "error");
      } else {
        showToast("Cảm ơn bạn đã gửi đánh giá!", "success");
        setRatingComment("");
        fetchRatingsAndComments();
      }
    } catch (err) {
      console.error("Rating submission error:", err);
      showToast("Đã xảy ra lỗi khi gửi đánh giá.", "error");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("Vui lòng đăng nhập để bình luận!", "warning");
      return;
    }

    if (!commentInput.trim()) {
      showToast("Vui lòng nhập nội dung bình luận.", "warning");
      return;
    }

    setIsSubmittingComment(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No token found");

      const res = await fetch(`/api/products/${product.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: commentInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Gửi bình luận thất bại.", "error");
      } else {
        showToast("Gửi bình luận thành công!", "success");
        setCommentInput("");
        fetchRatingsAndComments();
      }
    } catch (err) {
      console.error("Comment submission error:", err);
      showToast("Đã xảy ra lỗi khi gửi bình luận.", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <main className="product-detail-page max-w-7xl mx-auto px-4 py-8">
      <section className="yamaha-style-detail bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-100 mb-10">
        <h1 className="yamaha-product-title text-3xl font-bold text-emerald-950 mb-6">{product.name}</h1>

        <div className="yamaha-detail-layout grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="yamaha-left flex justify-center items-center bg-slate-50 rounded-xl p-6 border border-slate-100">
            <div className="yamaha-main-image relative w-full aspect-square max-w-120">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="yamaha-right flex flex-col justify-between">
            <div className="yamaha-tab-content">
              <div className="flex items-center gap-4 mb-2">
                <span className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">
                  {product.type ?? product.brand}
                </span>
                
                {/* Rating summary next to type */}
                {ratingCount > 0 && (
                  <div className="flex items-center text-amber-500 font-semibold text-sm">
                    {"★".repeat(Math.round(averageRating))}
                    {"☆".repeat(5 - Math.round(averageRating))}
                    <span className="text-slate-500 ml-1.5 font-normal">({averageRating} / 5, {ratingCount} đánh giá)</span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">{product.name}</h2>
              <p className="product-detail-price text-3xl font-extrabold text-amber-700 mb-4">
                {currencyFormatter.format(product.price)}
              </p>
              <p className="product-detail-desc text-slate-600 leading-relaxed mb-6">{product.description}</p>

              <div className="product-detail-meta bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 mb-6 text-sm text-slate-700">
                <p>
                  <strong>Thương hiệu:</strong> {product.brand}
                </p>
                {product.type ? (
                  <p>
                    <strong>Loại sản phẩm:</strong> {product.type}
                  </p>
                ) : null}
                <p>
                  <strong>Tình trạng:</strong> <span className="text-emerald-700 font-semibold">Còn hàng</span>
                </p>
              </div>
            </div>

            <div className="product-detail-actions flex flex-wrap gap-4 mt-6">
              <button 
                onClick={handleAddToCart}
                className="bg-emerald-900 hover:bg-emerald-950 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                Thêm Vào Giỏ Hàng
              </button>

              <button
                onClick={handleToggleWishlist}
                disabled={isUpdatingWishlist}
                className={`flex items-center gap-2 border px-6 py-3.5 rounded-xl transition-all font-semibold active:scale-[0.98] ${
                  isInWishlist
                    ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="text-lg">{isInWishlist ? "❤️" : "🤍"}</span>
                {isInWishlist ? "Đã Yêu Thích" : "Yêu Thích"}
              </button>

              <Link href="/products">
                <button className="back-btn border border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-3.5 rounded-xl font-semibold transition-all">
                  Quay Lại
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs for Reviews and Comments */}
      <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 mb-10">
        <div className="border-b border-slate-100 mb-6 flex gap-8">
          <button
            onClick={() => setActiveTab("ratings")}
            className={`pb-4 font-bold text-lg border-b-2 transition-all ${
              activeTab === "ratings"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Đánh Giá từ Người Mua ({ratingCount})
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`pb-4 font-bold text-lg border-b-2 transition-all ${
              activeTab === "comments"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Hỏi Đáp & Bình Luận ({comments.length})
          </button>
        </div>

        {/* Tab content: Ratings */}
        {activeTab === "ratings" && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Rating Form */}
              <div className="lg:col-span-1 bg-slate-50 p-6 rounded-xl border border-slate-100 h-fit">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Gửi Đánh Giá Của Bạn</h3>
                {user ? (
                  <form onSubmit={handleSubmitRating} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Số sao đánh giá:</label>
                      <div className="flex gap-2 text-2xl">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingInput(star)}
                            className="text-amber-400 hover:scale-110 transition-transform"
                          >
                            {star <= ratingInput ? "★" : "☆"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="ratingComment" className="block text-sm font-semibold text-slate-700 mb-2">
                        Nhận xét sản phẩm:
                      </label>
                      <textarea
                        id="ratingComment"
                        rows={4}
                        placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingRating}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-all disabled:opacity-60"
                    >
                      {isSubmittingRating ? "Đang Gửi..." : "Gửi Đánh Giá (Chỉ Dành Cho Người Đã Mua)"}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-600 mb-4">Vui lòng đăng nhập để đánh giá sản phẩm.</p>
                    <Link href="/login">
                      <button className="bg-emerald-950 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-900">
                        Đăng Nhập Ngay
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-6">
                {ratings.length === 0 ? (
                  <div className="text-slate-500 py-10 text-center bg-slate-50 rounded-xl border border-slate-100">
                    Chưa có đánh giá nào cho sản phẩm này. Hãy là người mua đầu tiên đánh giá!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2">
                    {ratings.map((item, index) => (
                      <div key={index} className="py-4 first:pt-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">{item.userName}</span>
                            <span className="text-amber-500 text-xs font-bold">
                              {"★".repeat(item.rating)}
                              {"☆".repeat(5 - item.rating)}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        {item.comment ? (
                          <p className="text-slate-600 text-sm">{item.comment}</p>
                        ) : (
                          <p className="text-slate-400 italic text-xs">Không có bình luận chi tiết.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab content: Comments */}
        {activeTab === "comments" && (
          <div className="space-y-6">
            {/* Comment Form */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Viết Bình Luận / Hỏi Đáp</h3>
              {user ? (
                <form onSubmit={handleSubmitComment} className="space-y-4">
                  <textarea
                    rows={3}
                    placeholder="Đặt câu hỏi hoặc bình luận về sản phẩm saxophone này..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className="bg-emerald-900 hover:bg-emerald-950 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-all disabled:opacity-60"
                  >
                    {isSubmittingComment ? "Đang Gửi..." : "Gửi Bình Luận"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-600 mb-3">Vui lòng đăng nhập để viết bình luận.</p>
                  <Link href="/login">
                    <button className="bg-emerald-950 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-900">
                      Đăng Nhập Ngay
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Comments List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {comments.length === 0 ? (
                <div className="text-slate-500 py-10 text-center bg-slate-50 rounded-xl border border-slate-100">
                  Chưa có bình luận nào cho sản phẩm này. Đặt câu hỏi đầu tiên!
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((item, index) => (
                    <div key={index} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-800 text-sm">{item.userName}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">{item.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

    </main>
  );
}
