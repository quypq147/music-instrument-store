import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main
      data-testid="not-found-page"
      className="min-h-screen flex flex-col items-center justify-center bg-surface-cream text-primary px-6 text-center transition-colors duration-300"
    >
      <Compass className="w-16 h-16 text-secondary animate-float-slow mb-6" strokeWidth={1.5} />
      <h1 className="font-serif text-6xl md:text-7xl mb-4">404</h1>
      <p className="font-serif text-2xl mb-2">Không tìm thấy trang</p>
      <p className="text-sm text-slate-500 dark:text-emerald-100/50 max-w-md mb-8">
        Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/">
          <button className="bg-primary hover:bg-primary-container text-white dark:bg-secondary dark:text-[#002B1F] dark:hover:bg-secondary-container px-6 py-3 rounded-xl transition-colors font-semibold">
            Về trang chủ
          </button>
        </Link>
        <Link href="/products">
          <button className="border border-border-subtle hover:bg-black/5 dark:hover:bg-white/5 px-6 py-3 rounded-xl transition-colors font-semibold">
            Xem sản phẩm
          </button>
        </Link>
      </div>
    </main>
  );
}
