import { Suspense } from "react";
import { getProducts } from "../../../lib/products";
import { ProductBrowserClient } from "../../components/product/ProductBrowserClient";

export default async function ProductsPage() {
  const { products, error } = await getProducts();

  return (
    <Suspense
      fallback={
        <main className="product-listing-page" style={{ display: "flex", justifyContent: "center", minHeight: "60vh", alignItems: "center" }}>
          <p className="product-status">Đang tải danh sách sản phẩm...</p>
        </main>
      }
    >
      <ProductBrowserClient products={products} initialError={error || null} />
    </Suspense>
  );
}
