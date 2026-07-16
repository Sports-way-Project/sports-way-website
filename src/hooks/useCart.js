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
          const local = localStorage.getItem("guest_cart");
          setCartState(local ? JSON.parse(local) : []);
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

  const addToCart = async (product, qty = 1, variation = null, openCart = true) => {
    const nextItem = buildCartItem(product, qty, variation);
    const existing = cart.find((item) => item.cartId === nextItem.cartId);
    const mergedItem = existing ? { ...existing, qty: existing.qty + qty } : nextItem;
    const nextCart = existing
      ? cart.map((item) => item.cartId === nextItem.cartId ? mergedItem : item)
      : [...cart, mergedItem];

    const previous = cart;
    setCartState(nextCart);
    if (openCart) setCartOpen(true);

    if (!userId) {
      localStorage.setItem("guest_cart", JSON.stringify(nextCart));
      return;
    }

    try {
      await upsertCartItem(userId, mergedItem);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setCartState(previous);
    }
  };

  const changeQty = async (cartId, delta) => {
    const item = cart.find((entry) => entry.cartId === cartId);
    if (!item) return;
    const previous = cart;

    const nextQty = item.qty + delta;
    if (nextQty <= 0) {
      const nextCart = cart.filter((entry) => entry.cartId !== cartId);
      setCartState(nextCart);
      if (!userId) {
        localStorage.setItem("guest_cart", JSON.stringify(nextCart));
        return;
      }
      try {
        await removeCartItem(userId, cartId);
      } catch (error) {
        console.error("Failed to remove cart item:", error);
        setCartState(previous);
      }
      return;
    }

    const nextItem = { ...item, qty: nextQty };
    const nextCart = cart.map((entry) => entry.cartId === cartId ? nextItem : entry);
    setCartState(nextCart);

    if (!userId) {
      localStorage.setItem("guest_cart", JSON.stringify(nextCart));
      return;
    }
    try {
      await upsertCartItem(userId, nextItem);
    } catch (error) {
      console.error("Failed to update cart quantity:", error);
      setCartState(previous);
    }
  };

  const setCart = async (nextCart) => {
    const normalized = Array.isArray(nextCart) ? nextCart : [];
    setCartState(normalized);
    
    if (!userId) {
      localStorage.setItem("guest_cart", JSON.stringify(normalized));
      return;
    }

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
