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
    <div className="fixed bottom-25 right-7.5 flex flex-col gap-4 z-9999">
      {/* Phone */}
      <Link
        href="tel:0912191218"
        className="w-15 h-15 bg-[#4CAF50] rounded-full flex items-center justify-center text-white shadow-[0_10px_25px_rgba(76,175,80,0.3)] transition-transform hover:scale-105"
      >
        <Phone width="24" height="24" />
      </Link>
      {/* Zalo */}
      <Link
        href="https://zalo.me/0912191218"
        target="_blank"
        rel="noopener noreferrer"
        className="w-15 h-15 bg-[#0068FF] rounded-full flex items-center justify-center text-white no-underline font-bold text-sm font-sans shadow-[0_10px_25px_rgba(0,104,255,0.3)] transition-transform hover:scale-105"
      >
        Zalo
      </Link>
    </div>
  );
}
