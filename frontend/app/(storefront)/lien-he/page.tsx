"use client";

import { useState } from "react";
import { useToast } from "../../context/ToastContext";

export default function ContactPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.message.trim()) {
      showToast("Vui lòng nhập họ tên và nội dung cần tư vấn.", "warning");
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      showToast("Vui lòng nhập ít nhất một cách liên hệ (số điện thoại hoặc email).", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Gửi yêu cầu liên hệ thất bại. Vui lòng thử lại.", "error");
      } else {
        showToast("Đã gửi yêu cầu liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.", "success");
        setForm({ name: "", phone: "", email: "", message: "" });
      }
    } catch (error) {
      console.error("Contact form submission error:", error);
      showToast("Đã xảy ra lỗi khi kết nối với máy chủ.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface-cream dark:bg-[#02140f] pt-16 md:pt-20 transition-colors duration-300">
      <section className="relative bg-[#001A12] text-white py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#DF9E47] font-sans font-bold tracking-[0.3em] uppercase text-sm">
            Nhóm TTTN Music
          </p>

          <h1 className="mt-5 text-5xl md:text-7xl font-serif font-bold text-[#DF9E47]">
            Liên Hệ Tư Vấn
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-white/80 font-sans font-light leading-relaxed">
            Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn chọn nhạc cụ phù hợp,
            đặt hàng và tư vấn dịch vụ cao cấp.
          </p>
        </div>

        <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 bg-[radial-gradient(circle,#DF9E47,transparent_60%)]" />
      </section>

      <section className="max-w-6xl mx-auto px-6 -mt-12 relative z-10 grid gap-8 mb-24" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <div className="bg-white dark:bg-[#06261d] rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-primary-container/20 transition-colors duration-300">
          <h2 className="text-3xl font-serif font-bold text-primary">
            Gửi yêu cầu liên hệ
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4 font-sans">
            <input
              className="w-full border border-gray-200 dark:border-primary-container/30 bg-white dark:bg-[#031d16] text-gray-700 dark:text-emerald-50 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all disabled:opacity-60"
              placeholder="Họ và tên"
              value={form.name}
              onChange={handleChange("name")}
              disabled={isSubmitting}
            />
            <input
              className="w-full border border-gray-200 dark:border-primary-container/30 bg-white dark:bg-[#031d16] text-gray-700 dark:text-emerald-50 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all disabled:opacity-60"
              placeholder="Số điện thoại"
              value={form.phone}
              onChange={handleChange("phone")}
              disabled={isSubmitting}
            />
            <input
              type="email"
              className="w-full border border-gray-200 dark:border-primary-container/30 bg-white dark:bg-[#031d16] text-gray-700 dark:text-emerald-50 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all disabled:opacity-60"
              placeholder="Email"
              value={form.email}
              onChange={handleChange("email")}
              disabled={isSubmitting}
            />
            <textarea
              className="w-full border border-gray-200 dark:border-primary-container/30 bg-white dark:bg-[#031d16] text-gray-700 dark:text-emerald-50 rounded-xl px-4 py-3 h-32 outline-none focus:border-primary transition-all disabled:opacity-60"
              placeholder="Nội dung cần tư vấn"
              value={form.message}
              onChange={handleChange("message")}
              disabled={isSubmitting}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-container text-white dark:text-[#002B1F] dark:bg-secondary dark:hover:bg-secondary-container py-4 rounded-xl font-bold tracking-widest uppercase transition-colors shadow-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Đang Gửi..." : "Gửi Liên Hệ"}
            </button>
          </form>
        </div>

        <div className="bg-[#001A12] rounded-3xl shadow-xl p-8 text-white border border-[#DF9E47]/30">
          <h2 className="text-3xl font-serif font-bold text-[#DF9E47]">
            Thông tin boutique
          </h2>

          <div className="mt-8 space-y-5 text-white/85 font-sans">
            <p>
              <b className="text-[#DF9E47]">Hotline:</b>{" "}
              <a href="tel:0912191218" className="hover:underline">0912 19 12 18</a>
            </p>
            <p>
              <b className="text-[#DF9E47]">Email:</b>{" "}
              <a href="mailto:support@nhomtttnmusic.vn" className="hover:underline">support@nhomtttnmusic.vn</a>
            </p>
            <p><b className="text-[#DF9E47]">Địa chỉ:</b> TP. Hồ Chí Minh, Việt Nam</p>
            <p><b className="text-[#DF9E47]">Thời gian:</b> 8:00 - 22:00 mỗi ngày</p>
          </div>

          <div className="mt-10 rounded-2xl bg-white/5 border border-white/10 p-5 font-sans">
            <p className="text-[#DF9E47] font-bold">Dịch vụ cao cấp</p>
            <p className="mt-2 text-white/75 font-light leading-relaxed">
              Tư vấn chọn saxophone, đặt lịch trải nghiệm và hỗ trợ mua hàng nhanh.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
