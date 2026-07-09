export default function Loading() {
  return (
    <main data-testid="product-detail-loading" className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="relative w-full aspect-square max-w-120 bg-[#F3EFEA] dark:bg-[#031d16] rounded-2xl animate-pulse" />
        <div className="space-y-4 pt-2">
          <div className="h-8 w-3/4 bg-border-subtle dark:bg-primary-container/30 rounded-lg animate-pulse" />
          <div className="h-6 w-1/3 bg-border-subtle dark:bg-primary-container/30 rounded-lg animate-pulse" />
          <div className="h-4 w-full bg-border-subtle dark:bg-primary-container/30 rounded-lg animate-pulse" />
          <div className="h-4 w-full bg-border-subtle dark:bg-primary-container/30 rounded-lg animate-pulse" />
          <div className="h-4 w-2/3 bg-border-subtle dark:bg-primary-container/30 rounded-lg animate-pulse" />
          <div className="h-12 w-48 bg-border-subtle dark:bg-primary-container/30 rounded-xl animate-pulse mt-6" />
        </div>
      </div>
    </main>
  );
}
