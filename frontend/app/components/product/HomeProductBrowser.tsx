"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { Product } from "../../../types/product";

type HomeProductBrowserProps = {
  products: Product[];
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const brands = ["Yamaha", "Selmer", "Conn", "Yanagisawa", "Jupiter"];

export function HomeProductBrowser({ products }: HomeProductBrowserProps) {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState("default");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => product.type).filter(Boolean))
      ) as string[],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    let result = products.filter((product) => {
      const matchSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.brand.toLowerCase().includes(normalizedSearch);
      const matchBrand = brand === "all" || product.brand === brand;
      const matchCategory = category === "all" || product.type === category;

      return matchSearch && matchBrand && matchCategory;
    });

    if (sort === "low-high") {
      result = [...result].sort((a, b) => a.price - b.price);
    }

    if (sort === "high-low") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [brand, category, products, search, sort]);

  const scrollToProducts = () => {
    setTimeout(() => {
      document
        .getElementById("product-list")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <>
      <section className="category-section">
        <h2>Danh Mục Sản Phẩm</h2>

        <div className="category-grid">
          {categories.map((item) => {
            const product = products.find((candidate) => candidate.type === item);

            return (
              <button
                type="button"
                className={`category-image-card ${
                  category === item ? "active-category" : ""
                }`}
                key={item}
                onClick={() => {
                  setCategory(item);
                  scrollToProducts();
                }}
              >
                {product ? (
                  <Image src={product.imageUrl} alt={item} width={320} height={220} />
                ) : null}
                <p>{item}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="brand-section">
        <h2>Thương Hiệu Nổi Bật</h2>

        <div className="brand-logo-grid">
          {brands.map((item) => (
            <button
              key={item}
              type="button"
              className="brand-logo-card"
              onClick={() => {
                setBrand(item);
                setCategory("all");
                scrollToProducts();
              }}
            >
              <span>{item}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="filter-box" id="product-list">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={brand} onChange={(event) => setBrand(event.target.value)}>
          <option value="all">Tất cả thương hiệu</option>
          {brands.map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="default">Sắp xếp mặc định</option>
          <option value="low-high">Giá thấp đến cao</option>
          <option value="high-low">Giá cao đến thấp</option>
        </select>

        <button
          type="button"
          className="secondary-btn"
          onClick={() => {
            setBrand("all");
            setCategory("all");
            setSearch("");
          }}
        >
          Xem tất cả
        </button>
      </section>

      <h2 className="section-title">
        {category === "all" ? "Sản Phẩm Nổi Bật" : category}
      </h2>

      <section className="products">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <article className="card" key={product.id}>
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={420}
                height={320}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />

              <p className="product-type">{product.type ?? product.brand}</p>

              <h3>{product.name}</h3>

              <p className="price">{currencyFormatter.format(product.price)}</p>

              <Link href={`/product/${product.id}`}>
                <button>Xem Chi Tiết</button>
              </Link>
            </article>
          ))
        ) : (
          <p className="empty-text">Không tìm thấy sản phẩm phù hợp.</p>
        )}
      </section>
    </>
  );
}
