"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const products = [
  // ALTO SAXOPHONE
  {
    id: 1,
    name: "Yamaha YAS-280",
    brand: "Yamaha",
    type: "Alto Saxophone",
    price: 35800000,
    image: "/images/yamaha-yas280.jpg",
  },
  {
    id: 2,
    name: "Selmer AS500",
    brand: "Selmer",
    type: "Alto Saxophone",
    price: 51000000,
    image: "/images/selmer-as500.jpg",
  },
  {
    id: 3,
    name: "Conn AS650",
    brand: "Conn",
    type: "Alto Saxophone",
    price: 12000000,
    image: "/images/conn-as650.jpg",
  },

  // TENOR SAXOPHONE
  {
    id: 4,
    name: "Yamaha YTS-280",
    brand: "Yamaha",
    type: "Tenor Saxophone",
    price: 42000000,
    image: "/images/yamaha-yts280.jpg",
  },
  {
    id: 5,
    name: "Selmer TS400",
    brand: "Selmer",
    type: "Tenor Saxophone",
    price: 58000000,
    image: "/images/selmer-ts400.jpg",
  },
  {
    id: 6,
    name: "Jupiter JTS700",
    brand: "Jupiter",
    type: "Tenor Saxophone",
    price: 35000000,
    image: "/images/jupiter-jts700.jpg",
  },

  // SOPRANO SAXOPHONE
  {
    id: 7,
    name: "Yamaha YSS475",
    brand: "Yamaha",
    type: "Soprano Saxophone",
    price: 56000000,
    image: "/images/yamaha-yss475.jpg",
  },
  {
    id: 8,
    name: "Yanagisawa S901",
    brand: "Yanagisawa",
    type: "Soprano Saxophone",
    price: 72000000,
    image: "/images/yanagisawa-s901.jpg",
  },
  {
    id: 9,
    name: "Jupiter JSS1000",
    brand: "Jupiter",
    type: "Soprano Saxophone",
    price: 39000000,
    image: "/images/jupiter-jss1000.jpg",
  },

  // MOUTHPIECE
  {
    id: 10,
    name: "Yamaha 4C Mouthpiece",
    brand: "Yamaha",
    type: "Mouthpiece",
    price: 1200000,
    image: "/images/yamaha-4c-mouthpiece.jpg",
  },
  {
    id: 11,
    name: "Selmer S80 Mouthpiece",
    brand: "Selmer",
    type: "Mouthpiece",
    price: 2500000,
    image: "/images/selmer-s80-mouthpiece.jpg",
  },
  {
    id: 12,
    name: "Vandoren AL3 Mouthpiece",
    brand: "Vandoren",
    type: "Mouthpiece",
    price: 2800000,
    image: "/images/vandoren-al3-mouthpiece.jpg",
  },

  // PHỤ KIỆN
{
  id: 13,
  name: "Dây Đeo Saxophone",
  brand: "Yamaha",
  type: "Phụ Kiện",
  price: 350000,
  image: "/images/day-deo-saxophone.jpg",
},
{
  id: 14,
  name: "Bộ Vệ Sinh Saxophone",
  brand: "Conn",
  type: "Phụ Kiện",
  price: 450000,
  image: "/images/bo-ve-sinh-saxophone.jpg",
},
{
  id: 15,
  name: "Reed Alto Saxophone",
  brand: "Vandoren",
  type: "Phụ Kiện",
  price: 250000,
  image: "/images/reed-alto-saxophone.jpg",
},
  // YAMAHA
{
  id: 16,
  name: "Yamaha YSS-475",
  brand: "Yamaha",
  type: "Soprano Saxophone",
  price: 56000000,
  image: "/images/yamaha-yss475.jpg",
},
{
  id: 17,
  name: "Yamaha 4C Mouthpiece",
  brand: "Yamaha",
  type: "Mouthpiece",
  price: 1200000,
  image: "/images/yamaha-4c-mouthpiece.jpg",
},

// SELMER
{
  id: 18,
  name: "Selmer Supreme",
  brand: "Selmer",
  type: "Alto Saxophone",
  price: 95000000,
  image: "/images/selmer-supreme.jpg",
},

// CONN
{
  id: 19,
  name: "Conn New Wonder",
  brand: "Conn",
  type: "Tenor Saxophone",
  price: 28000000,
  image: "/images/conn-newwoner.jpg",
},

// YANAGISAWA
{
  id: 20,
  name: "Yanagisawa AWO1",
  brand: "Yanagisawa",
  type: "Alto Saxophone",
  price: 68000000,
  image: "/images/yanagisawa-awo1.jpg",
},
{
  id: 21,
  name: "Yanagisawa AWO1 Pro",
  brand: "Yanagisawa",
  type: "Alto Saxophone",
  price: 73000000,
  image: "/images/yanagisawa-awo1-1.jpg",
},

// JUPITER
{
  id: 22,
  name: "Jupiter JAS700",
  brand: "Jupiter",
  type: "Alto Saxophone",
  price: 31000000,
  image: "/images/jupiter-jas700.jpg",
},
{
  id: 23,
  name: "Jupiter JAS700 Pro",
  brand: "Jupiter",
  type: "Alto Saxophone",
  price: 34000000,
  image: "/images/jupiter-jas700-1.jpg",
},
];

const categoryItems = [
  {
    name: "Alto Saxophone",
    image: "/images/yamaha-yas280.jpg",
    value: "Alto Saxophone",
  },
  {
    name: "Tenor Saxophone",
    image: "/images/yamaha-yts280.jpg",
    value: "Tenor Saxophone",
  },
  {
    name: "Soprano Saxophone",
    image: "/images/selmer-as500.jpg",
    value: "Soprano Saxophone",
  },
  {
    name: "Mouthpiece",
    image: "/images/mouthpiece.jpg",
    value: "Mouthpiece",
  },
  {
    name: "Phụ Kiện",
    image: "/images/accessory.jpg",
    value: "Phụ Kiện",
  },
];

