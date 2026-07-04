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
      <main className="product-detail-page">
        <div className="product-detail-card">
          <div className="product-detail-info">
            <h1>Không thể tải sản phẩm</h1>
            <p>{error}</p>

            <Link href="/products">
              <button className="back-btn">Quay lại sản phẩm</button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <ProductDetailClient product={product} />;
}
