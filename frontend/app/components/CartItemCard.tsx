"use client";

import Image from "next/image";
import type { CartItem } from "../../types/cart";

interface CartItemCardProps {
  item: CartItem;
  index: number;
  isSelected: boolean;
  onToggleSelect: (index: number) => void;
  onIncrease: (index: number) => void;
  onDecrease: (index: number) => void;
  onRemove: (index: number) => void;
}

const getPriceNumber = (price: string) =>
  Number(String(price).replace(/[^\d]/g, ""));

export function CartItemCard({
  item,
  index,
  isSelected,
  onToggleSelect,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemCardProps) {
  const itemPrice = getPriceNumber(item.price);
  const quantity = item.quantity || 1;
  const totalPrice = itemPrice * quantity;

  return (
    <div className="cart-item-card">
      <input
        type="checkbox"
        className="cart-checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(index)}
      />

      <Image
        src={item.image}
        alt={item.name}
        width={120}
        height={120}
        className="cart-item-img"
      />

      <div className="cart-item-info">
        <h3>{item.name}</h3>
        <p className="cart-item-brand">
          Chính hãng • Bảo hành uy tín
        </p>
        <p className="cart-item-price">{item.price}</p>

        <div className="quantity-box">
          <button type="button" onClick={() => onDecrease(index)}>
            -
          </button>
          <span>{quantity}</span>
          <button type="button" onClick={() => onIncrease(index)}>
            +
          </button>
        </div>
      </div>

      <div className="cart-item-total">
        <p>{totalPrice.toLocaleString("vi-VN")}đ</p>

        <button
          type="button"
          className="delete-btn"
          onClick={() => onRemove(index)}
        >
          Xóa
        </button>
      </div>
    </div>
  );
}
