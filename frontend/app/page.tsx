import Image from "next/image";
import Link from "next/link";
 
import { ProductCard } from "./components/ProductCard";
import { getProducts } from "../lib/products";
import HomeRedirect from "./components/HomeRedirect";
 
export default async function Home() {
  const { products, error } = await getProducts();
  const heroProduct = products[0];
 
  // Get unique categories
  const categories = Array.from(
    new Set(products.map((p) => p.type).filter(Boolean))
  ) as string[];
  // Featured brands with slogans matching the luxury design
  const brandsData = [
    { name: "Yamaha", slogan: "SOUND. PASSION. PERFECTION." },
    { name: "Selmer", slogan: "LEGENDARY SINCE 1885" },
    { name: "Conn", slogan: "INNOVATION IN EVERY NOTE" },
    { name: "Yanagisawa", slogan: "MASTERPIECE OF JAPAN" },
    { name: "Jupiter", slogan: "PLAY. INSPIRE. CREATE." }
  ];
  // Slice first 4 products for featured section
  const featuredProducts = products.slice(0, 4);
 
  // S3 base URL for brand logos
  const bucketName = process.env.S3_BUCKET_NAME || "cdk-hnb659fds-assets-112613858653-ap-southeast-1";
  const s3BaseUrl = `https://${bucketName}.s3.ap-southeast-1.amazonaws.com`;
 
  return (
    <main className="home-page">
      <HomeRedirect />
      <style dangerouslySetInnerHTML={{ __html: `
        .home-page {
          background-color: #05100c;
          color: #fff;
          font-family: var(--font-sans), sans-serif;
          overflow-x: hidden;
        }
        .hero-dark {
          position: relative;
          min-height: 90vh;
          display: flex;
          align-items: center;
          padding: 0 5%;
          overflow: hidden;
        }
        .hero-bg-glow {
          position: absolute;
          top: -20%;
          right: -10%;
          width: 60%;
          height: 100%;
          background: radial-gradient(circle, rgba(223, 158, 71, 0.15) 0%, rgba(5,16,12,0) 70%);
          z-index: 0;
        }
        .hero-content {
          position: relative;
          z-index: 10;
          width: 50%;
          padding-right: 2rem;
        }
        .hero-image-container {
          position: relative;
          z-index: 10;
          width: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .hero-badge-dark {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(223, 158, 71, 0.3);
          color: #DF9E47;
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 2rem;
        }
        .hero-title-dark {
          font-family: var(--font-serif), serif;
          font-size: 5.5rem;
          line-height: 1.1;
          color: #fff;
          margin-bottom: 1rem;
          font-weight: 400;
        }
        .hero-title-dark span {
          display: block;
        }
        .hero-separator {
          width: 60px;
          height: 2px;
          background-color: #DF9E47;
          margin-bottom: 1.5rem;
        }
        .hero-desc-dark {
          color: #9CA3AF;
          font-size: 1.1rem;
          line-height: 1.6;
          max-width: 80%;
          margin-bottom: 3rem;
        }
        .hero-stats-grid {
          display: flex;
          gap: 3rem;
          margin-bottom: 3rem;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .stat-icon {
          color: #DF9E47;
          margin-bottom: 8px;
        }
        .stat-num {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 0.65rem;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .hero-buttons {
          display: flex;
          gap: 1rem;
        }
        .btn-gold {
          background-color: #DF9E47;
          color: #05100c;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          text-decoration: none;
        }
        .btn-gold:hover { background-color: #c98c3e; }
        .btn-outline {
          background-color: transparent;
          color: #fff;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          cursor: pointer;
          transition: border-color 0.2s;
          text-decoration: none;
        }
        .btn-outline:hover { border-color: #DF9E47; color: #DF9E47; }
        
        .trust-bar-container {
          position: absolute;
          bottom: -40px;
          left: 5%;
          right: 5%;
          z-index: 20;
        }
        .trust-bar {
          background-color: #0a1612;
          border: 1px solid rgba(223, 158, 71, 0.2);
          border-radius: 16px;
          padding: 2rem 3rem;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .trust-icon {
          color: #DF9E47;
        }
        .trust-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .trust-desc {
          font-size: 0.7rem;
          color: #888;
        }
        .category-section-dark {
          padding-top: 8rem !important; /* Make room for overlapping trust bar */
        }
        
        /* Overrides for other sections to match dark theme */
        .home-page h2 { color: #DF9E47 !important; }
        .category-image-card, .brand-logo-card { 
          background: #0a1612 !important; 
          border: 1px solid rgba(255,255,255,0.05); 
          color: #fff; 
        }
        .category-image-card:hover { border-color: #DF9E47; }
        .category-image-card p { color: #fff !important; }
        
        .section-header { text-align: center; margin-bottom: 3rem; }
        .home-page h2 { font-family: var(--font-serif), serif; font-size: 2.2rem; color: #DF9E47 !important; margin-bottom: 0.5rem; font-weight: 400; }
        .section-separator { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 1rem; }
        .sep-line { width: 40px; height: 1px; background-color: rgba(223, 158, 71, 0.5); }
        .section-subtitle { color: #9CA3AF; font-size: 0.95rem; font-weight: 300; }
        
        .brand-logo-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.5rem; padding: 0 5%; }
        .brand-card-luxury { background: linear-gradient(180deg, rgba(223,158,71,0.05) 0%, rgba(5,16,12,0.8) 100%); border: 1px solid rgba(223, 158, 71, 0.2); border-radius: 8px; padding: 2.5rem 1rem 1.5rem 1rem; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-decoration: none; transition: transform 0.3s, border-color 0.3s; height: 200px; position: relative; z-index: 1; }
        .brand-card-luxury:hover { transform: translateY(-5px); border-color: rgba(223, 158, 71, 0.6); }
        .brand-logo-wrapper { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; }
        .brand-sep-dot { width: 4px; height: 4px; background-color: #DF9E47; border-radius: 50%; margin: 1rem 0 0.8rem 0; transform: rotate(45deg); }
        .brand-slogan { color: #DF9E47; font-size: 0.55rem; letter-spacing: 1px; text-transform: uppercase; text-align: center; font-weight: 600; margin: 0; }
        
        .category-section-dark { padding: 8rem 0 4rem 0 !important; position: relative; }
        .brand-section, .featured-section { padding: 4rem 0; position: relative; }
        .category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; padding: 0 5%; }
        
        .btn-outline-gold { background-color: transparent; color: #DF9E47; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(223,158,71,0.4); cursor: pointer; transition: background 0.2s, color 0.2s; text-decoration: none; position: relative; z-index: 1; }
        .btn-outline-gold:hover { background-color: rgba(223,158,71,0.1); border-color: #DF9E47; }
        
        .section-bg-glow-left { position: absolute; left: -10%; top: 20%; width: 40%; height: 60%; background: radial-gradient(circle, rgba(223,158,71,0.08) 0%, rgba(5,16,12,0) 70%); z-index: 0; pointer-events: none; }
        .section-bg-glow-right { position: absolute; right: -10%; bottom: 10%; width: 40%; height: 60%; background: radial-gradient(circle, rgba(223,158,71,0.08) 0%, rgba(5,16,12,0) 70%); z-index: 0; pointer-events: none; }
        
        .page-bg-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 0; background-image: url('/images/hinh duoi trang chu.jpg'); background-size: 80%; background-position: right center; background-repeat: no-repeat; opacity: 0.12; mix-blend-mode: lighten; }
        
        .section-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3.5rem; padding: 0 5%; gap: 2rem; }
        .section-header-row h2 { font-family: var(--font-serif), serif; font-size: 2.2rem; color: #DF9E47 !important; margin: 0; font-weight: 400; flex: 1; text-align: left; }
        .section-separator-flex { display: flex; align-items: center; justify-content: center; gap: 16px; flex: 1; }
        .sep-line-flex { width: 80px; height: 1px; background-color: rgba(223, 158, 71, 0.4); }
        .section-subtitle-flex { color: #9CA3AF; font-size: 0.95rem; font-weight: 300; margin: 0; flex: 1; text-align: right; }
      `}} />
      <div className="page-bg-overlay"></div>
      
      {/* HERO */}
      <section className="hero-dark">
        <div className="hero-bg-glow"></div>
        <div className="hero-content">
          <div className="hero-badge-dark">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15l-3 3-3-3M6 15V5a2 2 0 012-2h8a2 2 0 012 2v10l-3-3-3 3z"/></svg>
            Nhạc cụ chính hãng
          </div>

          <h1 className="hero-title-dark">
            <span>Aureate</span>
            <span>Forest</span>
          </h1>

          <div className="hero-separator"></div>

          <p className="hero-desc-dark">
            Saxophone chất lượng cao, âm thanh chuẩn, bảo hành uy tín cho người
            mới học đến nghệ sĩ chuyên nghiệp.
          </p>

          <div className="hero-stats-grid">
            <div className="stat-item">
              <svg className="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              <div className="stat-num">500+</div>
              <div className="stat-label">Khách hàng</div>
            </div>

            <div className="stat-item">
              <svg className="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <div className="stat-num">{products.length || "100+"}</div>
              <div className="stat-label">Sản phẩm</div>
            </div>

            <div className="stat-item">
              <svg className="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <div className="stat-num">4.9</div>
              <div className="stat-label">Đánh giá</div>
            </div>

            <div className="stat-item">
              <svg className="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <div className="stat-num">24 tháng</div>
              <div className="stat-label">Bảo hành</div>
            </div>
          </div>

          <div className="hero-buttons">
            <Link href="/products" className="btn-gold">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              Mua ngay
            </Link>

            <Link href="/products" className="btn-outline">
              Xem sản phẩm
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>

        <div className="hero-image-container" style={{ width: '55%', position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 5 }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Fade the left edge of the image so it blends smoothly into the dark background */}
            <Image
              src="/images/cay dan trang chu.jpg"
              alt="Aureate Forest Saxophone"
              fill
              style={{ 
                objectFit: 'cover', 
                objectPosition: 'left center',
                maskImage: 'linear-gradient(to right, transparent 0%, black 20%)', 
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%)' 
              }}
              priority
              unoptimized
            />
          </div>
        </div>

        {/* TRUST BAR OVERLAY */}
        <div className="trust-bar-container">
          <div className="trust-bar">
            <div className="trust-item">
              <svg className="trust-icon" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <div>
                <div className="trust-title">Hàng chính hãng</div>
                <div className="trust-desc">Cam kết 100% chính hãng</div>
              </div>
            </div>
            
            <div className="trust-item">
              <svg className="trust-icon" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              <div>
                <div className="trust-title">Giao hàng toàn quốc</div>
                <div className="trust-desc">Freeship đơn hàng từ 1.000.000đ</div>
              </div>
            </div>

            <div className="trust-item">
              <svg className="trust-icon" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M18 15a4 4 0 11-8 0 4 4 0 018 0zM4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              <div>
                <div className="trust-title">Tư vấn chuyên nghiệp</div>
                <div className="trust-desc">Hỗ trợ 24/7 tận tâm</div>
              </div>
            </div>

            <div className="trust-item">
              <svg className="trust-icon" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              <div>
                <div className="trust-title">Đổi trả dễ dàng</div>
                <div className="trust-desc">Trong 7 ngày nếu lỗi từ NSX</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? <p className="product-status">{error}</p> : null}

      {/* CATEGORIES GRID */}
      <section className="category-section category-section-dark">
        <div className="section-bg-glow-left"></div>
        <div className="section-header-row" style={{ position: 'relative', zIndex: 1 }}>
          <h2>Danh Mục Sản Phẩm</h2>
          <div className="section-separator-flex">
            <span className="sep-line-flex"></span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="#DF9E47" style={{ transform: 'rotate(45deg)' }}><rect x="6" y="6" width="12" height="12" /></svg>
            <span className="sep-line-flex"></span>
          </div>
          <p className="section-subtitle-flex">Khám phá các dòng nhạc cụ chất lượng cao, phù hợp với mọi phong cách</p>
        </div>
        
        <div className="category-grid" style={{ position: 'relative', zIndex: 1 }}>
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
        <div className="section-bg-glow-right"></div>
        <div className="section-header-row" style={{ position: 'relative', zIndex: 1 }}>
          <h2>Thương Hiệu Nổi Bật</h2>
          <div className="section-separator-flex">
            <span className="sep-line-flex"></span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="#DF9E47" style={{ transform: 'rotate(45deg)' }}><rect x="6" y="6" width="12" height="12" /></svg>
            <span className="sep-line-flex"></span>
          </div>
          <p className="section-subtitle-flex">Chúng tôi tự hào phân phối những thương hiệu nhạc cụ hàng đầu thế giới</p>
        </div>

        <div className="brand-logo-grid" style={{ position: 'relative', zIndex: 1 }}>
          {brandsData.map((brand) => (
            <Link 
              href={`/products?brand=${encodeURIComponent(brand.name)}`} 
              key={brand.name} 
              className="brand-card-luxury"
            >
              <div className="brand-logo-wrapper">
                <Image 
                  src={`${s3BaseUrl}/logos/${brand.name.toLowerCase()}-logo.png`} 
                  alt={`${brand.name} logo`} 
                  width={140} 
                  height={60} 
                  style={{ objectFit: "contain", maxHeight: "100%", filter: "grayscale(100%) invert(1) contrast(2)", mixBlendMode: "screen" }}
                />
              </div>
              <div className="brand-sep-dot"></div>
              <p className="brand-slogan">{brand.slogan}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS (NO FILTERS) */}
      <section className="featured-section" style={{ paddingBottom: "8rem" }}>
        <div className="section-bg-glow-left"></div>
        <div className="section-header-row" style={{ position: 'relative', zIndex: 1 }}>
          <h2>Sản Phẩm Nổi Bật</h2>
          <div className="section-separator-flex">
            <span className="sep-line-flex"></span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="#DF9E47" style={{ transform: 'rotate(45deg)' }}><rect x="6" y="6" width="12" height="12" /></svg>
            <span className="sep-line-flex"></span>
          </div>
          <div style={{ flex: 1 }}></div> {/* Empty flex item to balance the 3-column row */}
        </div>

        <div className="products" style={{ position: 'relative', zIndex: 1 }}>
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p className="product-status" style={{ textAlign: 'center', color: '#888' }}>Không có sản phẩm nào nổi bật.</p>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "4rem", position: 'relative', zIndex: 1 }}>
          <Link href="/products" className="btn-outline-gold">
            XEM TẤT CẢ SẢN PHẨM
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
