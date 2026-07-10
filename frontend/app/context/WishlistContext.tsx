"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import { useToast } from "./ToastContext";
import { getWishlist, addToWishlist, removeFromWishlist } from "../../lib/api/wishlist";

interface WishlistContextType {
  isWishlisted: (productId: string | number) => boolean;
  toggleWishlist: (product: { id: string | number; name: string }) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchWishlist = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;

      const result = await getWishlist(token);
      if (result.ok) {
        setWishlistIds(new Set(result.data.map((item) => String(item.productId))));
      }
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
        await fetchWishlist();
      } catch {
        setIsAuthenticated(false);
      }
    })();
  }, [fetchWishlist]);

  const isWishlisted = (productId: string | number) => wishlistIds.has(String(productId));

  const toggleWishlist = async (product: { id: string | number; name: string }) => {
    if (!isAuthenticated) {
      showToast("Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!", "warning");
      router.push("/login");
      return;
    }

    const productId = String(product.id);
    const currentlyWishlisted = wishlistIds.has(productId);

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No token found");

      if (currentlyWishlisted) {
        const result = await removeFromWishlist(token, productId);
        if (result.ok) {
          setWishlistIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
          showToast(`Đã xóa ${product.name} khỏi danh sách yêu thích!`, "info");
        } else {
          showToast("Lỗi khi xóa khỏi danh sách yêu thích.", "error");
        }
      } else {
        const result = await addToWishlist(token, productId);
        if (result.ok) {
          setWishlistIds((prev) => new Set(prev).add(productId));
          showToast(`Đã thêm ${product.name} vào danh sách yêu thích!`, "success");
        } else {
          showToast("Lỗi khi thêm vào danh sách yêu thích.", "error");
        }
      }
    } catch (err) {
      console.error("Wishlist action failed:", err);
      showToast("Đã xảy ra lỗi. Vui lòng thử lại sau!", "error");
    }
  };

  return (
    <WishlistContext.Provider value={{ isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }
  return context;
}
