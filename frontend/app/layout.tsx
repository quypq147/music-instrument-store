import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ConfirmDialogProvider } from "./context/ConfirmDialogContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Playfair_Display, Inter } from "next/font/google";
import AmplifyConfig from "./components/common/AmplifyConfig";

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
      <body className={`${inter.variable} ${playfair.variable} bg-surface-cream text-primary transition-colors duration-300`}>
        <AmplifyConfig>
          <ThemeProvider>
            <ToastProvider>
              <WishlistProvider>
                <ConfirmDialogProvider>
                  <CartProvider>{children}</CartProvider>
                </ConfirmDialogProvider>
              </WishlistProvider>
            </ToastProvider>
          </ThemeProvider>
        </AmplifyConfig>
      </body>
    </html>
  );
}
