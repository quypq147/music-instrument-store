import Link from "next/link";
import ClientHeader from "../components/layout/ClientHeader";
import FloatingContacts from "../components/contact/FloatingContacts";
import ChatWidget from "../components/chat/ChatWidget";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ClientHeader />
      {children}
      <FloatingContacts />
      <ChatWidget />
      <footer className="bg-[#001A12] text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <h3 className="font-serif text-xl text-[#DF9E47] mb-4">AUREATE FOREST</h3>
              <p className="text-sm text-white/70 leading-relaxed mb-4">
                Chuyên cung cấp Saxophone chính hãng, âm thanh chuẩn mực cho nghệ sĩ chuyên nghiệp.
              </p>
              <p className="text-sm text-white/70 mb-2">📍 TP. Hồ Chí Minh, Việt Nam</p>
              <p className="text-sm text-white/70 mb-2">📞 0912 19 12 18</p>
              <p className="text-sm text-white/70">📧 support@nhomtttnmusic.vn</p>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase text-white mb-4">Thông Tin</h4>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-sm text-white/70 hover:text-[#DF9E47] transition-colors">Giới thiệu</Link></li>
                <li><Link href="#" className="text-sm text-white/70 hover:text-[#DF9E47] transition-colors">Chính sách bảo hành</Link></li>
                <li><Link href="#" className="text-sm text-white/70 hover:text-[#DF9E47] transition-colors">Chính sách đổi trả</Link></li>
                <li><Link href="#" className="text-sm text-white/70 hover:text-[#DF9E47] transition-colors">Điều khoản sử dụng</Link></li>
                <li><Link href="#" className="text-sm text-white/70 hover:text-[#DF9E47] transition-colors">Hướng dẫn mua hàng</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase text-white mb-4">Danh Mục</h4>
              <ul className="space-y-3">
                <li><Link href="/products?category=Alto%20Saxophone" className="text-sm text-white/70 hover:text-[#DF9E47] transition-colors">Alto Saxophone</Link></li>
                <li><Link href="/products?category=Tenor%20Saxophone" className="text-sm text-white/70 hover:text-[#DF9E47] transition-colors">Tenor Saxophone</Link></li>
                <li><Link href="/products?category=Soprano%20Saxophone" className="text-sm text-white/70 hover:text-[#DF9E47] transition-colors">Soprano Saxophone</Link></li>
                <li><Link href="/products" className="text-sm text-white/70 hover:text-[#DF9E47] transition-colors">Xem tất cả</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase text-white mb-4">Kết Nối</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-white/70 hover:text-[#DF9E47] transition-colors">Facebook</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-[#DF9E47] transition-colors">Zalo</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-[#DF9E47] transition-colors">Instagram</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-[#DF9E47] transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-xs text-white/50">
            © 2026 AUREATE FOREST | AWS CLOUD PROJECT
          </div>
        </div>
      </footer>
    </>
  );
}
