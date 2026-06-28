import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "./components/ProductCard";
import { getProducts } from "../lib/products";

export default async function Home() {
  const { products, error } = await getProducts();
  const heroProduct = products[0];

  // Get unique categories
  const categories = Array.from(
    new Set(products.map((p) => p.type).filter(Boolean))
  ) as string[];

  // Featured brands
  const brands = ["Yamaha", "Selmer", "Conn", "Yanagisawa", "Jupiter"];

  // Slice first 4 products for featured section
  const featuredProducts = products.slice(0, 4);

  // S3 base URL for brand logos
  const bucketName = process.env.S3_BUCKET_NAME || "cdk-hnb659fds-assets-112613858653-ap-southeast-1";
  const s3BaseUrl = `https://${bucketName}.s3.ap-southeast-1.amazonaws.com`;

  return (
    <main className="home-page">
      {/* HERO */}
      <section className="premium-hero">
        <div className="premium-content">
          <span className="hero-badge">Nhạc cụ chính hãng</span>

          <h1>Aureate Forest</h1>

          <p>
            Saxophone chất lượng cao, âm thanh chuẩn, bảo hành uy tín cho người
            mới học đến nghệ sĩ chuyên nghiệp.
          </p>

          <div className="hero-stats">
            <div>
              <strong>500+</strong>
              <span>Khách hàng</span>
            </div>

            <div>
              <strong>{products.length || "100+"}</strong>
              <span>Sản phẩm</span>
            </div>

            <div>
              <strong>4.9</strong>
              <span>Đánh giá</span>
            </div>

            <div>
              <strong>24 tháng</strong>
              <span>Bảo hành</span>
            </div>
          </div>

          <div className="hero-actions">
            <Link href="/products">
              <button className="primary-btn">Mua ngay</button>
            </Link>

            <Link href="/products">
              <button className="secondary-btn">Xem sản phẩm</button>
            </Link>
          </div>
        </div>

        {heroProduct ? (
          <div className="premium-image-box">
            <div className="glow"></div>
            <Image
              src={heroProduct.imageUrl}
              alt={heroProduct.name}
              width={640}
              height={640}
              className="premium-sax"
              priority
            />
          </div>
        ) : null}
      </section>

      {error ? <p className="product-status">{error}</p> : null}

      {/* CATEGORIES GRID */}
      <section className="category-section">
        <h2>Danh Mục Sản Phẩm</h2>
        <div className="category-grid">
          {categories.map((cat) => {
            const product = products.find((p) => p.type === cat);
            return (
              <Link 
                href={`/products?category=${encodeURIComponent(cat)}`} 
                key={cat} 
                className="category-image-card"
              >
                {product ? (
                  <Image src={product.imageUrl} alt={cat} width={320} height={220} />
                ) : null}
                <p>{cat}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* BRANDS GRID */}
      <section className="brand-section">
        <h2>Thương Hiệu Nổi Bật</h2>
        <div className="brand-logo-grid">
          {brands.map((brand) => (
            <Link 
              href={`/products?brand=${encodeURIComponent(brand)}`} 
              key={brand} 
              className="brand-logo-card"
            >
              <Image 
                src={`${s3BaseUrl}/logos/${brand.toLowerCase()}.png`} 
                alt={`${brand} logo`} 
                width={120} 
                height={50} 
                style={{ objectFit: "contain", maxHeight: "100%" }}
              />
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS (NO FILTERS) */}
      <section className="featured-section" style={{ paddingBottom: "5rem" }}>
        <h2 className="section-title">Sản Phẩm Nổi Bật</h2>

        <div className="products">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p className="product-status">Không có sản phẩm nào nổi bật.</p>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
          <Link href="/products">
            <button className="primary-btn" style={{ padding: "16px 40px", fontSize: "14px" }}>
              Xem tất cả sản phẩm
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}
