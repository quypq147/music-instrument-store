"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import type { Product } from "../../types/product";

type ProductCardProps = {
  product: Product;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // In case the card acts as a link (if we wrap card in Link)
    e.stopPropagation();

    addToCart({
      id: Number(product.id),
      name: product.name,
      price: currencyFormatter.format(product.price),
      image: product.imageUrl,
      quantity: 1,
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <article className="card relative">
      <Link href={`/product/${product.id}`} className="product-card-image">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={420}
          height={320}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      </Link>

      <p className="product-type">{product.brand}</p>

      <h3>{product.name}</h3>

      <p className="product-description">{product.description}</p>

      <p className="price">{currencyFormatter.format(product.price)}</p>

      <button type="button" onClick={handleAddToCart}>
        Thêm vào giỏ hàng
      </button>

      {showSuccess ? (
        <div className="cart-success-toast" style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
          Đã thêm {product.name} vào giỏ hàng.
        </div>
      ) : null}
    </article>
  );
}
