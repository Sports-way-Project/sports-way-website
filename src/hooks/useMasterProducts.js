import { useEffect, useState } from "react";
import { getMasterProducts, saveMasterProducts, STORAGE_KEYS } from "../lib/storefront";

export function useMasterProducts() {
  const [products, setProducts] = useState(() => getMasterProducts());

  useEffect(() => {
    const refresh = () => setProducts(getMasterProducts());
    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    const observer = () => setProducts(getMasterProducts());
    window.addEventListener(STORAGE_KEYS.masterProducts, observer);
    return () => window.removeEventListener(STORAGE_KEYS.masterProducts, observer);
  }, []);

  const updateProducts = (nextProducts) => {
    setProducts(nextProducts);
    saveMasterProducts(nextProducts);
  };

  return { products, setProducts: updateProducts };
}
