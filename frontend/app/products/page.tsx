const products = [
  {
    id: 1,
    name: "Yamaha Alto Saxophone",
    price: "25,000,000 VND",
  },
  {
    id: 2,
    name: "Selmer Tenor Saxophone",
    price: "48,000,000 VND",
  },
  {
    id: 3,
    name: "Beginner Saxophone Kit",
    price: "12,000,000 VND",
  },
];

export default function ProductsPage() {
  return (
    <main className="min-h-screen p-10">
      <h1 className="text-4xl font-bold">Products</h1>
      <p className="mt-2 text-gray-600">Browse our saxophone collection</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="rounded border p-6">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="mt-2">{product.price}</p>
            <button className="mt-4 rounded bg-black px-4 py-2 text-white">
              View Detail
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}