/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchAuthSession } from "aws-amplify/auth";
import type { Order } from "../../../types/cart";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useToast } from "../../context/ToastContext";
import MusicLoading from "../../components/common/MusicLoading";
import {
  initCheckoutPayment,
  notifyStripeWebhook,
  notifyMomoWebhook,
  type CheckoutInitResult,
} from "../../../lib/api/checkout";

// Initialize Stripe Promise
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

// Sub-component for Real Stripe Payment Form
function StripeForm({ 
  clientSecret, 
  orderId, 
  amount,
  onCancel
}: { 
  clientSecret: string; 
  orderId: string; 
  amount: number;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage("");

    // Simulate update in localStorage first so it shows updated local status
    const storedOrders = localStorage.getItem("orders");
    if (storedOrders) {
      try {
        const orders = JSON.parse(storedOrders) as Order[];
        const updated = orders.map((o) => {
          if (o.id === orderId) {
            return { ...o, status: "Chờ lấy đơn" };
          }
          return o;
        });
        localStorage.setItem("orders", JSON.stringify(updated));
      } catch (err) {
        console.error("Local storage order update error:", err);
      }
    }

    const successUrl = `/checkout/success?orderId=${orderId}&method=Stripe&amount=${amount}`;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + successUrl,
      },
      redirect: "if_required",
    });

    if (error) {
      console.error("Stripe confirm error:", error);
      setMessage(error.message || "Thanh toán thất bại");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      setIsProcessing(false);
      setMessage("succeeded");
      setTimeout(() => {
        router.push(successUrl);
      }, 2500);
    } else {
      router.push(successUrl);
    }
  };

  if (message === "succeeded") {
    return (
      <div className="text-center space-y-4 animate-scale-up">
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl mx-auto border border-emerald-500/30">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-white">Thanh Toán Thành Công!</h2>
        <p className="text-sm text-emerald-400">Đơn hàng của bạn đã thanh toán qua Stripe thành công.</p>
        <p className="text-xs text-slate-500">Đang quay lại lịch sử đơn hàng...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {message && <div className="text-rose-500 text-xs mt-2">{message}</div>}
      
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
        >
          {isProcessing ? "Đang xử lý thanh toán..." : `Thanh toán ${amount.toLocaleString("vi-VN")}đ`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-all"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const paymentMethod = searchParams.get("method") || "VNPay";
  const amountStr = searchParams.get("amount") || "0";
  const amount = Number(amountStr);

  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  
  // Real Stripe Integration States
  const [clientSecret, setClientSecret] = useState("");
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [isMockStripe, setIsMockStripe] = useState(true);

  // Real Momo Integration States
  const [momoPayUrl, setMomoPayUrl] = useState("");
  const [isMomoLoading, setIsMomoLoading] = useState(false);
  const [isMockMomo, setIsMockMomo] = useState(true);

  // Mock Stripe Form States
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Fetch Momo payUrl
  useEffect(() => {
    if (paymentMethod === "Momo" && orderId) {
      setIsMomoLoading(true);
      initCheckoutPayment({
        customer: {
          name: "Khách Hàng Test",
          phone: "0912345678",
          address: "Địa chỉ Test",
          note: "Test thanh toán Momo",
        },
        paymentMethod: "Momo",
        idempotencyKey: `idemp_${orderId}`,
        items: [
          {
            productId: "1",
            name: `Thanh toán đơn hàng ${orderId}`,
            price: amount,
            quantity: 1,
          }
        ]
      })
      .then((result) => {
        const data = result.data as CheckoutInitResult;
        if (data.payUrl) {
          setMomoPayUrl(data.payUrl);
          if (data.isMock) {
            setIsMockMomo(true);
          } else {
            setIsMockMomo(false);
            // Redirect immediately to Momo's real payment gateway
            window.location.href = data.payUrl;
          }
        }
      })
      .catch((err) => {
        console.error("Failed to initialize Momo:", err);
      })
      .finally(() => {
        setIsMomoLoading(false);
      });
    }
  }, [paymentMethod, orderId, amount]);

  // Fetch clientSecret if payment method is Stripe
  useEffect(() => {
    if (paymentMethod === "Stripe" && orderId) {
      setIsStripeLoading(true);
      initCheckoutPayment({
        customer: {
          name: "Khách Hàng Test",
          phone: "0912345678",
          address: "Địa chỉ Test",
          note: "Test thanh toán Stripe",
        },
        paymentMethod: "Stripe",
        idempotencyKey: `idemp_${orderId}`,
        items: [
          {
            productId: "1",
            name: `Thanh toán đơn hàng ${orderId}`,
            price: amount,
            quantity: 1,
          }
        ]
      })
      .then((result) => {
        const data = result.data as CheckoutInitResult;
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          if (data.isMock || data.clientSecret.startsWith("pi_mock")) {
            setIsMockStripe(true);
          } else {
            setIsMockStripe(false);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to initialize Stripe:", err);
      })
      .finally(() => {
        setIsStripeLoading(false);
      });
    }
  }, [paymentMethod, orderId, amount]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "Stripe" && isMockStripe && (!cardNumber || !cardExpiry || !cardCvc || !cardName)) {
      showToast("Vui lòng điền đầy đủ thông tin thẻ", "warning");
      return;
    }

    setPaymentStatus("processing");

    // Call local webhook to update database status in mock/simulation mode
    const notifyLocalWebhook = async () => {
      try {
        if (paymentMethod === "Stripe" && isMockStripe) {
          await notifyStripeWebhook({
            type: "payment_intent.succeeded",
            data: {
              object: {
                metadata: { orderId },
                amountPaid: amount,
              }
            }
          });
        } else if (paymentMethod === "Momo" && isMockMomo) {
          await notifyMomoWebhook({
            orderId,
            resultCode: 0,
            amount,
          });
        }
      } catch (err) {
        console.error("Failed to call local webhook during simulation:", err);
      }
    };

    setTimeout(async () => {
      await notifyLocalWebhook();
      setPaymentStatus("success");

      // Update order status in localStorage
      if (typeof window !== "undefined") {
        const storedOrders = localStorage.getItem("orders");
        if (storedOrders) {
          try {
            const orders = JSON.parse(storedOrders) as Order[];
            const updated = orders.map((o) => {
              if (o.id === orderId) {
                return { ...o, status: "Chờ lấy đơn" };
              }
              return o;
            });
            localStorage.setItem("orders", JSON.stringify(updated));
          } catch (err) {
            console.error("Failed to update order in localStorage:", err);
          }
        }
      }

      setTimeout(() => {
        router.push(`/checkout/success?orderId=${orderId}&method=${paymentMethod}&amount=${amount}`);
      }, 2500);
    }, 2000);
  };

  const handleCancel = () => {
    if (confirm("Bạn có chắc chắn muốn hủy giao dịch thanh toán này?")) {
      setPaymentStatus("failed");
      setTimeout(() => {
        router.push("/cart");
      }, 1500);
    }
  };

  const getMethodName = () => {
    switch (paymentMethod) {
      case "VNPay":
        return "VietQR / Ngân hàng (VNPay)";
      case "Momo":
        return "Ví điện tử Momo";
      case "Stripe":
        return "Thẻ tín dụng quốc tế (Stripe)";
      default:
        return "Cổng thanh toán trực tuyến";
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 md:p-8 pt-25 md:pt-30 pb-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_40%)] pointer-events-none" />

      <div className="w-full max-w-4xl bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row">
        
        {/* Left Side: Summary Info */}
        <div className="w-full md:w-5/12 bg-slate-950/40 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-700/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <span className="text-2xl">🔒</span>
              <span className="font-bold tracking-wider text-xs uppercase text-slate-400">Thanh Toán An Toàn</span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Mã đơn hàng</span>
                <span className="font-mono text-sm text-emerald-400 font-semibold">{orderId}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">Phương thức thanh toán</span>
                <span className="text-sm font-semibold text-slate-200">{getMethodName()}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">Thời gian còn lại</span>
                <span className={`text-lg font-bold font-mono ${timeLeft < 60 ? "text-rose-500 animate-pulse" : "text-amber-400"}`}>
                  ⏱️ {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Tổng tiền cần thanh toán</span>
            <span className="text-3xl font-extrabold text-white">
              {amount.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>

        {/* Right Side: Interactive simulator */}
        <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-center min-h-120">
          {paymentStatus === "idle" && (
            <div>
              {/* VNPay / VietQR Ngân hàng Flow (REAL API integration) */}
              {paymentMethod === "VNPay" && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <span className="text-4xl">🏦</span>
                    <h2 className="text-lg font-bold text-slate-200 mt-2">Chuyển Khoản Qua VietQR</h2>
                    <p className="text-xs text-slate-400 mt-1">Mở ứng dụng ngân hàng và quét mã VietQR chính thức để thanh toán</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-700/30">
                    {/* Real dynamic VietQR Code Generator */}
                    <div className="w-36 h-36 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                      <img 
                        src={`https://img.vietqr.io/image/TCB-19035678901020-compact2.png?amount=${amount}&addInfo=TT%20DH%20${orderId}&accountName=TTTN%20MUSIC%20CO%20LTD`}
                        alt="Mã VietQR thanh toán Techcombank"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="space-y-2 text-xs w-full">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Ngân hàng:</span>
                        <span className="font-semibold text-slate-200">Techcombank (TCB)</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Số tài khoản:</span>
                        <span className="font-semibold text-emerald-400 font-mono">19035678901020</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Chủ tài khoản:</span>
                        <span className="font-semibold text-slate-200 uppercase text-right">TTTN MUSIC CO. LTD</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Nội dung chuyển khoản:</span>
                        <span className="font-bold text-amber-400 font-mono">TT DH {orderId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handlePaymentSubmit}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-[0.98]"
                    >
                      Xác Nhận Đã Chuyển Khoản
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-all"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Momo Flow */}
              {paymentMethod === "Momo" && (
                <div>
                  {isMomoLoading ? (
                    <MusicLoading message="Đang khởi tạo giao dịch Momo..." height="150px" theme="dark" />
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center mb-4">
                        <span className="text-4xl">🟣</span>
                        <h2 className="text-lg font-bold text-slate-200 mt-2">Thanh Toán Qua Ví Momo</h2>
                        <p className="text-xs text-slate-400 mt-1">Mở ứng dụng Momo và quét mã QR để thanh toán</p>
                      </div>

                      <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-2xl border border-slate-700/30">
                        <div className="w-40 h-40 bg-white p-3 rounded-xl flex items-center justify-center mb-4 shadow-inner">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=momo://payment?amount=${amount}%26orderId=${orderId}`}
                            alt="Momo QR Code"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-mono">Mã đơn Momo: momo_{orderId}</span>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={handlePaymentSubmit}
                          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-[0.98]"
                        >
                          Xác Nhận Thanh Toán (Momo)
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-all"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stripe Flow (Real integration option) */}
              {paymentMethod === "Stripe" && (
                <div>
                  {isStripeLoading ? (
                    <MusicLoading message="Đang khởi tạo kết nối cổng thanh toán Stripe..." height="150px" theme="dark" />
                  ) : !isMockStripe && clientSecret ? (
                    /* Real Stripe Elements Form */
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripeForm 
                        clientSecret={clientSecret} 
                        orderId={orderId} 
                        amount={amount} 
                        onCancel={handleCancel}
                      />
                    </Elements>
                  ) : (
                    /* Offline Mock Stripe Form */
                    <form onSubmit={handlePaymentSubmit} className="space-y-6">
                      <div className="text-center mb-4">
                        <span className="text-4xl">💳</span>
                        <h2 className="text-lg font-bold text-slate-200 mt-2">Thẻ Tín Dụng Quốc Tế (Simulated)</h2>
                        <p className="text-xs text-slate-400 mt-1">Stripe đang chạy ở chế độ offline/giả lập. Nhập thông tin thẻ test</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tên chủ thẻ</label>
                          <input
                            type="text"
                            required
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                            placeholder="NGUYEN VAN A"
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Số thẻ</label>
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                              const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                              setCardNumber(formatted);
                            }}
                            placeholder="4242 4242 4242 4242"
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hạn sử dụng</label>
                            <input
                              type="text"
                              required
                              value={cardExpiry}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                                const formatted = val.length >= 2 ? `${val.slice(0, 2)}/${val.slice(2)}` : val;
                                setCardExpiry(formatted);
                              }}
                              placeholder="MM/YY"
                              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mã bảo mật CVC</label>
                            <input
                              type="text"
                              required
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                              placeholder="123"
                              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono text-center"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-[0.98]"
                        >
                          Thanh Toán {amount.toLocaleString("vi-VN")}đ
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-all"
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {paymentStatus === "processing" && (
            <div className="animate-fade-in">
              <MusicLoading message="Đang xử lý giao dịch... Vui lòng không tắt trình duyệt." height="200px" theme="dark" />
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="text-center space-y-4 animate-scale-up">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl mx-auto border border-emerald-500/30">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-white">Thanh Toán Thành Công!</h2>
              <p className="text-sm text-emerald-400">Cảm ơn bạn đã mua hàng. Đơn hàng đang được chuẩn bị.</p>
              <p className="text-xs text-slate-500">Đang tự động chuyển hướng...</p>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="text-center space-y-4 animate-scale-up">
              <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center text-4xl mx-auto border border-rose-500/30">
                ✗
              </div>
              <h2 className="text-2xl font-bold text-white">Giao Dịch Đã Hủy</h2>
              <p className="text-sm text-rose-400">Đã hủy yêu cầu thanh toán.</p>
              <p className="text-xs text-slate-500">Đang quay lại giỏ hàng...</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <MusicLoading message="Đang tải trang thanh toán..." height="200px" theme="dark" />
      </main>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
