export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] pt-16 md:pt-20" style={{ backgroundColor: '#f7f7f4' }}>
      <section className="relative bg-[#0b1d16] text-white py-24 px-6 overflow-hidden" style={{ backgroundColor: '#0b1d16' }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-[#c9a96e] font-sans font-bold tracking-[0.3em] uppercase text-sm" style={{ color: '#c9a96e' }}>
            Aureate Forest Boutique
          </p>

          <h1 className="mt-5 text-5xl md:text-7xl font-serif font-bold text-[#c9a96e]" style={{ color: '#c9a96e' }}>
            Liên Hệ Tư Vấn
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-white/80 font-sans font-light leading-relaxed">
            Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn chọn nhạc cụ phù hợp,
            đặt hàng và tư vấn dịch vụ cao cấp.
          </p>
        </div>

        <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 bg-[radial-gradient(circle,#c9a96e,transparent_60%)]" />
      </section>

      <section 
        className="max-w-6xl mx-auto px-6 -mt-12 relative z-10 grid gap-8 mb-24"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}
      >
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#e5e7eb]">
          <h2 className="text-3xl font-serif font-bold text-[#0b1d16]" style={{ color: '#0b1d16' }}>
            Gửi yêu cầu liên hệ
          </h2>

          <div className="mt-6 space-y-4 font-sans">
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]" placeholder="Họ và tên" />
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]" placeholder="Số điện thoại" />
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]" placeholder="Email" />
            <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 h-32 outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]" placeholder="Nội dung cần tư vấn" />

            <button className="w-full bg-[#0b1d16] text-[#c9a96e] py-4 rounded-xl font-bold tracking-widest uppercase hover:bg-[#06120e] transition-colors shadow-lg" style={{ backgroundColor: '#0b1d16', color: '#c9a96e' }}>
              Gửi Liên Hệ
            </button>
          </div>
        </div>

        <div className="bg-[#0b1d16] rounded-3xl shadow-xl p-8 text-white border border-[#c9a96e]/30" style={{ backgroundColor: '#0b1d16' }}>
          <h2 className="text-3xl font-serif font-bold text-[#c9a96e]" style={{ color: '#c9a96e' }}>
            Thông tin boutique
          </h2>

          <div className="mt-8 space-y-5 text-white/85 font-sans">
            <p><b className="text-[#c9a96e]" style={{ color: '#c9a96e' }}>Hotline:</b> 0915 205 115</p>
            <p><b className="text-[#c9a96e]" style={{ color: '#c9a96e' }}>Email:</b> support@aureateforest.com</p>
            <p><b className="text-[#c9a96e]" style={{ color: '#c9a96e' }}>Địa chỉ:</b> TP. Hồ Chí Minh, Việt Nam</p>
            <p><b className="text-[#c9a96e]" style={{ color: '#c9a96e' }}>Thời gian:</b> 8:00 - 22:00 mỗi ngày</p>
          </div>

          <div className="mt-10 rounded-2xl bg-white/5 border border-white/10 p-5 font-sans">
            <p className="text-[#c9a96e] font-bold" style={{ color: '#c9a96e' }}>Dịch vụ cao cấp</p>
            <p className="mt-2 text-white/75 font-light leading-relaxed">
              Tư vấn chọn saxophone, đặt lịch trải nghiệm và hỗ trợ mua hàng nhanh.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}