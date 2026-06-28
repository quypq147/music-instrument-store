import "./globals.css";
import { CartProvider } from "./context/CartContext";
import CartButton from "./components/CartButton";
import ChatWidget from "./components/ChatWidget";
import { Playfair_Display, Inter } from "next/font/google";
import Link from "next/link";
import AmplifyConfig from "./components/AmplifyConfig";
import AuthNav from "./components/AuthNav";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "Nhóm TTTN Music",
  description: "Website bán Saxophone chính hãng",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <AmplifyConfig>
          <CartProvider>
          <header className="header-unified">
            <Link href="/" className="logo">
              <h1>Aureate Forest</h1>
              <p>Boutique</p>
            </Link>

            <nav className="nav-links">
              <Link href="/">Trang Chủ</Link>
              <Link href="/products">Sản Phẩm</Link>
            </nav>

            <div className="header-right">
              <form action="/products" className="search-box-minimal">
                <input
                  type="text"
                  name="q"
                  placeholder="Tìm kiếm sản phẩm..."
                />
              </form>
              <AuthNav />
              <CartButton />
            </div>
          </header>

          {children}

          <ChatWidget />

          <footer className="footer">
            <div className="footer-container">
              <div className="footer-column">
                <h3>Nhóm TTTN Music</h3>
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
              © 2026 Nhóm TTTN Music | AWS Cloud Project
            </div>
            </footer>
          </CartProvider>
        </AmplifyConfig>
      </body>
    </html>
  );
}