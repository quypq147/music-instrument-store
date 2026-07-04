"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Phone } from "lucide-react";

export default function FloatingContacts() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsChatOpen(customEvent.detail?.isOpen || false);
    };
    window.addEventListener("chat-widget-toggle", handleToggle);
    return () => window.removeEventListener("chat-widget-toggle", handleToggle);
  }, []);

  if (isChatOpen) return null;

  return (
    <div style={{ position: 'fixed', bottom: '100px', right: '30px', display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 9999 }}>
      {/* Phone */}
      <Link href="tel:0912191218" style={{ width: '60px', height: '60px', backgroundColor: '#4CAF50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(76, 175, 80, 0.3)', transition: 'transform 0.2s', color: 'white' }}>
        <Phone width="24" height="24" />
      </Link>
      {/* Zalo */}
      <Link href="https://zalo.me/0912191218" target="_blank" rel="noopener noreferrer" style={{ width: '60px', height: '60px', backgroundColor: '#0068FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0, 104, 255, 0.3)', transition: 'transform 0.2s', color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', fontFamily: 'var(--font-sans), sans-serif' }}>
        Zalo
      </Link>
    </div>
  );
}
