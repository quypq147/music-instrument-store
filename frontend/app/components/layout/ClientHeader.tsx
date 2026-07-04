"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import AuthNav from "../nav/AuthNav";
import CartButton from "../cart/CartButton";
import ThemeToggle from "../common/ThemeToggle";

export default function ClientHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "TRANG CHỦ", isActive: pathname === "/" },
    {
      href: "/products",
      label: "SẢN PHẨM",
      isActive: pathname === "/products" || pathname.startsWith("/product/"),
    },
    { href: "/lien-he", label: "LIÊN HỆ", isActive: pathname === "/lien-he" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-16 md:h-20 px-4 md:px-6 lg:px-24 flex items-center justify-between gap-2 md:gap-4 border-b border-[#DF9E47]/10 backdrop-blur-md transition-shadow duration-300 ${
          isScrolled ? "shadow-lg shadow-black/20" : ""
        }`}
        style={{ backgroundColor: "rgba(0, 26, 18, 0.95)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline shrink-0 group">
          <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-[#DF9E47] group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
              <path d="M50 5 C30 5, 20 20, 20 20 C20 20, 30 25, 30 35 C30 45, 20 50, 20 50 C30 65, 45 80, 50 95 C55 80, 70 65, 80 50 C80 50, 70 45, 70 35 C70 25, 80 20, 80 20 C80 20, 70 5, 50 5 Z" fill="none" stroke="currentColor" strokeWidth="3" />
              <path d="M50 25 C45 35, 35 45, 35 45 C45 55, 50 70, 50 70 C50 70, 55 55, 65 45 C65 45, 55 35, 50 25 Z" fill="currentColor" />
              {/* Crown elements */}
              <circle cx="20" cy="15" r="3" />
              <circle cx="50" cy="10" r="4" />
              <circle cx="80" cy="15" r="3" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="font-serif text-lg md:text-xl leading-none tracking-wider m-0" style={{ color: '#DF9E47' }}>
              AUREATE FOREST
            </h1>
            <p className="font-sans text-[9px] md:text-[10px] tracking-[0.3em] font-bold uppercase mt-1 m-0" style={{ color: '#DF9E47' }}>
              BOUTIQUE
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-12 ml-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-bold uppercase tracking-widest transition-colors py-2 relative group"
              style={{ color: link.isActive ? "#DF9E47" : "white" }}
            >
              {link.label}
              <span
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-[#DF9E47] origin-left transition-transform duration-300 ${
                  link.isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4 lg:gap-6 ml-auto">
          <form action="/products" method="GET" className="relative hidden lg:block">
            <input
              type="text"
              name="q"
              placeholder="Tìm kiếm sản phẩm..."
              className="bg-[#052419] border border-transparent focus:border-[#DF9E47]/50 rounded-lg py-2 pl-4 pr-10 text-white text-xs w-48 xl:w-64 outline-none transition-all placeholder:text-gray-500"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#DF9E47] transition-colors">
              <Search width="14" height="14" />
            </button>
          </form>

          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <ThemeToggle />
            <AuthNav />
            <CartButton />
          </div>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex md:hidden flex-col gap-1.5 justify-center items-center w-9 h-9 border border-[#DF9E47]/20 rounded-lg text-[#DF9E47] bg-transparent outline-none focus:outline-none"
            style={{ cursor: 'pointer' }}
            type="button"
            aria-label="Menu"
          >
            <span className={`block w-4.5 h-0.5 bg-[#DF9E47] transition-transform duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-4.5 h-0.5 bg-[#DF9E47] transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-0" : "opacity-100"}`} />
            <span className={`block w-4.5 h-0.5 bg-[#DF9E47] transition-transform duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </header>

      {/* Mobile Backdrop + Drawer Menu — rendered outside <header> because its
          backdrop-blur-md establishes a containing block for position:fixed
          descendants, which would otherwise clip them to the header's own height. */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden nav-backdrop-enter"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className="fixed top-16 md:top-20 left-0 right-0 border-b border-[#DF9E47]/10 flex flex-col p-6 gap-1 z-40 md:hidden nav-drawer-enter"
            style={{ backgroundColor: 'rgba(0, 26, 18, 0.98)' }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xs font-bold uppercase tracking-widest py-3 border-b border-white/5 no-underline"
                style={{ color: link.isActive ? "#DF9E47" : "white" }}
              >
                {link.label}
              </Link>
            ))}
            <div
              className="flex items-center justify-between gap-4 pt-4 border-t border-white/10"
            >
              <div className="flex gap-4 items-center" onClick={() => setIsMobileMenuOpen(false)}>
                <AuthNav />
                <CartButton />
              </div>
              <div onClick={() => setIsMobileMenuOpen(false)}>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes navDrawerSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes navBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .nav-drawer-enter {
          animation: navDrawerSlide 0.25s ease-out;
        }
        .nav-backdrop-enter {
          animation: navBackdropFade 0.2s ease-out;
        }
      `}} />
    </>
  );
}
