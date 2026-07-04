"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import MusicLoading from "../../../components/common/MusicLoading";

const getMethodName = (method: string) => {
  switch (method) {
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

const REDIRECT_DELAY_SECONDS = 6;

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const method = searchParams.get("method") || "";
  const amount = Number(searchParams.get("amount") || "0");

  const orderDetailsUrl = `/profile?tab=orders&orderId=${orderId}`;

  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_DELAY_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.push(orderDetailsUrl);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, router, orderDetailsUrl]);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 md:p-8 pt-25 md:pt-30 pb-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_40%)] pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl relative z-10 p-8 md:p-10 text-center space-y-6 animate-scale-up">
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl mx-auto border border-emerald-500/30">
          ✓
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Thanh Toán Thành Công!</h1>
          <p className="text-sm text-emerald-400 mt-2">Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được chuẩn bị.</p>
        </div>

        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/30 p-5 space-y-3 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Mã đơn hàng</span>
            <span className="font-mono text-emerald-400 font-semibold">{orderId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Phương thức thanh toán</span>
            <span className="font-semibold text-slate-200">{getMethodName(method)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-slate-800 pt-3">
            <span className="text-slate-400">Tổng tiền</span>
            <span className="font-extrabold text-white">{amount.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href={orderDetailsUrl}
            className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-[0.98]"
          >
            Xem Chi Tiết Đơn Hàng
          </Link>
          <Link
            href="/products"
            className="block w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-all"
          >
            Tiếp Tục Mua Sắm
          </Link>
        </div>

        <p className="text-xs text-slate-500">
          Tự động chuyển đến chi tiết đơn hàng sau {secondsLeft}s...
        </p>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <MusicLoading message="Đang tải trang xác nhận..." height="200px" theme="dark" />
      </main>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
