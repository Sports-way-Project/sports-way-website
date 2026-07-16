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
          const local = localStorage.getItem("guest_wishlist");
          setWishlist(local ? JSON.parse(local) : []);
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
    const numericId = Number(id);
    if (!userId) {
      const nextWishlist = wishlist.includes(numericId)
        ? wishlist.filter((item) => item !== numericId)
        : [...wishlist, numericId];
      setWishlist(nextWishlist);
      localStorage.setItem("guest_wishlist", JSON.stringify(nextWishlist));
      return;
    }

    // Optimistic — the heart icon used to appear frozen until this resolved
    // because the state update waited on the network call. Update locally
    // first, sync in the background, and roll back if it actually fails.
    const previous = wishlist;
    const nextWishlist = wishlist.includes(numericId)
      ? wishlist.filter((item) => item !== numericId)
      : [...wishlist, numericId];
    setWishlist(nextWishlist);
    try {
      const serverWishlist = await toggleWishlistId(userId, id);
      setWishlist(serverWishlist);
    } catch (error) {
      console.error("Failed to update wishlist:", error);
      setWishlist(previous);
    }
  };

  const removeWishlistItem = async (id) => {
    const nextWishlist = wishlist.filter((item) => String(item) !== String(id));
    if (!userId) {
      setWishlist(nextWishlist);
      localStorage.setItem("guest_wishlist", JSON.stringify(nextWishlist));
      return;
    }

    const previous = wishlist;
    setWishlist(nextWishlist);
    try {
      await replaceWishlist(userId, nextWishlist);
    } catch (error) {
      console.error("Failed to remove wishlist item:", error);
      setWishlist(previous);
    }
  };

  return {
    wishlist,
    toggleWishlist,
    removeWishlistItem,
  };
}
