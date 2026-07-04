"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function CartButton() {
  const { totalItems } = useCart();
  const [isBumping, setIsBumping] = useState(false);
  const prevTotalRef = useRef(totalItems);

  useEffect(() => {
    if (totalItems > prevTotalRef.current) {
      setIsBumping(true);
      const timeout = setTimeout(() => setIsBumping(false), 600);
      prevTotalRef.current = totalItems;
      return () => clearTimeout(timeout);
    }

    prevTotalRef.current = totalItems;
  }, [totalItems]);

  return (
    <Link
      href="/cart"
      className="flex items-center gap-2 text-white hover:text-[#DF9E47] text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap"
    >
      <span className="relative flex items-center justify-center">
        <ShoppingCart width="18" height="18" />
        {totalItems > 0 && (
          <span
            className={`absolute -top-2 -right-2.5 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[#DF9E47] text-[#002B1F] text-[10px] font-bold leading-none ${
              isBumping ? "animate-bounce" : ""
            }`}
          >
            {totalItems}
          </span>
        )}
      </span>
      Giỏ Hàng
    </Link>
  );
}
