export interface Product {
  id: string;
  name: string;
  brand: string;
  type?: string;
  price: number;
  imageUrl: string;
  description: string;
  averageRating?: number;
  ratingCount?: number;
  viewCount?: number;
  soldCount?: number;
  wishlistCount?: number;
  stock?: number | null;
  inStock?: boolean;
}
