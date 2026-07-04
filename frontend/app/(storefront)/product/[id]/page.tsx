import Link from "next/link";
import { notFound } from "next/navigation";

import { getProduct } from "../../../../lib/products";
import { ProductDetailClient } from "./ProductDetailClient";

type ProductDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const { product, error } = await getProduct(id);

  if (!product && error === "Product not found.") {
    notFound();
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-surface-cream dark:bg-[#02140f] pt-16 md:pt-20 flex items-center justify-center px-4 transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-[#06261d] rounded-2xl border border-slate-100 dark:border-primary-container/20 shadow-sm p-8 text-center">
          <h1 className="font-serif text-2xl text-primary mb-3">Không thể tải sản phẩm</h1>
          <p className="text-slate-500 dark:text-emerald-100/50 text-sm mb-6">{error}</p>

          <Link href="/products">
            <button className="bg-primary hover:bg-primary-container text-white dark:bg-secondary dark:text-[#002B1F] dark:hover:bg-secondary-container px-6 py-3 rounded-xl transition-colors font-semibold">
              Quay lại sản phẩm
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return <ProductDetailClient product={product} />;
}
