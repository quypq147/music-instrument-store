import "./globals.css";
import { CartProvider } from "./context/CartContext";
import CartButton from "./components/CartButton";
import ChatWidget from "./components/ChatWidget";
import { Poppins } from "next/font/google";
import Link from "next/link";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "NhomTTTN Music",
  description: "Website bán Saxophone chính hãng",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={poppins.className}>
        <CartProvider>
          <header className="header">
            <Link href="/" className="logo">
              <h1>NhomTTTN Music</h1>
              <p>Website bán nhạc cụ & Saxophone</p>
            </Link>

            <form action="/products" className="search">
              <input
                type="text"
                name="q"
                placeholder="Tìm kiếm sản phẩm..."
              />
            </form>

            <CartButton />
          </header>

          <nav className="menu">
            <Link href="/">Trang Chủ</Link>
            <Link href="/products">Sản Phẩm</Link>
            <Link href="/cart">Giỏ Hàng</Link>
            <Link href="/orders">Đơn Đã Mua</Link>
            <Link href="/login">Đăng Nhập</Link>
            <Link href="/register">Đăng Ký</Link>
            <Link href="/admin">Admin</Link>
          </nav>

          {children}

          <ChatWidget />

          <footer className="footer">
            <div className="footer-container">
              <div className="footer-column">
                <h3>NhomTTTN Music</h3>
                <p>Chuyên cung cấp Saxophone chính hãng.</p>
                <p>📍 TP. Hồ Chí Minh, Việt Nam</p>
                <p>📞 0912 19 12 18</p>
                <p>✉️ support@nhomtttnmusic.vn</p>
              </div>

              <div className="footer-column">
                <h3>Thông Tin</h3>
                <p>Giới thiệu</p>
                <p>Chính sách bảo hành</p>
                <p>Chính sách đổi trả</p>
                <p>Điều khoản sử dụng</p>
              </div>

              <div className="footer-column">
                <h3>Danh Mục</h3>
                <p>Alto Saxophone</p>
                <p>Tenor Saxophone</p>
                <p>Soprano Saxophone</p>
                <p>Phụ kiện Saxophone</p>
              </div>

              <div className="footer-column">
                <h3>Kết Nối</h3>
                <div className="social-icons">
                  <a
                    href="https://www.facebook.com/tran.thien.208979/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Facebook
                  </a>

                  <a
                    href="https://zalo.me/0912191218"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Zalo
                  </a>

                  <a href="mailto:support@nhomtttnmusic.vn">Email</a>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              © 2026 NhomTTTN Music | AWS Cloud Project
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}