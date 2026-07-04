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
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: CartItem) => void;
  increaseQuantity: (id: number) => void;
  decreaseQuantity: (id: number) => void;
  removeItem: (id: number) => void;
  totalItems: number;
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
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity:
                  (item.quantity || 1) + 1,
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
  };

  const increaseQuantity = (id: number) => {
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
