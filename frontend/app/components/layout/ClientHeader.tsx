"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import AuthNav from "../nav/AuthNav";
import CartButton from "../cart/CartButton";

export default function ClientHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 md:h-20 px-4 md:px-6 lg:px-24 flex items-center justify-between gap-2 md:gap-4 border-b border-[#DF9E47]/10 backdrop-blur-md" style={{ backgroundColor: 'rgba(0, 26, 18, 0.95)' }}>
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
        <Link 
          href="/" 
          className="text-xs font-bold uppercase tracking-widest transition-colors py-2 relative group hover:opacity-80"
          style={{ color: pathname === '/' ? '#DF9E47' : 'white' }}
        >
          TRANG CHỦ
          {pathname === '/' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#DF9E47]" style={{ backgroundColor: '#DF9E47' }}></div>}
        </Link>
        <Link 
          href="/products" 
          className="text-xs font-bold uppercase tracking-widest transition-colors py-2 relative group hover:opacity-80"
          style={{ color: (pathname === '/products' || pathname.startsWith('/product/')) ? '#DF9E47' : 'white' }}
        >
          SẢN PHẨM
          {(pathname === '/products' || pathname.startsWith('/product/')) && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#DF9E47]" style={{ backgroundColor: '#DF9E47' }}></div>}
        </Link>
        <Link 
          href="/lien-he" 
          className="text-xs font-bold uppercase tracking-widest transition-colors py-2 relative group hover:opacity-80"
          style={{ color: pathname === '/lien-he' ? '#DF9E47' : 'white' }}
        >
          LIÊN HỆ
          {pathname === '/lien-he' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#DF9E47]" style={{ backgroundColor: '#DF9E47' }}></div>}
        </Link>
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

        <AuthNav />
        <CartButton />

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

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-20 left-0 right-0 bg-[#001a12] border-b border-[#DF9E47]/10 flex flex-col p-6 gap-4 z-40 md:hidden animate-fade-in" style={{ backgroundColor: 'rgba(0, 26, 18, 0.98)' }}>
          <Link 
            href="/" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-xs font-bold uppercase tracking-widest py-3 border-b border-white/5 no-underline"
            style={{ color: pathname === '/' ? '#DF9E47' : 'white' }}
          >
            TRANG CHỦ
          </Link>
          <Link 
            href="/products" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-xs font-bold uppercase tracking-widest py-3 border-b border-white/5 no-underline"
            style={{ color: (pathname === '/products' || pathname.startsWith('/product/')) ? '#DF9E47' : 'white' }}
          >
            SẢN PHẨM
          </Link>
          <Link 
            href="/lien-he" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-xs font-bold uppercase tracking-widest py-3 no-underline"
            style={{ color: pathname === '/lien-he' ? '#DF9E47' : 'white' }}
          >
            LIÊN HỆ
          </Link>
        </div>
      )}
    </header>
  );
}
