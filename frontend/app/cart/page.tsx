"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CartItem, Customer, Order } from "../../types/cart";
import { CartItemCard } from "../components/CartItemCard";
import { CartSummary } from "../components/CartSummary";
import { CheckoutModal } from "../components/CheckoutModal";

interface CartState {
  cart: CartItem[];
  selectedItems: number[];
}

const getStoredCart = (): CartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  return JSON.parse(localStorage.getItem("cart") || "[]") as CartItem[];
};

const getInitialCartState = (): CartState => {
  const cart = getStoredCart();

  return {
    cart,
    selectedItems: cart.map((_, index: number) => index),
  };
};

const createOrderTimestamp = () => ({
  id: "DH" + Date.now(),
  createdAt: new Date().toLocaleString("vi-VN"),
});

export default function Cart() {
  const router = useRouter();
  const [{ cart, selectedItems }, setCartState] =
    useState<CartState>(getInitialCartState);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customer, setCustomer] = useState<Customer>({
    name: "",
    phone: "",
    address: "",
    note: "",
  });

  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem("cart", JSON.stringify(newCart));

    setCartState((prev) => ({
      cart: newCart,
      selectedItems: prev.selectedItems.filter((index) => index < newCart.length),
    }));
  };

  const setSelectedItems = (updater: number[] | ((prev: number[]) => number[])) => {
    setCartState((prev) => ({
      cart: prev.cart,
      selectedItems:
        typeof updater === "function" ? updater(prev.selectedItems) : updater,
    }));
  };

  const getPriceNumber = (price: string) =>
    Number(String(price).replace(/[^\d]/g, ""));

  const toggleSelectItem = (index: number) => {
    if (selectedItems.includes(index)) {
      setSelectedItems(selectedItems.filter((i) => i !== index));
    } else {
      setSelectedItems([...selectedItems, index]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cart.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart.map((_, index) => index));
    }
  };

  const selectedCart = cart.filter((_, index) =>
    selectedItems.includes(index)
  );

  const increaseQuantity = (index: number) => {
    const newCart = [...cart];
    const item = newCart[index];

    if (!item) return;

    item.quantity = (item.quantity ?? 1) + 1;
    saveCart(newCart);
  };

  const decreaseQuantity = (index: number) => {
    const newCart = [...cart];
    const item = newCart[index];

    if (!item) return;

    if ((item.quantity ?? 1) > 1) {
      item.quantity = (item.quantity ?? 1) - 1;
    } else {
      const ok = confirm("Bạn có muốn xóa sản phẩm này khỏi giỏ hàng không?");
      if (!ok) return;
      newCart.splice(index, 1);
    }

    saveCart(newCart);
  };

  const removeItem = (index: number) => {
    const ok = confirm("Bạn chắc chắn muốn xóa sản phẩm này?");
    if (!ok) return;

    const newCart = [...cart];
    newCart.splice(index, 1);
    saveCart(newCart);
  };

  const clearCart = () => {
    const ok = confirm("Bạn chắc chắn muốn xóa toàn bộ giỏ hàng?");
    if (!ok) return;

    saveCart([]);
    setSelectedItems([]);
  };

  const totalItems = selectedCart.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  const totalPrice = selectedCart.reduce(
    (sum, item) =>
      sum + getPriceNumber(item.price) * (item.quantity || 1),
    0
  );

  const confirmOrder = async () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán");
      return;
    }

    if (!customer.name || !customer.phone || !customer.address) {
      alert("Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng");
      return;
    }

    if (!paymentMethod) {
      alert("Vui lòng chọn phương thức thanh toán");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer,
          paymentMethod,
          items: selectedCart.map((item) => ({
            productId: String(item.id),
            name: item.name,
            price: getPriceNumber(item.price),
            quantity: item.quantity ?? 1,
            imageUrl: item.image,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Order API returned ${response.status}`);
      }

      const result = (await response.json()) as {
        orderId?: string;
        status?: string;
      };
      const oldOrders = JSON.parse(localStorage.getItem("orders") || "[]") as Order[];
      const orderTimestamp = createOrderTimestamp();

      const newOrder: Order = {
        id: result.orderId ?? orderTimestamp.id,
        customer,
        paymentMethod,
        products: selectedCart,
        totalItems,
        totalPrice,
        status: result.status ?? "PENDING",
        createdAt: orderTimestamp.createdAt,
      };

      localStorage.setItem(
        "orders",
        JSON.stringify([newOrder, ...oldOrders])
      );

      const remainingCart = cart.filter(
        (_, index) => !selectedItems.includes(index)
      );

      setShowCheckout(false);
      saveCart(remainingCart);
      setSelectedItems([]);

      setCustomer({
        name: "",
        phone: "",
        address: "",
        note: "",
      });

      router.push("/orders");
    } catch (error) {
      console.error("Failed to create order", error);
      alert("Không thể tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="cart-page">
      <h1 className="cart-title">Giỏ Hàng Của Bạn</h1>

      {cart.length === 0 ? (
        <div className="empty-cart-box">
          <div className="empty-cart-icon">🛒</div>
          <h2>Giỏ hàng đang trống</h2>
          <p>Hãy chọn thêm sản phẩm saxophone yêu thích của bạn.</p>

          <Link href="/products">
            <button className="continue-btn">Tiếp tục mua hàng</button>
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-list">
            <div className="cart-shop-header">
              <label className="select-all-box">
                <input
                  type="checkbox"
                  checked={
                    cart.length > 0 &&
                    selectedItems.length === cart.length
                  }
                  onChange={toggleSelectAll}
                />
                <span>🛍️ Nhóm TTTN Music</span>
              </label>

              <strong>{totalItems} sản phẩm đã chọn</strong>
            </div>

            {cart.map((item, index) => (
              <CartItemCard
                key={index}
                item={item}
                index={index}
                isSelected={selectedItems.includes(index)}
                onToggleSelect={toggleSelectItem}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onRemove={removeItem}
              />
            ))}
          </section>

          <CartSummary
            totalItems={totalItems}
            totalPrice={totalPrice}
            onOrderClick={() => {
              if (selectedItems.length === 0) {
                alert("Vui lòng chọn sản phẩm cần thanh toán");
                return;
              }
              setShowCheckout(true);
            }}
            onClearCartClick={clearCart}
          />
        </div>
      )}

      {showCheckout && (
        <CheckoutModal
          customer={customer}
          onChangeCustomer={setCustomer}
          paymentMethod={paymentMethod}
          onChangePaymentMethod={setPaymentMethod}
          totalPrice={totalPrice}
          isSubmitting={isSubmitting}
          onConfirm={confirmOrder}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </main>
  );
}
