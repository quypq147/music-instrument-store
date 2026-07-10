"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import "../../../components/common/AmplifyConfig";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { Heart, Star, ChevronRight, Eye } from "lucide-react";

import { useCart } from "../../../context/CartContext";
import { useToast } from "../../../context/ToastContext";
import { ProductCard } from "../../../components/product/ProductCard";
import type { Product } from "../../../../types/product";
import { getWishlist, addToWishlist, removeFromWishlist } from "../../../../lib/api/wishlist";

type ProductDetailClientProps = {
  product: Product;
};

type Rating = {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
};

const MAX_RATING_IMAGES = 3;
const MAX_RATING_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_RATING_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5 text-[#DF9E47]">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          width={size}
          height={size}
          fill={star <= Math.round(value) ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

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
  const [ratingImages, setRatingImages] = useState<File[]>([]);
  const [ratingImagePreviews, setRatingImagePreviews] = useState<string[]>([]);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [averageRating, setAverageRating] = useState(product.averageRating || 0);
  const [ratingCount, setRatingCount] = useState(product.ratingCount || 0);
  const [viewCount, setViewCount] = useState(product.viewCount || 0);

  // Comments State
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Wishlist State
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);

  // Related Products State
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // Sinh/dọn preview cho ảnh đính kèm đánh giá đã chọn (chưa upload)
  useEffect(() => {
    const urls = ratingImages.map((file) => URL.createObjectURL(file));
    setRatingImagePreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [ratingImages]);

  const fetchWishlistStatus = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;

      const result = await getWishlist(token);
      if (result.ok) {
        const found = result.data.some((item) => String(item.productId) === String(product.id));
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

  const fetchRelatedProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json() as Product[];
        const related = data
          .filter((p) => p.id !== product.id && p.type && p.type === product.type)
          .slice(0, 4);
        setRelatedProducts(related);
      }
    } catch (err) {
      console.error("Failed to fetch related products:", err);
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
    fetchRelatedProducts();

    // Ghi nhận lượt xem, chỉ 1 lần mỗi session cho mỗi sản phẩm
    const viewedKey = `viewed_${product.id}`;
    if (!sessionStorage.getItem(viewedKey)) {
      sessionStorage.setItem(viewedKey, "1");
      fetch(`/api/products/${product.id}/view`, { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (typeof data?.viewCount === "number") {
            setViewCount(data.viewCount);
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const isOutOfStock = product.inStock === false;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

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
        const result = await removeFromWishlist(token, product.id);
        if (result.ok) {
          setIsInWishlist(false);
          showToast("Đã xóa sản phẩm khỏi danh sách yêu thích!", "info");
        } else {
          showToast("Lỗi khi xóa khỏi danh sách yêu thích.", "error");
        }
      } else {
        // Add to wishlist
        const result = await addToWishlist(token, product.id);
        if (result.ok) {
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

  const handleRatingImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // cho phép chọn lại đúng file đó lần nữa nếu cần

    if (files.length + ratingImages.length > MAX_RATING_IMAGES) {
      showToast(`Chỉ được đính kèm tối đa ${MAX_RATING_IMAGES} ảnh`, "warning");
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      if (!ALLOWED_RATING_IMAGE_TYPES.includes(file.type)) {
        showToast(`${file.name}: chỉ hỗ trợ ảnh JPEG, PNG hoặc WEBP`, "warning");
        continue;
      }
      if (file.size > MAX_RATING_IMAGE_SIZE_BYTES) {
        showToast(`${file.name}: dung lượng vượt quá 5MB`, "warning");
        continue;
      }
      validFiles.push(file);
    }
    setRatingImages((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveRatingImage = (index: number) => {
    setRatingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadRatingImages = async (files: File[], token: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const presignRes = await fetch(`/api/products/${product.id}/ratings/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileType: file.type }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || "Không thể tạo link tải ảnh lên");
      }

      const { uploadUrl, fields, publicUrl } = presignData;
      const formData = new FormData();
      Object.entries(fields as Record<string, string>).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("file", file);

      const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
      if (!uploadRes.ok) {
        throw new Error(`Tải ảnh ${file.name} lên thất bại`);
      }
      urls.push(publicUrl);
    }
    return urls;
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

      const images = ratingImages.length > 0 ? await uploadRatingImages(ratingImages, token) : [];

      const res = await fetch(`/api/products/${product.id}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: ratingInput,
          comment: ratingComment,
          images,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Gửi đánh giá thất bại.", "error");
      } else {
        showToast("Cảm ơn bạn đã gửi đánh giá!", "success");
        setRatingComment("");
        setRatingImages([]);
        fetchRatingsAndComments();
      }
    } catch (err) {
      console.error("Rating submission error:", err);
      showToast(err instanceof Error ? err.message : "Đã xảy ra lỗi khi gửi đánh giá.", "error");
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
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center flex-wrap gap-1.5 text-xs font-semibold text-slate-500 dark:text-emerald-100/40 mb-6">
        <Link href="/" className="hover:text-[#A36B2B] transition-colors">Trang chủ</Link>
        <ChevronRight width={12} height={12} />
        <Link href="/products" className="hover:text-[#A36B2B] transition-colors">Sản phẩm</Link>
        {product.type && (
          <>
            <ChevronRight width={12} height={12} />
            <Link
              href={`/products?category=${encodeURIComponent(product.type)}`}
              className="hover:text-[#A36B2B] transition-colors"
            >
              {product.type}
            </Link>
          </>
        )}
        <ChevronRight width={12} height={12} />
        <span className="text-primary truncate max-w-50">{product.name}</span>
      </nav>

      <section className="bg-white dark:bg-[#06261d] p-6 md:p-10 rounded-2xl shadow-sm border border-slate-100 dark:border-primary-container/20 mb-10 transition-colors duration-300">
        <h1 className="text-3xl font-serif text-primary mb-6">{product.name}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex justify-center items-center bg-[#F3EFEA] dark:bg-[#031d16] rounded-xl p-6 border border-slate-100 dark:border-primary-container/20">
            <div className="relative w-full aspect-square max-w-120">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <span className="bg-[#F3EFEA] dark:bg-[#031d16] text-[#A36B2B] dark:text-secondary text-xs font-semibold px-2.5 py-1 rounded-full uppercase">
                  {product.type ?? product.brand}
                </span>

                {/* Rating summary next to type */}
                {ratingCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <StarRow value={averageRating} />
                    <span className="text-slate-500 dark:text-emerald-100/50 font-normal">({averageRating} / 5, {ratingCount} đánh giá)</span>
                  </div>
                )}

                {/* View count */}
                {viewCount > 0 && (
                  <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-emerald-100/50">
                    <Eye width={14} height={14} />
                    <span>{viewCount} lượt xem</span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-emerald-50 mb-4">{product.name}</h2>
              <p className="text-3xl font-extrabold text-[#A36B2B] mb-4">
                {currencyFormatter.format(product.price)}
              </p>
              <p className="text-slate-600 dark:text-emerald-100/70 leading-relaxed mb-6">{product.description}</p>

              <div className="bg-[#F3EFEA] dark:bg-[#031d16] p-4 rounded-xl border border-slate-100 dark:border-primary-container/20 space-y-2 mb-6 text-sm text-slate-700 dark:text-emerald-100/70">
                <p>
                  <strong>Thương hiệu:</strong> {product.brand}
                </p>
                {product.type ? (
                  <p>
                    <strong>Loại sản phẩm:</strong> {product.type}
                  </p>
                ) : null}
                <p>
                  <strong>Tình trạng:</strong>{" "}
                  {isOutOfStock ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">Hết hàng</span>
                  ) : (
                    <span className="text-primary font-semibold">Còn hàng</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="bg-primary hover:bg-primary-container text-white dark:text-[#002B1F] dark:bg-secondary dark:hover:bg-secondary-container font-semibold px-8 py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary"
              >
                {isOutOfStock ? "Hết Hàng" : "Thêm Vào Giỏ Hàng"}
              </button>

              <button
                onClick={handleToggleWishlist}
                disabled={isUpdatingWishlist}
                aria-label={isInWishlist ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
                className={`flex items-center gap-2 border px-6 py-3.5 rounded-xl transition-all font-semibold active:scale-[0.98] cursor-pointer ${
                  isInWishlist
                    ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/30"
                    : "border-slate-200 dark:border-primary-container/20 text-slate-700 dark:text-emerald-100/70 hover:bg-slate-50 dark:hover:bg-[#031d16]"
                }`}
              >
                <Heart width={18} height={18} fill={isInWishlist ? "currentColor" : "none"} strokeWidth={1.5} />
                {isInWishlist ? "Đã Yêu Thích" : "Yêu Thích"}
              </button>

              <Link href="/products">
                <button className="border border-slate-200 dark:border-primary-container/20 text-slate-600 dark:text-emerald-100/70 hover:bg-slate-50 dark:hover:bg-[#031d16] px-6 py-3.5 rounded-xl font-semibold transition-all cursor-pointer">
                  Quay Lại
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs for Reviews and Comments */}
      <section className="bg-white dark:bg-[#06261d] p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-primary-container/20 mb-10 transition-colors duration-300">
        <div className="border-b border-slate-100 dark:border-primary-container/20 mb-6 flex gap-8">
          <button
            onClick={() => setActiveTab("ratings")}
            className={`pb-4 font-bold text-lg border-b-2 transition-all ${
              activeTab === "ratings"
                ? "border-[#DF9E47] text-[#A36B2B]"
                : "border-transparent text-slate-500 dark:text-emerald-100/40 hover:text-slate-800 dark:hover:text-emerald-50"
            }`}
          >
            Đánh Giá từ Người Mua ({ratingCount})
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`pb-4 font-bold text-lg border-b-2 transition-all ${
              activeTab === "comments"
                ? "border-[#DF9E47] text-[#A36B2B]"
                : "border-transparent text-slate-500 dark:text-emerald-100/40 hover:text-slate-800 dark:hover:text-emerald-50"
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
              <div className="lg:col-span-1 bg-[#F3EFEA] dark:bg-[#031d16] p-6 rounded-xl border border-slate-100 dark:border-primary-container/20 h-fit">
                <h3 className="text-lg font-bold text-slate-800 dark:text-emerald-50 mb-4">Gửi Đánh Giá Của Bạn</h3>
                {user ? (
                  <form onSubmit={handleSubmitRating} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-emerald-100/70 mb-2">Số sao đánh giá:</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingInput(star)}
                            aria-label={`${star} sao`}
                            className="text-[#DF9E47] hover:scale-110 transition-transform"
                          >
                            <Star width={22} height={22} fill={star <= ratingInput ? "currentColor" : "none"} strokeWidth={1.5} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="ratingComment" className="block text-sm font-semibold text-slate-700 dark:text-emerald-100/70 mb-2">
                        Nhận xét sản phẩm:
                      </label>
                      <textarea
                        id="ratingComment"
                        rows={4}
                        placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                        className="w-full p-3 bg-white dark:bg-[#06261d] border border-slate-200 dark:border-primary-container/30 rounded-lg text-sm outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all text-gray-700 dark:text-emerald-50 placeholder:text-gray-400 dark:placeholder:text-emerald-800/40"
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-emerald-100/70 mb-2">
                        Ảnh đính kèm (tối đa {MAX_RATING_IMAGES} ảnh, mỗi ảnh &le; 5MB):
                      </label>
                      {ratingImagePreviews.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {ratingImagePreviews.map((src, index) => (
                            <div key={src} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-primary-container/30">
                              <Image src={src} alt={`Ảnh đính kèm ${index + 1}`} fill className="object-cover" unoptimized />
                              <button
                                type="button"
                                onClick={() => handleRemoveRatingImage(index)}
                                className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none cursor-pointer"
                                aria-label="Xoá ảnh"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {ratingImages.length < MAX_RATING_IMAGES && (
                        <input
                          type="file"
                          accept={ALLOWED_RATING_IMAGE_TYPES.join(",")}
                          multiple
                          onChange={handleRatingImagesChange}
                          className="w-full text-xs text-slate-500 dark:text-emerald-100/50 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white dark:file:bg-[#06261d] file:text-[#A36B2B] file:cursor-pointer cursor-pointer"
                        />
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingRating}
                      className="w-full bg-[#DF9E47] hover:bg-[#c88a3a] text-[#002B1F] font-semibold py-2.5 rounded-lg text-sm transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {isSubmittingRating ? "Đang Gửi..." : "Gửi Đánh Giá (Chỉ Dành Cho Người Đã Mua)"}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-600 dark:text-emerald-100/70 mb-4">Vui lòng đăng nhập để đánh giá sản phẩm.</p>
                    <Link href="/login">
                      <button className="bg-primary hover:bg-primary-container text-white dark:text-[#002B1F] dark:bg-secondary dark:hover:bg-secondary-container text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer">
                        Đăng Nhập Ngay
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-6">
                {ratings.length === 0 ? (
                  <div className="text-slate-500 dark:text-emerald-100/40 py-10 text-center bg-[#F3EFEA] dark:bg-[#031d16] rounded-xl border border-slate-100 dark:border-primary-container/20">
                    Chưa có đánh giá nào cho sản phẩm này. Hãy là người mua đầu tiên đánh giá!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-primary-container/20 max-h-125 overflow-y-auto pr-2">
                    {ratings.map((item, index) => (
                      <div key={index} className="py-4 first:pt-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-emerald-50 text-sm block">{item.userName}</span>
                            <StarRow value={item.rating} size={12} />
                          </div>
                          <span className="text-xs text-slate-400 dark:text-emerald-100/30">
                            {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        {item.comment ? (
                          <p className="text-slate-600 dark:text-emerald-100/70 text-sm">{item.comment}</p>
                        ) : (
                          <p className="text-slate-400 dark:text-emerald-100/30 italic text-xs">Không có bình luận chi tiết.</p>
                        )}
                        {item.images && item.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {item.images.map((src, imgIndex) => (
                              <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-primary-container/30 block">
                                <Image src={src} alt={`Ảnh đánh giá ${imgIndex + 1} của ${item.userName}`} fill className="object-cover" unoptimized />
                              </a>
                            ))}
                          </div>
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
            <div className="bg-[#F3EFEA] dark:bg-[#031d16] p-6 rounded-xl border border-slate-100 dark:border-primary-container/20">
              <h3 className="text-lg font-bold text-slate-800 dark:text-emerald-50 mb-4">Viết Bình Luận / Hỏi Đáp</h3>
              {user ? (
                <form onSubmit={handleSubmitComment} className="space-y-4">
                  <textarea
                    rows={3}
                    placeholder="Đặt câu hỏi hoặc bình luận về sản phẩm saxophone này..."
                    className="w-full p-3 bg-white dark:bg-[#06261d] border border-slate-200 dark:border-primary-container/30 rounded-lg text-sm outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all text-gray-700 dark:text-emerald-50 placeholder:text-gray-400 dark:placeholder:text-emerald-800/40"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className="bg-primary hover:bg-primary-container text-white dark:text-[#002B1F] dark:bg-secondary dark:hover:bg-secondary-container font-semibold px-6 py-2 rounded-lg text-sm transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmittingComment ? "Đang Gửi..." : "Gửi Bình Luận"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-600 dark:text-emerald-100/70 mb-3">Vui lòng đăng nhập để viết bình luận.</p>
                  <Link href="/login">
                    <button className="bg-primary hover:bg-primary-container text-white dark:text-[#002B1F] dark:bg-secondary dark:hover:bg-secondary-container text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer">
                      Đăng Nhập Ngay
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Comments List */}
            <div className="space-y-4 max-h-125 overflow-y-auto pr-2">
              {comments.length === 0 ? (
                <div className="text-slate-500 dark:text-emerald-100/40 py-10 text-center bg-[#F3EFEA] dark:bg-[#031d16] rounded-xl border border-slate-100 dark:border-primary-container/20">
                  Chưa có bình luận nào cho sản phẩm này. Đặt câu hỏi đầu tiên!
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((item, index) => (
                    <div key={index} className="bg-[#F3EFEA]/50 dark:bg-[#031d16]/30 p-4 rounded-xl border border-slate-100 dark:border-primary-container/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-800 dark:text-emerald-50 text-sm">{item.userName}</span>
                        <span className="text-xs text-slate-400 dark:text-emerald-100/30">
                          {new Date(item.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-emerald-100/70 text-sm leading-relaxed">{item.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl text-primary mb-6">Sản Phẩm Liên Quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
