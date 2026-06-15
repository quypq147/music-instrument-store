"use client";

export default function Home() {

  const products = [
  {
    id: 1,
    name: "Yamaha YAS-280",
    price: "35.800.000đ",
    image: "/images/yamaha-yas280.jpg",
  },
  {
    id: 2,
    name: "Selmer AS500",
    price: "51.000.000đ",
    image: "/images/selmer-as500.jpg",
  },
  {
    id: 3,
    name: "Conn Director",
    price: "12.000.000đ",
    image: "/images/conn-as650.jpg",
  },
  {
    id: 4,
    name: "Yamaha YTS-280",
    price: "42.000.000đ",
    image: "/images/yamaha-yts280.jpg",
  },
  {
    id: 5,
    name: "Selmer Supreme",
    price: "95.000.000đ",
    image: "/images/selmer-supreme.jpg",
  },
  {
    id: 6,
    name: "Conn New Wonder",
    price: "28.000.000đ",
    image: "/images/conn-newwoner.jpg",
  },
];

  return (
    <div>

      <h2 className="section-title">
        Sản Phẩm Nổi Bật
      </h2>

      <section className="products">
        {products.map((product) => (
          <div
            className="card"
            key={product.id}
          >
            <img
              src={product.image}
              alt={product.name}
            />

            <h3>{product.name}</h3>

            <p className="price">
              {product.price}
            </p>

            <a href={`/product/${product.id}`}>
              <button>
                Xem Chi Tiết
              </button>
            </a>
          </div>
        ))}
      </section>

    </div>
  );
}