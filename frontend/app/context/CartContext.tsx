"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface CartItem {
  id: number;
  name: string;
  price: string;
  image: string;
  quantity?: number;
  stock?: number | null;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: CartItem) => boolean;
  increaseQuantity: (id: number) => boolean;
  decreaseQuantity: (id: number) => void;
  removeItem: (id: number) => void;
  totalItems: number;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const CartContext = createContext<CartContextType | null>(
  null
);

const getStoredCart = (): CartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  return JSON.parse(
    localStorage.getItem("cart") || "[]"
  ) as CartItem[];
};

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Start empty on both server and client so the first client render matches
  // the server-rendered HTML exactly; the real cart is loaded after mount to
  // avoid a hydration mismatch when localStorage already has items.
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCart(getStoredCart());
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );
  }, [cart, isLoaded]);

  const addToCart = (product: CartItem) => {
    const existing = cart.find((item) => item.id === product.id);
    const stock = existing ? (existing.stock ?? product.stock) : product.stock;
    const currentQty = existing?.quantity || 1;
    if (typeof stock === "number" && currentQty >= stock) {
      return false;
    }

    setCart((currentCart) => {
      const existingInner = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingInner) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity:
                  (item.quantity || 1) + 1,
                stock: product.stock ?? item.stock,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
    return true;
  };

  const increaseQuantity = (id: number) => {
    const existing = cart.find((item) => item.id === id);
    const currentQty = existing?.quantity || 1;
    if (existing && typeof existing.stock === "number" && currentQty >= existing.stock) {
      return false;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: (item.quantity || 1) + 1,
            }
          : item
      )
    );
    return true;
  };

  const decreaseQuantity = (id: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: (item.quantity || 1) - 1,
              }
            : item
        )
        .filter(
          (item) => (item.quantity || 0) > 0
        )
    );
  };

  const removeItem = (id: number) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== id
      )
    );
  };

  const totalItems = cart.reduce(
  (sum, item) =>
    sum + (item.quantity || 1),
  0
);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeItem,
        totalItems,
        setCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(
    CartContext
  );

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}
