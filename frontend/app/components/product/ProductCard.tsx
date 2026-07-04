"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import type { Product } from "../../../types/product";

type ProductCardProps = {
  product: Product;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const isOutOfStock = product.inStock === false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newWishlisted = !isWishlisted;
    setIsWishlisted(newWishlisted);
    
    if (newWishlisted) {
      showToast(`Đã thêm ${product.name} vào danh sách yêu thích!`, "success");
    } else {
      showToast(`Đã xóa ${product.name} khỏi danh sách yêu thích!`, "info");
    }
  };

  const averageRating = product.averageRating || 0;
  const ratingCount = product.ratingCount || 0;

  return (
    <article 
      className="relative flex flex-col bg-white dark:bg-[#06261d] rounded-2xl overflow-hidden transition-all duration-300 border border-gray-100 dark:border-primary-container/20 hover:border-[#DF9E47]/30 hover:-translate-y-1 group"
      style={{ boxShadow: isHovered ? '0 10px 40px -10px rgba(223,158,71,0.15)' : 'none' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        href={`/product/${product.id}`} 
        className="block relative w-full bg-[#F3EFEA] dark:bg-[#031d16] overflow-hidden"
        style={{ paddingTop: '85%' }}
      >
        <div className="absolute inset-6 md:inset-8">
          <Image
            src={product.imageUrl || "/placeholder.jpg"}
            alt={product.name}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {isOutOfStock && (
          <span className="absolute top-4 left-4 z-10 bg-slate-800/85 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
            Hết hàng
          </span>
        )}

        {/* Wishlist Heart */}
        <button
          onClick={handleWishlist}
          aria-label={isWishlisted ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
          className="absolute top-4 right-4 z-10 flex items-center justify-center transition-colors"
        >
          <Heart width="20" height="20" fill={isWishlisted ? "#A36B2B" : "none"} stroke="#A36B2B" strokeWidth={1.5} />
        </button>
      </Link>

      <div className="p-5 flex flex-col grow">
        <p className="text-[10px] font-bold text-[#A36B2B] tracking-widest uppercase mb-1.5">
          {product.brand}
        </p>

        <Link href={`/product/${product.id}`} className="block">
          <h3 className="font-serif text-primary text-lg leading-snug font-semibold line-clamp-2 mb-2 group-hover:text-[#A36B2B] transition-colors" style={{ minHeight: '3.5rem' }}>
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          {ratingCount > 0 ? (
            <>
              <div className="flex text-[#DF9E47]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    width="12"
                    height="12"
                    fill={star <= Math.round(averageRating) ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <span className="text-[11px] text-gray-500 dark:text-emerald-100/50">({ratingCount} đánh giá)</span>
            </>
          ) : (
            <span className="text-[11px] text-gray-400 dark:text-emerald-100/40">Chưa có đánh giá</span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between">
          <p className="text-[#A36B2B] font-bold text-lg">
            {currencyFormatter.format(product.price)}
          </p>
          
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-10 h-10 rounded-lg bg-primary text-white hover:bg-primary-container dark:bg-secondary dark:text-[#002B1F] dark:hover:bg-secondary-container transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary"
            title={isOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
            aria-label={isOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
          >
            <ShoppingCart width="18" height="18" />
          </button>
        </div>
      </div>
    </article>
  );
}
