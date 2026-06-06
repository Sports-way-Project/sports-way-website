import { useEffect, useMemo, useState } from "react";
import { buildCartItem, getStoredJson, setStoredJson, STORAGE_KEYS } from "../lib/storefront";

export function useCart() {
  const [cart, setCart] = useState(() => getStoredJson(STORAGE_KEYS.cart, []));
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    setStoredJson(STORAGE_KEYS.cart, cart);
  }, [cart]);

  useEffect(() => {
    const refresh = () => setCart(getStoredJson(STORAGE_KEYS.cart, []));
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.qty, 0),
    [cart],
  );
  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.qty, 0),
    [cart],
  );

  const addToCart = (product, qty = 1, variation = null) => {
    const nextItem = buildCartItem(product, qty, variation);
    setCart((current) => {
      const existing = current.find((item) => item.cartId === nextItem.cartId);
      if (existing) {
        return current.map((item) =>
          item.cartId === nextItem.cartId ? { ...item, qty: item.qty + qty } : item,
        );
      }

      return [...current, nextItem];
    });
    setCartOpen(true);
  };

  const changeQty = (cartId, delta) => {
    setCart((current) =>
      current
        .map((item) => (item.cartId === cartId ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0),
    );
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
