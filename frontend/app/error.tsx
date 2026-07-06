"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      data-testid="error-page"
      className="min-h-screen flex flex-col items-center justify-center bg-surface-cream text-primary px-6 text-center transition-colors duration-300"
    >
      <AlertTriangle className="w-16 h-16 text-secondary mb-6" strokeWidth={1.5} />
      <h1 className="font-serif text-3xl md:text-4xl mb-2">Đã có lỗi xảy ra</h1>
      <p className="text-sm text-slate-500 dark:text-emerald-100/50 max-w-md mb-8">
        Rất tiếc, đã có lỗi xảy ra khi tải trang. Vui lòng thử lại.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="bg-primary hover:bg-primary-container text-white dark:bg-secondary dark:text-[#002B1F] dark:hover:bg-secondary-container px-6 py-3 rounded-xl transition-colors font-semibold"
        >
          Thử lại
        </button>
        <Link href="/">
          <button className="border border-border-subtle hover:bg-black/5 dark:hover:bg-white/5 px-6 py-3 rounded-xl transition-colors font-semibold">
            Về trang chủ
          </button>
        </Link>
      </div>
    </main>
  );
}
