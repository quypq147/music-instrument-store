import "./globals.css";
import { CartProvider } from "./context/CartContext";
import CartButton from "./components/CartButton";

export const metadata = {
  title: "NhomTTTN Music",
  description: "Website bán kèn Saxophone",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
  <CartProvider>

    <header className="header">
      <div className="logo">
        <h1>NhomTTTN Music</h1>
        <p>Website bán nhạc cụ & Saxophone</p>
      </div>

      <div className="search">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
        />
      </div>

      <CartButton />
    </header>

    <nav className="menu">
      <a href="/">Trang Chủ</a>
      <a href="/products">Sản Phẩm</a>
      <a href="/cart">Giỏ Hàng</a>
      <a href="/login">Đăng Nhập</a>
      <a href="/register">Đăng Ký</a>
      <a href="/admin">Admin</a>
    </nav>

    {children}

    <footer className="footer">
      <h3>NhomTTTN Music</h3>
      <p>Website bán kèn Saxophone</p>
      <p>AWS Cloud Project</p>
    </footer>

  </CartProvider>
</body>
    </html>
  );
}