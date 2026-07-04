import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "../components/product/ProductCard";
import { getProducts } from "../../lib/products";
import HomeRedirect from "../components/common/HomeRedirect";

export default async function Home() {
  const { products, error } = await getProducts();
  const categories = Array.from(
    new Set(products.map((p) => p.type).filter(Boolean))
  ) as string[];
  const brandsData = [
    { name: "Yamaha", slogan: "SOUND. PASSION. PERFECTION." },
    { name: "Selmer", slogan: "LEGENDARY SINCE 1885" },
    { name: "Conn", slogan: "INNOVATION IN EVERY NOTE" },
    { name: "Yanagisawa", slogan: "MASTERPIECE OF JAPAN" },
    { name: "Jupiter", slogan: "PLAY. INSPIRE. CREATE." }
  ];
  const hasViewData = products.some((p) => (p.viewCount || 0) > 0);
  const featuredProducts = hasViewData
    ? [...products].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 4)
    : products.slice(0, 4);
  const bucketName = process.env.S3_BUCKET_NAME || "cdk-hnb659fds-assets-112613858653-ap-southeast-1";
  const s3BaseUrl = `https://${bucketName}.s3.ap-southeast-1.amazonaws.com`;

  return (
    <main className="min-h-screen bg-surface-cream dark:bg-[#02140f] pt-16 md:pt-20 transition-colors duration-300">
      <HomeRedirect />

      {/* HERO */}
      <section
        className="relative w-full overflow-hidden"
        style={{ background: "linear-gradient(135deg, #001A12 0%, #053324 100%)" }}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-luminosity">
          <Image
            src="/images/cay dan trang chu.jpg"
            alt="Saxophone"
            fill
            style={{ objectFit: "cover", objectPosition: "right center" }}
            priority
            unoptimized
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-r from-[#001A12] via-[#001A12]/80 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-24 py-24 md:py-36">
          <p className="text-[#DF9E47] font-sans font-bold tracking-[0.3em] uppercase text-xs md:text-sm mb-4">
            Aureate Forest Boutique
          </p>
          <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight max-w-2xl">
            Aureate Forest
          </h1>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-px bg-[#DF9E47]" />
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#DF9E47" style={{ transform: "rotate(45deg)" }}>
              <rect x="6" y="6" width="12" height="12" />
            </svg>
            <div className="w-12 h-px bg-[#DF9E47]" />
          </div>
          <p className="text-gray-300 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-light">
            Saxophone chất lượng cao, âm thanh chuẩn, bảo hành uy tín cho người mới học đến nghệ sĩ chuyên nghiệp.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/products"
              className="bg-[#DF9E47] text-[#002B1F] font-bold text-sm uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-white transition-colors shadow-[0_8px_20px_rgba(223,158,71,0.25)]"
            >
              Mua ngay
            </Link>
            <Link
              href="/products"
              className="border border-white/30 text-white font-bold text-sm uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-white/10 transition-colors"
            >
              Xem sản phẩm
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-surface-cream dark:bg-[#02140f] py-20 md:py-28 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-24">
          <div className="text-center mb-14">
            <p className="text-[#A36B2B] font-sans font-bold tracking-[0.3em] uppercase text-xs mb-3">
              Bộ Sưu Tập
            </p>
            <h2 className="text-3xl md:text-4xl font-serif text-primary">Danh Mục Sản Phẩm</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat) => {
              const product = products.find((p) => p.type === cat);
              return (
                <Link
                  key={cat}
                  href={`/products?category=${encodeURIComponent(cat)}`}
                  className="group flex flex-col bg-white dark:bg-[#06261d] rounded-2xl overflow-hidden border border-gray-100 dark:border-primary-container/20 hover:border-[#DF9E47]/40 hover:shadow-[0_10px_40px_-10px_rgba(223,158,71,0.2)] transition-all duration-300"
                >
                  <div className="relative w-full aspect-square bg-[#F3EFEA] dark:bg-[#031d16] overflow-hidden">
                    {product && (
                      <Image
                        src={product.imageUrl}
                        alt={cat}
                        fill
                        className="object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="font-serif text-primary text-lg font-semibold group-hover:text-[#A36B2B] transition-colors">
                      {cat}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="bg-[#F3EFEA] dark:bg-[#031d16] py-20 md:py-28 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-24">
          <div className="text-center mb-14">
            <p className="text-[#A36B2B] font-sans font-bold tracking-[0.3em] uppercase text-xs mb-3">
              Đối Tác Uy Tín
            </p>
            <h2 className="text-3xl md:text-4xl font-serif text-primary">Thương Hiệu Nổi Bật</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {brandsData.map((brand) => (
              <Link
                key={brand.name}
                href={`/products?brand=${encodeURIComponent(brand.name)}`}
                className="group flex flex-col items-center justify-center bg-white dark:bg-[#06261d] rounded-2xl border border-gray-100 dark:border-primary-container/20 hover:border-[#DF9E47]/40 hover:shadow-[0_10px_40px_-10px_rgba(223,158,71,0.2)] transition-all duration-300 p-8"
              >
                <div className="relative w-full h-14 mb-4">
                  <Image
                    src={`${s3BaseUrl}/logos/${brand.name.toLowerCase()}-logo.png`}
                    alt={`${brand.name} logo`}
                    fill
                    className="object-contain grayscale group-hover:grayscale-0 transition-all duration-300 dark:invert"
                  />
                </div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#A36B2B] text-center">
                  {brand.slogan}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-surface-cream dark:bg-[#02140f] py-20 md:py-28 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-24">
          <div className="text-center mb-14">
            <p className="text-[#A36B2B] font-sans font-bold tracking-[0.3em] uppercase text-xs mb-3">
              Tuyển Chọn
            </p>
            <h2 className="text-3xl md:text-4xl font-serif text-primary">Sản Phẩm Nổi Bật</h2>
          </div>
          {error ? (
            <p className="text-center text-gray-500">{error}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
                {featuredProducts.length > 0 ? (
                  featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                ) : (
                  <p className="text-center text-gray-500">Không có sản phẩm nào nổi bật.</p>
                )}
              </div>
              <div className="text-center">
                <Link
                  href="/products"
                  className="inline-block border border-primary text-primary font-bold text-sm uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-primary hover:text-white dark:hover:text-[#02140f] transition-all"
                >
                  Xem tất cả sản phẩm
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
