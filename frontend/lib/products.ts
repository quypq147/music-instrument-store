import type { Product } from "../types/product";

type ProductsResult = {
  products: Product[];
  error?: string;
};

type ProductResult = {
  product?: Product;
  error?: string;
};

const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const product = value as Record<string, unknown>;

  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.brand === "string" &&
    (product.type === undefined || typeof product.type === "string") &&
    typeof product.price === "number" &&
    typeof product.imageUrl === "string" &&
    typeof product.description === "string"
  );
};

// Fallback Mock Data to ensure the luxury UI always renders beautifully even without the API
const mockProducts: Product[] = [
  {
    id: "mock-1",
    name: "Selmer AS500 Student Alto Saxophone",
    brand: "Selmer",
    type: "Alto Saxophone",
    price: 1250,
    imageUrl: "/images/selmer-as500-1.jpg",
    description: "Dòng Saxophone hoàn hảo dành cho người mới bắt đầu với âm thanh ấm áp và phím bấm êm ái.",
  },
  {
    id: "mock-2",
    name: "Conn AS650 Professional Alto",
    brand: "Conn",
    type: "Alto Saxophone",
    price: 2400,
    imageUrl: "/images/conn-as650-1.jpg",
    description: "Nhạc cụ chuyên nghiệp mang lại độ vang tuyệt vời và âm sắc cổ điển đậm chất Conn.",
  },
  {
    id: "mock-3",
    name: "Jupiter JAS700 Alto Sax",
    brand: "Jupiter",
    type: "Alto Saxophone",
    price: 1350,
    imageUrl: "/images/jupiter-jas700-1.jpg",
    description: "Lựa chọn đáng tin cậy với độ bền cao và âm thanh sáng, lý tưởng cho sinh viên và biểu diễn.",
  },
  {
    id: "mock-4",
    name: "Conn New Wonder Vintage Tenor",
    brand: "Conn",
    type: "Tenor Saxophone",
    price: 3200,
    imageUrl: "/images/conn-newwoner-1.jpg",
    description: "Dòng Saxophone Tenor cổ điển mang âm sắc dày dặn, ấm áp đặc trưng của thập niên 1920.",
  },
  {
    id: "mock-5",
    name: "Vandoren V16 Alto Mouthpiece",
    brand: "Vandoren",
    type: "Phụ kiện",
    price: 150,
    imageUrl: "/images/mouthpiece.jpg",
    description: "Búp kèn huyền thoại tạo ra âm thanh jazz cổ điển, độ mở phù hợp với nhiều phong cách.",
  },
  {
    id: "mock-6",
    name: "Dây Đeo Saxophone Cao Cấp",
    brand: "Aureate",
    type: "Phụ kiện",
    price: 45,
    imageUrl: "/images/day-deo-saxophone.jpg",
    description: "Thiết kế đệm cổ cực êm, giảm tải áp lực tối đa, thích hợp cho việc tập luyện thời gian dài.",
  }
];

const getApiUrl = () => {
  if (typeof window !== "undefined") {
    return "/api";
  }
  return process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "") || "";
};

export async function getProducts(): Promise<ProductsResult> {
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    return {
      products: mockProducts,
      error: "API chưa được cấu hình. Đang hiển thị sản phẩm mẫu (Mock Data).",
    };
  }

  try {
    const response = await fetch(`${apiUrl}/products`, {
      next: {
        revalidate: 300,
        tags: ["products"],
      },
    });

    if (!response.ok) {
      return {
        products: [],
        error: `Product API returned ${response.status}.`,
      };
    }

    const data: unknown = await response.json();
    const products = Array.isArray(data)
      ? data
      : data &&
          typeof data === "object" &&
          Array.isArray((data as { products?: unknown }).products)
        ? (data as { products: unknown[] }).products
        : undefined;

    if (!products) {
      return {
        products: [],
        error: "Product API returned an unexpected response.",
      };
    }

    return {
      products: products.filter(isProduct),
    };
  } catch {
    return {
      products: mockProducts,
      error: "Không thể tải sản phẩm từ API. Đang hiển thị sản phẩm mẫu (Mock Data).",
    };
  }
}

export async function getProduct(id: string): Promise<ProductResult> {
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    const product = mockProducts.find(p => p.id === id);
    if (product) return { product };
    return {
      error: "NEXT_PUBLIC_API_GATEWAY_URL is not configured.",
    };
  }

  try {
    const response = await fetch(`${apiUrl}/products/${encodeURIComponent(id)}`, {
      next: {
        revalidate: 300,
        tags: ["products", `product-${id}`],
      },
    });

    if (response.status === 404) {
      return {
        error: "Product not found.",
      };
    }

    if (!response.ok) {
      return {
        error: `Product API returned ${response.status}.`,
      };
    }

    const data: unknown = await response.json();
    const product = data && typeof data === "object"
      ? (data as { product?: unknown }).product
      : undefined;

    if (!isProduct(product)) {
      return {
        error: "Product API returned an unexpected response.",
      };
    }

    return {
      product,
    };
  } catch {
    const mockProduct = mockProducts.find(p => p.id === id);
    if (mockProduct) return { product: mockProduct };
    
    return {
      error: "Unable to load this product right now.",
    };
  }
}
