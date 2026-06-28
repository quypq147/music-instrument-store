"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Product } from "../../types/product";
import { ProductCard } from "./ProductCard";

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

  // State for filters
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

    if (sort === "low-high") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sort === "high-low") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, search, brand, category, sort]);

  const handleResetFilters = () => {
    setSearch("");
    setBrand("all");
    setCategory("all");
    setSort("default");
    // Clear URL parameters
    router.push("/products");
  };

  return (
    <main className="product-listing-page" style={{ padding: "0 5%", maxWidth: "1280px", margin: "0 auto" }}>
      <h1 className="section-title">Danh Sách Sản Phẩm</h1>

      {initialError ? <p className="product-status">{initialError}</p> : null}

      {/* FILTER BOX */}
      <section className="filter-box">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="all">Tất cả thương hiệu</option>
          {brands.map((b) => (
            <option value={b} key={b}>
              {b}
            </option>
          ))}
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option value={cat} key={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">Sắp xếp mặc định</option>
          <option value="low-high">Giá thấp đến cao</option>
          <option value="high-low">Giá cao đến thấp</option>
        </select>

        <button
          type="button"
          className="secondary-btn"
          onClick={handleResetFilters}
          style={{ height: "46px" }}
        >
          Đặt lại
        </button>
      </section>

      {/* PRODUCTS GRID */}
      {filteredProducts.length === 0 && !initialError ? (
        <p className="product-status">Không tìm thấy sản phẩm phù hợp.</p>
      ) : (
        <section className="products" aria-label="Danh sách sản phẩm">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}
    </main>
  );
}
