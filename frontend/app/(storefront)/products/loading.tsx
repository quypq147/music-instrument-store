export default function ProductsLoading() {
  const skeletonItems = Array.from({ length: 8 }, (_, index) => index);

  return (
    <main className="min-h-screen bg-[#FDFBF7] pt-[80px]">
      {/* HERO SECTION SKELETON */}
      <section className="relative w-full py-16 md:py-24 px-6 lg:px-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #001A12 0%, #053324 100%)' }}>
        <div className="relative z-10 max-w-4xl animate-pulse">
          <div className="h-14 bg-white/10 rounded-lg w-3/4 md:w-1/2 mb-4"></div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-[1px] bg-[#DF9E47]/50"></div>
            <div className="w-3 h-3 bg-[#DF9E47]/50 rotate-45"></div>
            <div className="w-12 h-[1px] bg-[#DF9E47]/50"></div>
          </div>

          <div className="h-6 bg-white/10 rounded-md w-full md:w-2/3 mb-10"></div>
          <div className="h-10 bg-white/10 rounded-md w-80"></div>
        </div>
      </section>

      {/* FILTER BAR SKELETON */}
      <section className="relative z-20 px-6 lg:px-24 -mt-12">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_-10px_rgba(223,158,71,0.1)] border border-gray-100 p-4 md:p-6 animate-pulse">
          <div className="flex flex-wrap lg:flex-nowrap gap-4 items-center">
            <div className="flex-1 w-full h-12 bg-gray-100 rounded-xl"></div>
            <div className="w-full md:w-48 shrink-0 h-12 bg-gray-100 rounded-xl"></div>
            <div className="w-full md:w-48 shrink-0 h-12 bg-gray-100 rounded-xl"></div>
            <div className="w-full md:w-48 shrink-0 h-12 bg-gray-100 rounded-xl"></div>
            <div className="w-full md:w-auto shrink-0 w-24 h-12 bg-[#001A12]/50 rounded-xl"></div>
          </div>
        </div>
      </section>

      {/* PRODUCTS GRID SKELETON */}
      <section className="px-6 lg:px-24 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {skeletonItems.map((item) => (
            <article key={item} className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
              <div className="w-full pt-[85%] bg-gray-100"></div>
              
              <div className="p-5 flex flex-col flex-grow">
                <div className="h-3 w-16 bg-gray-200 rounded mb-3"></div>
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="h-5 w-1/2 bg-gray-200 rounded mb-4"></div>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-gray-200 rounded-full"></div>
                    ))}
                  </div>
                  <div className="h-3 w-20 bg-gray-200 rounded"></div>
                </div>

                <div className="mt-auto flex items-end justify-between">
                  <div className="h-6 w-24 bg-gray-200 rounded"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
