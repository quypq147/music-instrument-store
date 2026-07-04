"use client";

import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-md border border-border-subtle bg-transparent opacity-30" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="p-2.5 rounded-md border border-border-subtle bg-white dark:bg-[#031d16] text-primary dark:text-[#80bea6] hover:border-secondary dark:hover:border-secondary hover:text-secondary dark:hover:text-secondary transition-all shadow-sm cursor-pointer focus:outline-none flex items-center justify-center relative overflow-hidden"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-secondary animate-pulse" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </div>
    </button>
  );
}
