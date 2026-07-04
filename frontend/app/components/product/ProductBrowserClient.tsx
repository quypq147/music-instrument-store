"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, ChevronDown, RotateCcw } from "lucide-react";
import type { Product } from "../../../types/product";
import { ProductCard } from "./ProductCard";
import { Pagination } from "../common/Pagination";

interface ProductBrowserClientProps {
  products: Product[];
  initialError: string | null;
}

export function ProductBrowserClient({
  products,
  initialError,
}: ProductBrowserClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const qParam = searchParams.get("q") || "";
  const brandParam = searchParams.get("brand") || "all";
  const catParam = searchParams.get("category") || "all";

  const [search, setSearch] = useState(qParam);
  const [brand, setBrand] = useState(brandParam);
  const [category, setCategory] = useState(catParam);
  const [sort, setSort] = useState("default");

  const [prevParams, setPrevParams] = useState({
    q: qParam,
    brand: brandParam,
    category: catParam,
  });

  if (
    qParam !== prevParams.q ||
    brandParam !== prevParams.brand ||
    catParam !== prevParams.category
  ) {
    setPrevParams({ q: qParam, brand: brandParam, category: catParam });
    setSearch(qParam);
    setBrand(brandParam);
    setCategory(catParam);
  }

  // List of brands
  const brands = ["Yamaha", "Selmer", "Conn", "Yanagisawa", "Jupiter"];

  // Unique categories dynamically extracted
  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.type).filter(Boolean))
      ) as string[],
    [products]
  );

  // Filtered & Sorted products list
  const filteredProducts = useMemo(() => {
    const normSearch = search.trim().toLowerCase();

    let result = products.filter((product) => {
      const matchSearch =
        !normSearch ||
        product.name.toLowerCase().includes(normSearch) ||
        product.brand.toLowerCase().includes(normSearch) ||
        product.description.toLowerCase().includes(normSearch);

      const matchBrand = brand === "all" || product.brand === brand;
      const matchCategory = category === "all" || product.type === category;

      return matchSearch && matchBrand && matchCategory;
    });

    if (sort === "price-asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sort === "rating-desc") {
      result = [...result].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sort === "views-desc") {
      result = [...result].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }

    return result;
  }, [products, search, brand, category, sort]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset pagination to page 1 whenever filters change
  const filterKey = `${search}-${brand}-${category}-${sort}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setCurrentPage(1);
  }

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleResetFilters = () => {
    setSearch("");
    setBrand("all");
    setCategory("all");
    setSort("default");
    router.push("/products");
  };

  return (
    <main className="min-h-screen bg-surface-cream dark:bg-[#02140f] pt-16 md:pt-20 transition-colors duration-300">
      {/* HERO SECTION */}
      <section
        className="relative w-full py-16 md:py-24 px-6 lg:px-24 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #001A12 0%, #053324 100%)" }}
      >
        {/* Background Image */}
        <div className="absolute top-0 right-0 w-2/3 h-full z-0 opacity-40 mix-blend-luminosity mask-gradient-left">
          <Image
            src="/images/cay dan trang chu.jpg"
            alt="Saxophone Background"
            fill
            style={{ objectFit: "cover", objectPosition: "left center" }}
            priority
            unoptimized
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-r from-[#001A12] via-[#001A12]/80 to-transparent z-0"></div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-serif text-[#DF9E47] mb-6 tracking-wide drop-shadow-md">
            Danh Sách Sản Phẩm
          </h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-px bg-[#DF9E47]"></div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#DF9E47" style={{ transform: "rotate(45deg)" }}><rect x="6" y="6" width="12" height="12" /></svg>
            <div className="w-12 h-px bg-[#DF9E47]"></div>
          </div>

          <p className="text-gray-300 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-light">
            Khám phá bộ sưu tập nhạc cụ cao cấp được tuyển chọn dành cho bạn.
          </p>
        </div>
      </section>

      {/* FILTER BAR - Positioned below hero section */}
      <section className="relative z-20 px-4 md:px-6 lg:px-24 -mt-6 md:-mt-12">
        <div className="bg-white/95 dark:bg-[#06261d]/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_-10px_rgba(223,158,71,0.15)] border border-gray-100 dark:border-primary-container/20 p-4 md:p-6 transition-colors duration-300">
          <div className="flex flex-wrap lg:flex-nowrap gap-4 items-center">

            {/* Search */}
            <div className="relative flex-1 w-full min-w-50">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-emerald-700/50" width="20" height="20" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 dark:bg-[#031d16]/50 border border-gray-200 dark:border-primary-container/30 rounded-xl outline-none focus:border-[#DF9E47] focus:ring-1 focus:ring-[#DF9E47] transition-all text-sm text-gray-700 dark:text-emerald-50 placeholder:text-gray-400 dark:placeholder:text-emerald-800/40"
              />
            </div>

            {/* Brand Dropdown */}
            <div className="relative w-full md:w-48 shrink-0 min-w-38">
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50/50 dark:bg-[#031d16]/50 border border-gray-200 dark:border-primary-container/30 rounded-xl outline-none focus:border-[#DF9E47] appearance-none text-sm text-gray-700 dark:text-emerald-50 cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-[#06261d]">Tất cả thương hiệu</option>
                {brands.map((b) => <option value={b} key={b} className="bg-white dark:bg-[#06261d]">{b}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" />
            </div>

            {/* Category Dropdown */}
            <div className="relative w-full md:w-48 shrink-0 min-w-38">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50/50 dark:bg-[#031d16]/50 border border-gray-200 dark:border-primary-container/30 rounded-xl outline-none focus:border-[#DF9E47] appearance-none text-sm text-gray-700 dark:text-emerald-50 cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-[#06261d]">Tất cả danh mục</option>
                {categories.map((c) => <option value={c} key={c} className="bg-white dark:bg-[#06261d]">{c}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative w-full md:w-48 shrink-0 min-w-38">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50/50 dark:bg-[#031d16]/50 border border-gray-200 dark:border-primary-container/30 rounded-xl outline-none focus:border-[#DF9E47] appearance-none text-sm text-gray-700 dark:text-emerald-50 cursor-pointer"
              >
                <option value="default" className="bg-white dark:bg-[#06261d]">Sắp xếp mặc định</option>
                <option value="price-asc" className="bg-white dark:bg-[#06261d]">Giá: Thấp đến Cao</option>
                <option value="price-desc" className="bg-white dark:bg-[#06261d]">Giá: Cao đến Thấp</option>
                <option value="rating-desc" className="bg-white dark:bg-[#06261d]">Đánh giá cao nhất</option>
                <option value="views-desc" className="bg-white dark:bg-[#06261d]">Xem nhiều nhất</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" />
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetFilters}
              className="w-full md:w-auto px-6 py-3.5 bg-[#001A12] dark:bg-secondary text-[#DF9E47] dark:text-[#002B1F] border border-[#DF9E47]/30 hover:bg-[#002B1F] dark:hover:bg-secondary-container rounded-xl text-sm font-bold tracking-widest transition-colors flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
            >
              <RotateCcw width="16" height="16" />
              ĐẶT LẠI
            </button>

          </div>
        </div>
      </section>

      {/* PRODUCTS GRID */}
      <section className="px-6 lg:px-24 py-16">
        {initialError && !initialError.includes("Mock Data") && (
          <p className="text-red-500 bg-red-50 p-4 rounded-xl mb-8 border border-red-100">{initialError}</p>
        )}
        
        {filteredProducts.length === 0 && !initialError ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1} />
            <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm phù hợp.</p>
          </div>
        ) : (
          <>
            <div key={currentPage} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12 animate-slide-up">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* PAGINATION CONTROLS */}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .mask-gradient-left {
          mask-image: linear-gradient(to right, transparent 0%, black 30%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 30%);
        }
      `}} />
    </main>
  );
}
