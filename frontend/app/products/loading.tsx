const skeletonItems = Array.from({ length: 8 }, (_, index) => index);

export default function ProductsLoading() {
  return (
    <main className="product-listing-page">
      <h1 className="section-title">Danh Sách Sản Phẩm</h1>

      <section className="products" aria-label="Đang tải sản phẩm">
        {skeletonItems.map((item) => (
          <article className="card product-skeleton-card" key={item}>
            <div className="product-skeleton-image" />
            <div className="product-skeleton-line short" />
            <div className="product-skeleton-line" />
            <div className="product-skeleton-line medium" />
            <div className="product-skeleton-button" />
          </article>
        ))}
      </section>
    </main>
  );
}
