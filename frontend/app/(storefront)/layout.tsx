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
      <footer>
        <div className="container">
          <div className="grid grid-4 gap-8 mb-8">
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "1rem" }}>AUREATE FOREST</h3>
              <p style={{ fontSize: "14px", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                Chuyên cung cấp Saxophone chính hãng, âm thanh chuẩn mực cho nghệ sĩ chuyên nghiệp.
              </p>
              <p style={{ fontSize: "14px", marginBottom: "0.5rem" }}>📍 TP. Hồ Chí Minh, Việt Nam</p>
              <p style={{ fontSize: "14px", marginBottom: "0.5rem" }}>📞 0912 19 12 18</p>
              <p style={{ fontSize: "14px" }}>📧 support@nhomtttnmusic.vn</p>
            </div>
            <div>
              <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "1.5rem", textTransform: "uppercase" }}>Thông tin</h4>
              <ul style={{ listStyle: "none" }}>
                <li style={{ marginBottom: "0.75rem" }}><Link href="/about">Giới thiệu</Link></li>
                <li style={{ marginBottom: "0.75rem" }}><Link href="#">Chính sách bảo hành</Link></li>
                <li style={{ marginBottom: "0.75rem" }}><Link href="#">Chính sách đổi trả</Link></li>
                <li style={{ marginBottom: "0.75rem" }}><Link href="#">Điều khoản sử dụng</Link></li>
                <li><Link href="#">Hướng dẫn mua hàng</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "1.5rem", textTransform: "uppercase" }}>Danh mục</h4>
              <ul style={{ listStyle: "none" }}>
                <li style={{ marginBottom: "0.75rem" }}><Link href="/products?category=Alto%20Saxophone">Alto Saxophone</Link></li>
                <li style={{ marginBottom: "0.75rem" }}><Link href="/products?category=Tenor%20Saxophone">Tenor Saxophone</Link></li>
                <li style={{ marginBottom: "0.75rem" }}><Link href="/products?category=Soprano%20Saxophone">Soprano Saxophone</Link></li>
                <li><Link href="/products">Xem tất cả</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "1.5rem", textTransform: "uppercase" }}>Kết nối</h4>
              <ul style={{ listStyle: "none" }}>
                <li style={{ marginBottom: "0.75rem" }}><a href="#">Facebook</a></li>
                <li style={{ marginBottom: "0.75rem" }}><a href="#">Zalo</a></li>
                <li style={{ marginBottom: "0.75rem" }}><a href="#">Instagram</a></li>
                <li><a href="#">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.2)", paddingTop: "2rem", textAlign: "center", fontSize: "12px" }}>
            © 2026 AUREATE FOREST | AWS CLOUD PROJECT
          </div>
        </div>
      </footer>
    </>
  );
}
