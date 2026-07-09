"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "../../../types/product";

type Props = {
  products: Product[];
};

export function FeaturedProductsCarousel({ products }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    if (products.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % products.length);
    }, 4000); // auto slide every 4s

    return () => clearInterval(interval);
  }, [products.length, isPaused]);

  if (!products || products.length === 0) {
    return <p className="text-center text-gray-500">Không có sản phẩm nào nổi bật.</p>;
  }

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // swipe threshold in px

    if (diff > threshold) {
      nextSlide();
    } else if (diff < -threshold) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="w-full">
      {/* Desktop/Tablet Grid View */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Mobile Automatic Carousel View */}
      <div 
        className="block sm:hidden relative w-full mb-12"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="overflow-hidden rounded-2xl w-full py-2">
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {products.map((product) => (
              <div key={product.id} className="w-full shrink-0 px-2">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Manual Navigation buttons */}
        {products.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-[#031d16]/80 hover:bg-white dark:hover:bg-[#031d16] text-primary p-2 rounded-full shadow-md z-10 transition-all border-none focus:outline-none cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-emerald-55" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-[#031d16]/80 hover:bg-white dark:hover:bg-[#031d16] text-primary p-2 rounded-full shadow-md z-10 transition-all border-none focus:outline-none cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 text-slate-700 dark:text-emerald-55" />
            </button>
          </>
        )}

        {/* Indicators/Dots */}
        {products.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2.5 h-2.5 rounded-full border-none p-0 cursor-pointer transition-all ${
                  activeIndex === index 
                    ? "bg-[#DF9E47] scale-110" 
                    : "bg-slate-300 dark:bg-emerald-900/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
