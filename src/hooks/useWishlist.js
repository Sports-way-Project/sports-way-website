import { useEffect, useState } from "react";
import { fetchWishlistIds, replaceWishlist, toggleWishlistId } from "../lib/storefrontApi";

export function useWishlist(sessionUser) {
  const [wishlist, setWishlist] = useState([]);
  const userId = sessionUser?.id || null;

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      if (!userId) {
        if (active) {
          setWishlist([]);
        }
        return;
      }

      const nextWishlist = await fetchWishlistIds(userId);
      if (active) {
        setWishlist(nextWishlist);
      }
    };

    refresh();
    return () => {
      active = false;
    };
  }, [userId]);

  const toggleWishlist = async (id) => {
    if (!userId) {
      window.alert("Unable to save wishlist right now. Please refresh and try again.");
      return;
    }

    const nextWishlist = await toggleWishlistId(userId, id);
    setWishlist(nextWishlist);
  };

  const removeWishlistItem = async (id) => {
    if (!userId) {
      return;
    }

    const nextWishlist = wishlist.filter((item) => String(item) !== String(id));
    await replaceWishlist(userId, nextWishlist);
    setWishlist(nextWishlist);
  };

  return {
    wishlist,
    toggleWishlist,
    removeWishlistItem,
  };
}
