import "./globals.css";
import { CartProvider } from "./context/CartContext";
import CartButton from "./components/CartButton";
import ChatWidget from "./components/ChatWidget";
import { Playfair_Display, Inter } from "next/font/google";
import Link from "next/link";
import AmplifyConfig from "./components/AmplifyConfig";
import AuthNav from "./components/AuthNav";
import ConditionalLayout from "./components/ConditionalLayout";

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "Aureate Forest | Premium Saxophone Boutique",
  description: "Nhạc cụ Saxophone chính hãng cao cấp - Aureate Forest. Trải nghiệm âm thanh tuyệt hảo với dịch vụ bảo hành uy tín.",
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
            <ConditionalLayout
              header={
                <header style={{ backgroundColor: '#05100c', padding: '0 3%', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid rgba(223, 158, 71, 0.2)', position: 'relative', zIndex: 10 }}>
                  <style dangerouslySetInnerHTML={{ __html: `
                    .header-logo h1 { font-family: var(--font-serif), serif; font-size: 1.8rem; color: #fff; margin: 0; line-height: 1; letter-spacing: 1px; font-weight: 400; white-space: nowrap; }
                    .header-logo p { font-family: var(--font-sans), sans-serif; font-size: 0.6rem; color: #DF9E47; letter-spacing: 4px; margin: 4px 0 0 2px; text-transform: uppercase; font-weight: 600; white-space: nowrap; }
                    .header-nav { display: flex; gap: 2rem; }
                    .header-nav a { color: #fff; text-decoration: none; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; transition: color 0.2s; white-space: nowrap; }
                    .header-nav a:hover, .header-nav a.active { color: #DF9E47; }
                    .header-actions { display: flex; align-items: center; gap: 1rem; white-space: nowrap; }
                    .header-actions form { position: relative; }
                  `}} />
                  <Link href="/" className="header-logo" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                    <h1>AUREATE FOREST</h1>
                    <p>BOUTIQUE</p>
                  </Link>

                  <nav className="header-nav">
                    <Link href="/" className="active">TRANG CHỦ</Link>
                    <Link href="/products">SẢN PHẨM</Link>
                    <Link href="/contact">LIÊN HỆ</Link>
                  </nav>

                  <div className="header-actions">
                    <form action="/products" method="GET">
                      <input type="text" name="q" placeholder="Tìm kiếm..." style={{ backgroundColor: '#13241d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 32px 10px 12px', color: '#fff', fontSize: '0.8rem', width: '200px', outline: 'none' }} />
                      <button type="submit" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </button>
                    </form>
                    <div className="header-auth-cart" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <AuthNav />
                      <CartButton />
                    </div>
                  </div>
                </header>
              }
              chatWidget={<ChatWidget />}
              footer={
                <footer className="luxury-footer">
                  <style dangerouslySetInnerHTML={{ __html: `
                    .luxury-footer {
                      background-color: rgba(3, 8, 6, 0.95);
                      border-top: 1px solid rgba(223, 158, 71, 0.3);
                      color: #fff;
                      font-family: var(--font-sans), sans-serif;
                      position: relative;
                      z-index: 10;
                      padding: 4rem 5% 0 5%;
                      margin-top: auto;
                    }
                    .footer-top-ornament {
                      position: absolute;
                      top: -12px;
                      left: 50%;
                      transform: translateX(-50%);
                      background: #05100c;
                      padding: 0 20px;
                      color: #DF9E47;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }
                    .footer-grid {
                      display: grid;
                      grid-template-columns: 1.5fr 1fr 1fr 1fr;
                      gap: 4rem;
                      margin-bottom: 3rem;
                    }
                    .footer-col-title {
                      font-family: var(--font-serif), serif;
                      font-size: 1.1rem;
                      color: #DF9E47;
                      margin-bottom: 2rem;
                      text-transform: uppercase;
                      letter-spacing: 1px;
                      font-weight: 400;
                    }
                    .footer-col-1-brand {
                      display: flex;
                      align-items: flex-start;
                      gap: 16px;
                      margin-bottom: 1.5rem;
                    }
                    .footer-col-1-brand svg {
                      color: #DF9E47;
                      width: 42px;
                      height: 42px;
                    }
                    .footer-col-1-brand h3 {
                      font-family: var(--font-serif), serif;
                      font-size: 1.6rem;
                      color: #DF9E47;
                      margin: 0;
                      line-height: 1.1;
                      font-weight: 400;
                    }
                    .footer-desc {
                      color: #9CA3AF;
                      font-size: 0.85rem;
                      line-height: 1.8;
                      margin-bottom: 2rem;
                    }
                    .footer-separator {
                      height: 1px;
                      background-color: rgba(255, 255, 255, 0.05);
                      margin-bottom: 1.5rem;
                    }
                    .footer-contact-item {
                      display: flex;
                      align-items: center;
                      gap: 16px;
                      color: #9CA3AF;
                      font-size: 0.85rem;
                      margin-bottom: 1.2rem;
                    }
                    .footer-contact-item svg {
                      color: #DF9E47;
                      width: 18px;
                      height: 18px;
                      flex-shrink: 0;
                    }
                    .footer-social-circles {
                      display: flex;
                      gap: 12px;
                      margin-top: 2rem;
                    }
                    .social-circle {
                      width: 36px;
                      height: 36px;
                      border-radius: 50%;
                      border: 1px solid rgba(223, 158, 71, 0.3);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: #DF9E47;
                      text-decoration: none;
                      transition: all 0.2s;
                    }
                    .social-circle:hover {
                      background: rgba(223, 158, 71, 0.1);
                      border-color: #DF9E47;
                    }
                    .footer-link-list {
                      list-style: none;
                      padding: 0;
                      margin: 0;
                    }
                    .footer-link-list li {
                      margin-bottom: 1.2rem;
                    }
                    .footer-link-list a {
                      color: #9CA3AF;
                      text-decoration: none;
                      font-size: 0.85rem;
                      display: flex;
                      align-items: center;
                      gap: 8px;
                      transition: color 0.2s;
                    }
                    .footer-link-list a::before {
                      content: '›';
                      color: #DF9E47;
                      font-size: 1.2rem;
                      line-height: 0;
                      margin-top: -2px;
                    }
                    .footer-link-list a:hover {
                      color: #DF9E47;
                    }
                    .footer-social-list {
                      list-style: none;
                      padding: 0;
                      margin: 0;
                    }
                    .footer-social-list li {
                      margin-bottom: 1.5rem;
                    }
                    .footer-social-list a {
                      color: #DF9E47;
                      text-decoration: none;
                      font-size: 0.85rem;
                      display: flex;
                      align-items: center;
                      gap: 12px;
                      transition: color 0.2s;
                    }
                    .footer-social-list a:hover {
                      color: #fff;
                    }
                    .footer-trust-row {
                      border-top: 1px solid rgba(223, 158, 71, 0.15);
                      border-bottom: 1px solid rgba(223, 158, 71, 0.15);
                      padding: 2.5rem 0;
                      display: grid;
                      grid-template-columns: repeat(4, 1fr);
                      gap: 2rem;
                    }
                    .footer-trust-item {
                      display: flex;
                      align-items: center;
                      gap: 1.2rem;
                    }
                    .footer-trust-icon {
                      color: #DF9E47;
                      width: 36px;
                      height: 36px;
                      flex-shrink: 0;
                    }
                    .footer-trust-title {
                      font-size: 0.85rem;
                      font-weight: 600;
                      color: #DF9E47;
                      margin-bottom: 4px;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                    }
                    .footer-trust-desc {
                      font-size: 0.75rem;
                      color: #9CA3AF;
                    }
                    .footer-bottom-copyright {
                      text-align: center;
                      padding: 1.5rem 0;
                      font-size: 0.75rem;
                      color: #6B7280;
                      letter-spacing: 1px;
                      text-transform: uppercase;
                    }
                  `}} />
                  
                  <div className="footer-top-ornament">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#DF9E47">
                      <path d="M12 2C12 2 15 7 15 9C15 11 13.5 12 12 12C10.5 12 9 11 9 9C9 7 12 2 12 2Z"/>
                      <path d="M12 22C12 22 15 17 15 15C15 13 13.5 12 12 12C10.5 12 9 13 9 15C9 17 12 22 12 22Z"/>
                      <path d="M22 12C22 12 17 15 15 15C13 15 12 13.5 12 12C12 10.5 13 9 15 9C17 9 22 12 22 12Z"/>
                      <path d="M2 12C2 12 7 15 9 15C11 15 12 13.5 12 12C12 10.5 11 9 9 9C7 9 2 12 2 12Z"/>
                    </svg>
                  </div>

                  <div className="footer-grid">
                    <div className="footer-column-luxury">
                      <div className="footer-col-1-brand">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 20h4M9 20v-3a3 3 0 013-3h1a6 6 0 006-6V4M10 6a2 2 0 100-4 2 2 0 000 4z"/></svg>
                        <h3>AUREATE<br/>FOREST</h3>
                      </div>
                      <p className="footer-desc">
                        Chuyên cung cấp Saxophone chính hãng,<br/>
                        âm thanh chuẩn mực cho nghệ sĩ chuyên nghiệp.
                      </p>
                      <div className="footer-separator"></div>
                      <div className="footer-contact-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 21s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 7.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>TP. Hồ Chí Minh, Việt Nam</span>
                      </div>
                      <div className="footer-contact-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                        <span>0912 19 12 18</span>
                      </div>
                      <div className="footer-contact-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        <span>support@nhomtttnmusic.vn</span>
                      </div>
                      <div className="footer-social-circles">
                        <a href="#" className="social-circle">f</a>
                        <a href="#" className="social-circle" style={{ fontSize: '10px', fontWeight: 600 }}>Zalo</a>
                        <a href="#" className="social-circle">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        </a>
                      </div>
                    </div>

                    <div className="footer-column-luxury">
                      <h4 className="footer-col-title">THÔNG TIN</h4>
                      <ul className="footer-link-list">
                        <li><Link href="/about">Giới thiệu</Link></li>
                        <li><Link href="#">Chính sách bảo hành</Link></li>
                        <li><Link href="#">Chính sách đổi trả</Link></li>
                        <li><Link href="#">Điều khoản sử dụng</Link></li>
                        <li><Link href="#">Hướng dẫn mua hàng</Link></li>
                        <li><Link href="#">Câu hỏi thường gặp</Link></li>
                      </ul>
                    </div>

                    <div className="footer-column-luxury">
                      <h4 className="footer-col-title">DANH MỤC</h4>
                      <ul className="footer-link-list">
                        <li><Link href="/products?category=Alto%20Saxophone">Alto Saxophone</Link></li>
                        <li><Link href="/products?category=Tenor%20Saxophone">Tenor Saxophone</Link></li>
                        <li><Link href="/products?category=Soprano%20Saxophone">Soprano Saxophone</Link></li>
                        <li><Link href="/products?category=Phụ%20kiện%20Saxophone">Phụ kiện Saxophone</Link></li>
                        <li><Link href="/collections">Bộ sưu tập</Link></li>
                        <li><Link href="/products?category=Phụ%20kiện%20bảo%20dưỡng">Phụ kiện bảo dưỡng</Link></li>
                      </ul>
                    </div>

                    <div className="footer-column-luxury">
                      <h4 className="footer-col-title">KẾT NỐI</h4>
                      <ul className="footer-social-list">
                        <li><a href="#"><div style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid rgba(223,158,71,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>f</div> Facebook</a></li>
                        <li><a href="#"><div style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid rgba(223,158,71,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:600}}>Zalo</div> Zalo</a></li>
                        <li><a href="#"><div style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid rgba(223,158,71,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></div> Email</a></li>
                        <li><a href="#"><div style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid rgba(223,158,71,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></div> Instagram</a></li>
                        <li><a href="#"><div style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid rgba(223,158,71,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33 2.78 2.78 0 001.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg></div> YouTube</a></li>
                      </ul>
                    </div>
                  </div>

                  <div className="footer-trust-row">
                    <div className="footer-trust-item">
                      <svg className="footer-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                      <div>
                        <div className="footer-trust-title">SẢN PHẨM CHÍNH HÃNG</div>
                        <div className="footer-trust-desc">Cam kết 100% chính hãng</div>
                      </div>
                    </div>
                    
                    <div className="footer-trust-item">
                      <svg className="footer-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z"/><circle cx="12" cy="12" r="10" strokeWidth="1"/></svg>
                      <div>
                        <div className="footer-trust-title">BẢO HÀNH UY TÍN</div>
                        <div className="footer-trust-desc">Bảo hành chính hãng</div>
                      </div>
                    </div>

                    <div className="footer-trust-item">
                      <svg className="footer-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      <div>
                        <div className="footer-trust-title">GIAO HÀNG TOÀN QUỐC</div>
                        <div className="footer-trust-desc">Nhanh chóng & an toàn</div>
                      </div>
                    </div>

                    <div className="footer-trust-item">
                      <svg className="footer-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 15a4 4 0 11-8 0 4 4 0 018 0zM4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                      <div>
                        <div className="footer-trust-title">HỖ TRỢ 24/7</div>
                        <div className="footer-trust-desc">Tận tâm & chu đáo</div>
                      </div>
                    </div>
                  </div>

                  <div className="footer-bottom-copyright">
                    © 2026 AUREATE FOREST | AWS CLOUD PROJECT
                  </div>
                </footer>
              }
            >
              {children}
            </ConditionalLayout>
          </CartProvider>
        </AmplifyConfig>
      </body>
    </html>
  );
}