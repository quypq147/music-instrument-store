"use client";

import { useCart } from "../context/CartContext";

export default function CartButton() {
  const { totalItems } = useCart();

  return (
    <a href="/cart" className="cart-btn-header">
      🛒 Giỏ Hàng ({totalItems})
    </a>
  );
}