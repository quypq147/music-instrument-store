"use client";

import "../../components/common/AmplifyConfig";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmDialogContext";

import type { CartItem, Customer, Order } from "../../../types/cart";
import { CartItemCard } from "../../components/cart/CartItemCard";
import { CartSummary } from "../../components/cart/CartSummary";
import { CheckoutModal } from "../../components/cart/CheckoutModal";

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
  const { showToast } = useToast();
  const confirmAction = useConfirm();
  // Start empty on both server and client so the first client render matches
  // the server-rendered HTML; the real cart loads after mount to avoid a
  // hydration mismatch when localStorage already has items.
  const [{ cart, selectedItems }, setCartState] =
    useState<CartState>({ cart: [], selectedItems: [] });

  useEffect(() => {
    const timer = setTimeout(() => {
      setCartState(getInitialCartState());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

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

  const decreaseQuantity = async (index: number) => {
    const newCart = [...cart];
    const item = newCart[index];

    if (!item) return;

    if ((item.quantity ?? 1) > 1) {
      item.quantity = (item.quantity ?? 1) - 1;
    } else {
      const ok = await confirmAction({
        message: "Bạn có muốn xóa sản phẩm này khỏi giỏ hàng không?",
        danger: true,
      });
      if (!ok) return;
      newCart.splice(index, 1);
    }

    saveCart(newCart);
  };

  const removeItem = async (index: number) => {
    const ok = await confirmAction({
      message: "Bạn chắc chắn muốn xóa sản phẩm này?",
      danger: true,
    });
    if (!ok) return;

    const newCart = [...cart];
    newCart.splice(index, 1);
    saveCart(newCart);
  };

  const clearCart = async () => {
    const ok = await confirmAction({
      message: "Bạn chắc chắn muốn xóa toàn bộ giỏ hàng?",
      danger: true,
    });
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

  const finalPrice = Math.max(totalPrice - discountAmount, 0);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setIsApplyingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setDiscountAmount(0);
        setAppliedCouponCode(null);
        setCouponError(data.error || data.message || "Mã giảm giá không hợp lệ");
        return;
      }

      const coupon = data.coupon;
      if (coupon.minOrderValue && totalPrice < coupon.minOrderValue) {
        setDiscountAmount(0);
        setAppliedCouponCode(null);
        setCouponError(`Đơn hàng cần tối thiểu ${Number(coupon.minOrderValue).toLocaleString("vi-VN")}đ để áp dụng mã này.`);
        return;
      }

      const discount =
        coupon.discountType === "percentage"
          ? Math.round((totalPrice * coupon.discountValue) / 100)
          : Math.min(coupon.discountValue, totalPrice);

      setDiscountAmount(discount);
      setAppliedCouponCode(code);
    } catch (error) {
      console.error("Failed to apply coupon", error);
      setCouponError("Không thể kiểm tra mã giảm giá. Vui lòng thử lại.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const confirmOrder = async () => {
    if (selectedItems.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán", "warning");
      return;
    }

    if (!customer.name || !customer.phone || !customer.address) {
      showToast("Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng", "warning");
      return;
    }

    if (!paymentMethod) {
      showToast("Vui lòng chọn phương thức thanh toán", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      let userId: string | undefined;
      let email: string | undefined;
      try {
        const user = await getCurrentUser();
        userId = user.userId;
        const attrs = await fetchUserAttributes();
        email = attrs.email;
      } catch {
        // User not logged in, treat as guest
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer,
          paymentMethod,
          userId,
          email,
          couponCode: appliedCouponCode || undefined,
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
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.message || "Không thể tạo đơn hàng. Vui lòng thử lại.", "error");
        return;
      }

      const result = (await response.json()) as {
        orderId?: string;
        status?: string;
        totalPrice?: number;
        discountAmount?: number;
      };
      const oldOrders = JSON.parse(localStorage.getItem("orders") || "[]") as Order[];
      const orderTimestamp = createOrderTimestamp();

      const newOrder: Order = {
        id: result.orderId ?? orderTimestamp.id,
        customer,
        paymentMethod,
        products: selectedCart,
        totalItems,
        totalPrice: result.totalPrice ?? finalPrice,
        couponCode: appliedCouponCode || undefined,
        discountAmount: result.discountAmount ?? discountAmount,
        status: result.status === "PENDING" ? "Chờ xác nhận" : (result.status ?? "Chờ xác nhận"),
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

      setCouponCode("");
      setAppliedCouponCode(null);
      setDiscountAmount(0);
      setCouponError(null);

      if (paymentMethod === "VNPay" || paymentMethod === "Momo" || paymentMethod === "Stripe") {
        router.push(`/checkout?orderId=${newOrder.id}&method=${paymentMethod}&amount=${newOrder.totalPrice}`);
      } else {
        router.push("/orders");
      }
    } catch (error) {
      console.error("Failed to create order", error);
      showToast("Không thể tạo đơn hàng. Vui lòng thử lại.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface-cream dark:bg-[#02140f] pt-16 md:pt-20 pb-20 px-4 md:px-6 lg:px-24 max-w-7xl mx-auto transition-colors duration-300">
      <h1 className="font-serif text-3xl md:text-4xl text-primary mt-10 mb-8">Giỏ Hàng Của Bạn</h1>

      {cart.length === 0 ? (
        <div className="max-w-md mx-auto text-center bg-[#F3EFEA] dark:bg-[#06261d] border border-transparent dark:border-primary-container/20 rounded-2xl p-10 md:p-14 transition-colors duration-300">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="font-serif text-xl text-primary mb-2">Giỏ hàng đang trống</h2>
          <p className="text-sm text-slate-600 dark:text-emerald-100/70 mb-6">Hãy chọn thêm sản phẩm saxophone yêu thích của bạn.</p>

          <Link href="/products">
            <button className="bg-primary hover:bg-primary-container text-white dark:text-[#002B1F] dark:bg-secondary dark:hover:bg-secondary-container font-bold text-sm uppercase tracking-widest px-8 py-3.5 rounded-xl transition-colors cursor-pointer">
              Tiếp tục mua hàng
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <section className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex justify-between items-center bg-[#F3EFEA] dark:bg-[#031d16] border border-transparent dark:border-primary-container/20 rounded-xl px-4 py-3 transition-colors">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    cart.length > 0 &&
                    selectedItems.length === cart.length
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-[#002B1F] dark:accent-secondary"
                />
                <span className="text-sm font-semibold text-primary">🛍️ Nhóm TTTN Music</span>
              </label>

              <strong className="text-sm text-slate-600 dark:text-emerald-100/75">{totalItems} sản phẩm đã chọn</strong>
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
                showToast("Vui lòng chọn sản phẩm cần thanh toán", "warning");
                return;
              }
              setShowCheckout(true);
            }}
            onClearCartClick={clearCart}
            couponCode={couponCode}
            onCouponCodeChange={setCouponCode}
            onApplyCoupon={applyCoupon}
            isApplyingCoupon={isApplyingCoupon}
            couponError={couponError}
            discountAmount={discountAmount}
          />
        </div>
      )}

      {showCheckout && (
        <CheckoutModal
          customer={customer}
          onChangeCustomer={setCustomer}
          paymentMethod={paymentMethod}
          onChangePaymentMethod={setPaymentMethod}
          totalPrice={finalPrice}
          isSubmitting={isSubmitting}
          onConfirm={confirmOrder}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </main>
  );
}
