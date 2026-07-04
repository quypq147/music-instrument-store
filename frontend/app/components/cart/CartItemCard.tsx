"use client";

import Image from "next/image";
import type { CartItem } from "../../../types/cart";

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
    <div className="flex items-center gap-4 bg-white dark:bg-[#06261d] rounded-2xl border border-gray-100 dark:border-primary-container/20 hover:border-[#DF9E47]/30 transition-colors p-4">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(index)}
        className="w-4 h-4 accent-[#002B1F] dark:accent-secondary shrink-0 cursor-pointer"
      />

      <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 bg-[#F3EFEA] dark:bg-[#031d16] rounded-xl overflow-hidden">
        <Image src={item.image} alt={item.name} fill className="object-contain p-2" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-serif text-primary text-base md:text-lg font-semibold truncate">
          {item.name}
        </h3>
        <p className="text-xs text-[#A36B2B] font-bold tracking-wider uppercase mt-1">
          Chính hãng • Bảo hành uy tín
        </p>
        <p className="text-sm text-slate-600 dark:text-emerald-100/70 mt-1">{item.price}</p>

        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => onDecrease(index)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-primary-container/20 text-slate-600 dark:text-emerald-100/70 hover:bg-gray-50 dark:hover:bg-[#031d16] transition-colors cursor-pointer"
          >
            -
          </button>
          <span className="text-sm font-semibold text-primary w-6 text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => onIncrease(index)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-primary-container/20 text-slate-600 dark:text-emerald-100/70 hover:bg-gray-50 dark:hover:bg-[#031d16] transition-colors cursor-pointer"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <p className="font-bold text-[#A36B2B] text-sm md:text-base whitespace-nowrap">
          {totalPrice.toLocaleString("vi-VN")}đ
        </p>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors cursor-pointer"
        >
          Xóa
        </button>
      </div>
    </div>
  );
}
