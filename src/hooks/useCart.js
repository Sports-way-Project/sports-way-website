import { useEffect, useMemo, useState } from "react";
import { buildCartItem } from "../lib/storefront";
import { clearCart, fetchCartItems, removeCartItem, replaceCart, upsertCartItem } from "../lib/storefrontApi";

export function useCart(sessionUser) {
  const [cart, setCartState] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const userId = sessionUser?.id || null;

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      if (!userId) {
        if (active) {
          setCartState([]);
        }
        return;
      }

      const nextCart = await fetchCartItems(userId);
      if (active) {
        setCartState(nextCart);
      }
    };

    refresh();
    return () => {
      active = false;
    };
  }, [userId]);

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.qty, 0),
    [cart],
  );
  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.qty, 0),
    [cart],
  );

  const addToCart = async (product, qty = 1, variation = null) => {
    if (!userId) {
      window.alert("Unable to add to cart right now. Please refresh and try again.");
      return;
    }

    const nextItem = buildCartItem(product, qty, variation);
    const existing = cart.find((item) => item.cartId === nextItem.cartId);
    const mergedItem = existing ? { ...existing, qty: existing.qty + qty } : nextItem;
    const nextCart = existing
      ? cart.map((item) => item.cartId === nextItem.cartId ? mergedItem : item)
      : [...cart, mergedItem];

    setCartState(nextCart);
    await upsertCartItem(userId, mergedItem);
    setCartOpen(true);
  };

  const changeQty = async (cartId, delta) => {
    const item = cart.find((entry) => entry.cartId === cartId);
    if (!item || !userId) {
      return;
    }

    const nextQty = item.qty + delta;
    if (nextQty <= 0) {
      setCartState((current) => current.filter((entry) => entry.cartId !== cartId));
      await removeCartItem(userId, cartId);
      return;
    }

    const nextItem = { ...item, qty: nextQty };
    setCartState((current) => current.map((entry) => entry.cartId === cartId ? nextItem : entry));
    await upsertCartItem(userId, nextItem);
  };

  const setCart = async (nextCart) => {
    if (!userId) {
      setCartState(Array.isArray(nextCart) ? nextCart : []);
      return;
    }

    const normalized = Array.isArray(nextCart) ? nextCart : [];
    setCartState(normalized);
    if (normalized.length) {
      await replaceCart(userId, normalized);
    } else {
      await clearCart(userId);
    }
  };

  return {
    addToCart,
    cart,
    cartCount,
    cartOpen,
    cartTotal,
    changeQty,
    setCart,
    setCartOpen,
  };
}
