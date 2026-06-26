"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CartItem {
  id: number;
  name: string;
  price: string;
  image: string;
  quantity?: number;
}

interface Customer {
  name: string;
  phone: string;
  address: string;
  note: string;
}

interface Order {
  id: string;
  customer: Customer;
  paymentMethod: string;
  products: CartItem[];
  totalItems: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

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

  const getPriceNumber = (price: string) => {
    return Number(String(price).replaceAll(".", "").replace("đ", ""));
  };

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

  const confirmOrder = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán");
      return;
    }

    if (!customer.name || !customer.phone || !customer.address) {
      alert("Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ");
      return;
    }

    if (!paymentMethod) {
      alert("Vui lòng chọn phương thức thanh toán");
      return;
    }

    const oldOrders = JSON.parse(localStorage.getItem("orders") || "[]") as Order[];
    const orderTimestamp = createOrderTimestamp();

    const newOrder: Order = {
      id: orderTimestamp.id,
      customer,
      paymentMethod,
      products: selectedCart,
      totalItems,
      totalPrice,
      status: "Chờ xác nhận",
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
                <span>🛍️ NhomTTTN Music</span>
              </label>

              <strong>{totalItems} sản phẩm đã chọn</strong>
            </div>

            {cart.map((item, index) => (
              <div className="cart-item-card" key={index}>
                <input
                  type="checkbox"
                  className="cart-checkbox"
                  checked={selectedItems.includes(index)}
                  onChange={() => toggleSelectItem(index)}
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
                    <button onClick={() => decreaseQuantity(index)}>
                      -
                    </button>
                    <span>{item.quantity || 1}</span>
                    <button onClick={() => increaseQuantity(index)}>
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-item-total">
                  <p>
                    {(
                      getPriceNumber(item.price) *
                      (item.quantity || 1)
                    ).toLocaleString("vi-VN")}
                    đ
                  </p>

                  <button
                    className="delete-btn"
                    onClick={() => removeItem(index)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </section>

          <aside className="cart-summary-box">
            <h2>Thông tin đơn hàng</h2>

            <div className="summary-row">
              <span>Sản phẩm đã chọn</span>
              <strong>{totalItems}</strong>
            </div>

            <div className="summary-row">
              <span>Tạm tính</span>
              <strong>{totalPrice.toLocaleString("vi-VN")}đ</strong>
            </div>

            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <strong>Miễn phí</strong>
            </div>

            <div className="summary-total">
              <span>Tổng tiền</span>
              <strong>{totalPrice.toLocaleString("vi-VN")}đ</strong>
            </div>

            <button
              className="order-btn"
              onClick={() => {
                if (selectedItems.length === 0) {
                  alert("Vui lòng chọn sản phẩm cần thanh toán");
                  return;
                }
                setShowCheckout(true);
              }}
            >
              Đặt Hàng
            </button>

            <Link href="/products">
              <button className="continue-shopping-btn">
                Tiếp tục mua hàng
              </button>
            </Link>

            <button className="clear-cart-btn" onClick={clearCart}>
              Xóa toàn bộ giỏ hàng
            </button>
          </aside>
        </div>
      )}

      {showCheckout && (
        <div className="checkout-overlay">
          <div className="checkout-box">
            <h2>Thông tin đặt hàng</h2>

            <input
              type="text"
              placeholder="Họ và tên"
              value={customer.name}
              onChange={(e) =>
                setCustomer({
                  ...customer,
                  name: e.target.value,
                })
              }
            />

            <input
              type="text"
              placeholder="Số điện thoại"
              value={customer.phone}
              onChange={(e) =>
                setCustomer({
                  ...customer,
                  phone: e.target.value,
                })
              }
            />

            <input
              type="text"
              placeholder="Địa chỉ nhận hàng"
              value={customer.address}
              onChange={(e) =>
                setCustomer({
                  ...customer,
                  address: e.target.value,
                })
              }
            />

            <textarea
              placeholder="Ghi chú thêm"
              value={customer.note}
              onChange={(e) =>
                setCustomer({
                  ...customer,
                  note: e.target.value,
                })
              }
            />

            <div className="payment-box">
              <h3>Phương thức thanh toán</h3>

              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                <span>💵 Thanh toán khi nhận hàng (COD)</span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "Momo"}
                  onChange={() => setPaymentMethod("Momo")}
                />
                <span>🟣 Ví Momo</span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "VNPay"}
                  onChange={() => setPaymentMethod("VNPay")}
                />
                <span>🔵 VNPay / Ngân hàng</span>
              </label>
            </div>

            <div className="checkout-total-box">
              <span>Tổng thanh toán</span>
              <strong>{totalPrice.toLocaleString("vi-VN")}đ</strong>
            </div>

            <div className="checkout-actions">
              <button
                className="confirm-order-btn"
                onClick={confirmOrder}
              >
                Xác nhận đặt hàng
              </button>

              <button
                className="cancel-order-btn"
                onClick={() => setShowCheckout(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
