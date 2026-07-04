export interface CartItem {
  id: number;
  name: string;
  price: string;
  image: string;
  quantity?: number;
}

export interface Customer {
  name: string;
  phone: string;
  address: string;
  note: string;
}

export interface Order {
  id: string;
  customer?: Customer;
  paymentMethod: string;
  products?: CartItem[];
  totalItems?: number;
  totalPrice?: number;
  status: string;
  createdAt: string;
  couponCode?: string;
  discountAmount?: number;
}