const brands = [
  {
    name: "Yamaha",
    image: "/images/yamaha-logo.png",
  },
  {
    name: "Selmer",
    image: "/images/selmer-logo.png",
  },
  {
    name: "Conn",
    image: "/images/conn-logo.png",
  },
  {
    name: "Yanagisawa",
    image: "/images/yanagisawa-logo.png",
  },
  {
    name: "Jupiter",
    image: "/images/jupiter-logo.png",
  },
];

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + "đ";
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState("default");
  const [category, setCategory] = useState("all");

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchBrand = brand === "all" || product.brand === brand;

      const matchCategory =
        category === "all" || product.type === category;

      return matchSearch && matchBrand && matchCategory;
    });

    if (sort === "low-high") {
  result = [...result].sort((a, b) => a.price - b.price);
}

if (sort === "high-low") {
  result = [...result].sort((a, b) => b.price - a.price);
}

    return result;
  }, [search, brand, sort, category]);

  const handleCategoryClick = (value: string) => {
    setCategory(value);

    setTimeout(() => {
      document
        .getElementById("product-list")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <main className="home-page">
      <section className="premium-hero">
        <div className="premium-content">
          <span className="hero-badge"> Nhạc cụ chính hãng</span>

          <h1>NhomTTTN Music</h1>

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
              <strong>100+</strong>
              <span>Sản phẩm</span>
            </div>

            <div>
              <strong>4.9★</strong>
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

        <div className="premium-image-box">
          <div className="glow"></div>
          <img
            src="/images/yamaha-yas280.jpg"
            alt="Saxophone"
            className="premium-sax"
          />
        </div>
      </section>

      <section className="category-section">
        <h2>Danh Mục Sản Phẩm</h2>

        <div className="category-grid">
          {categoryItems.map((item) => (
            <button
              type="button"
              className={`category-image-card ${
                category === item.value ? "active-category" : ""
              }`}
              key={item.name}
              onClick={() => handleCategoryClick(item.value)}
            >
              <img src={item.image} alt={item.name} />
              <p>{item.name}</p>
            </button>
          ))}
        </div>
      </section>

     <section className="brand-section">
  <h2>Thương Hiệu Nổi Bật</h2>

  <div className="brand-logo-grid">
    {brands.map((item) => (
      <button
        key={item.name}
        type="button"
        className="brand-logo-card"
        onClick={() => {
          setBrand(item.name);
          setCategory("all");

          setTimeout(() => {
            document
              .getElementById("product-list")
              ?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }}
      >
        <img src={item.image} alt={item.name} />
      </button>
    ))}
  </div>
</section>

      <section className="why-section">
        <h2>Tại Sao Chọn Chúng Tôi</h2>

        <div className="why-grid">
          <div className="why-card">
            <span></span>
            <h3>Giao hàng toàn quốc</h3>
            <p>Nhanh chóng, đóng gói an toàn.</p>
          </div>

          <div className="why-card">
            <span></span>
            <h3>Bảo hành chính hãng</h3>
            <p>Hỗ trợ bảo hành rõ ràng, uy tín.</p>
          </div>

          <div className="why-card">
            <span></span>
            <h3>Trả góp 0%</h3>
            <p>Thanh toán linh hoạt, dễ sở hữu.</p>
          </div>

          <div className="why-card">
            <span></span>
            <h3>Tư vấn chuyên nghiệp</h3>
            <p>Hỗ trợ chọn kèn phù hợp nhu cầu.</p>
          </div>
        </div>
      </section>

      <section className="filter-box" id="product-list">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="all">Tất cả thương hiệu</option>
          <option value="Yamaha">Yamaha</option>
          <option value="Selmer">Selmer</option>
          <option value="Conn">Conn</option>
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">Sắp xếp mặc định</option>
          <option value="low-high">Giá thấp đến cao</option>
          <option value="high-low">Giá cao đến thấp</option>
        </select>

        <button
          type="button"
          className="secondary-btn"
          onClick={() => setCategory("all")}
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
            <div className="card" key={product.id}>
              <img src={product.image} alt={product.name} />

              <p className="product-type">{product.type}</p>

              <h3>{product.name}</h3>

              <p className="price">{formatPrice(product.price)}</p>

              <Link href={`/product/${product.id}`}>
                <button>Xem Chi Tiết</button>
              </Link>
            </div>
          ))
        ) : (
          <p className="empty-text">Không tìm thấy sản phẩm phù hợp.</p>
        )}
      </section>

      <section className="review-section">
        <h2>Đánh Giá Khách Hàng</h2>

        <div className="review-grid">
          <div className="review-card">
            <div className="stars">★★★★★</div>
            <p>“Tư vấn rất nhiệt tình, phù hợp cho người mới học.”</p>
            <span>Duy Thanh</span>
          </div>

          <div className="review-card">
            <div className="stars">★★★★★</div>
            <p>“Giao hàng nhanh, đóng gói kỹ, sản phẩm đẹp.”</p>
            <span>Hải Thiên</span>
          </div>

          <div className="review-card">
            <div className="stars">★★★★★</div>
            <p>“Âm thanh tuyệt vời, nhân viên hỗ trợ sản phẩm tốt.”</p>
            <span>Bá Thiện</span>
          </div>
        </div>
      </section>
    </main>
  );
}