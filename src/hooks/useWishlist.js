import { useEffect, useMemo, useState } from "react";
import { getWishlistKey, getWishlistMap, saveWishlistMap } from "../lib/storefront";

export function useWishlist(currentUser) {
  const [wishlistMap, setWishlistMap] = useState(() => getWishlistMap());

  useEffect(() => {
    const refresh = () => setWishlistMap(getWishlistMap());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const wishlistKey = useMemo(() => getWishlistKey(currentUser), [currentUser]);
  const wishlist = wishlistMap[wishlistKey] || [];

  const toggleWishlist = (id) => {
    setWishlistMap((current) => {
      const currentIds = current[wishlistKey] || [];
      const nextIds = currentIds.includes(id)
        ? currentIds.filter((item) => item !== id)
        : [...currentIds, id];
      const next = { ...current, [wishlistKey]: nextIds };
      saveWishlistMap(next);
      return next;
    });
  };

  const removeWishlistItem = (id) => {
    setWishlistMap((current) => {
      const next = {
        ...current,
        [wishlistKey]: (current[wishlistKey] || []).filter((item) => String(item) !== String(id)),
      };
      saveWishlistMap(next);
      return next;
    });
  };

  return {
    wishlist,
    toggleWishlist,
    removeWishlistItem,
  };
}
