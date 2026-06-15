
"use client";
import { useCart } from "../../context/CartContext";
import { use } from "react";

const products = [
  {
    id: 1,
    name: "Yamaha YAS-280",
    price: "35.800.000đ",
    image: "/images/yamaha-yas280.jpg",
    description:
      "Yamaha YAS-280 là mẫu Saxophone Alto nổi tiếng dành cho người mới học và người chơi bán chuyên. Âm thanh sáng, dễ thổi và độ bền cao.",
    brand: "Yamaha",
    type: "Alto Saxophone",
  },
  {
    id: 2,
    name: "Selmer AS500",
    price: "51.000.000đ",
    image: "/images/selmer-as500.jpg",
    description:
      "Selmer AS500 mang đến âm thanh cân bằng, thiết kế sang trọng và cảm giác bấm phím thoải mái.",
    brand: "Selmer",
    type: "Alto Saxophone",
  },
  {
    id: 3,
    name: "Conn Director",
    price: "12.000.000đ",
    image: "/images/conn-as650.jpg",
    description:
      "Conn Director là dòng saxophone cổ điển với âm sắc ấm áp, phù hợp nhạc Jazz và hòa tấu.",
    brand: "Conn",
    type: "Alto Saxophone",
  },
  {
    id: 4,
    name: "Yamaha YTS-280",
    price: "42.000.000đ",
    image: "/images/yamaha-yts280.jpg",
    description:
      "Yamaha YTS-280 là mẫu Tenor Saxophone chất lượng cao với âm thanh mạnh mẽ và dễ kiểm soát.",
    brand: "Yamaha",
    type: "Tenor Saxophone",
  },
  {
    id: 5,
    name: "Selmer Supreme",
    price: "95.000.000đ",
    image: "/images/selmer-supreme.jpg",
    description:
      "Selmer Supreme là dòng kèn cao cấp dành cho nghệ sĩ chuyên nghiệp với chất âm xuất sắc.",
    brand: "Selmer",
    type: "Professional Saxophone",
  },
  {
    id: 6,
    name: "Conn New Wonder",
    price: "28.000.000đ",
    image: "/images/conn-newwoner.jpg",
    description:
      "Conn New Wonder là mẫu saxophone cổ điển nổi tiếng từ những năm 1920.",
    brand: "Conn",
    type: "Vintage Saxophone",
  },
];

export default function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const product = products.find(
    (p) => p.id === Number(id)
  );
  const { addToCart } = useCart();
  

  if (!product) {
    return (
      <div style={{ padding: "50px" }}>
        <h1>Không tìm thấy sản phẩm</h1>
      </div>
    );
  }
  
  
  
 


  return (
    <div className="detail-container">
      <div className="detail-card">

        <div className="detail-image-box">
          <img
            src={product.image}
            alt={product.name}
            className="detail-image"
          />
        </div>

        <div className="detail-info">
          <h1>{product.name}</h1>

          <p className="detail-price">
            {product.price}
          </p>

          <div className="product-meta">
            <p>
              <strong>Thương hiệu:</strong> {product.brand}
            </p>

            <p>
              <strong>Loại:</strong> {product.type}
            </p>

            <p>
              <strong>Tình trạng:</strong> Còn hàng
            </p>
          </div>

          <div className="description">
            <h3>Mô tả sản phẩm</h3>

            <p>
              {product.description}
            </p>
          </div>

          <div className="button-group">
            
 <button
  className="buy-btn"
  onClick={() =>
   addToCart({
  id: product.id,
  name: product.name,
  price: product.price,
  image: product.image,
  quantity: 1,
})
  }
>
  🛒 Thêm vào giỏ hàng
</button>

           <a
  href={`https://zalo.me/0703705421?text=Tôi muốn tư vấn sản phẩm ${product.name}`}
  target="_blank"
>
  <button className="contact-btn">
    📞 Liên hệ Zalo
  </button>
</a>
          </div>
        </div>

      </div>
    </div>
  );
}