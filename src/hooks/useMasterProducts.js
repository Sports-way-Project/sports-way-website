import { useEffect, useState } from "react";
import { fetchProducts, upsertProducts } from "../lib/storefrontApi";

export function useMasterProducts() {
  const [products, setProductsState] = useState([]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const nextProducts = await fetchProducts();
      if (active) {
        setProductsState(nextProducts);
      }
    };

    refresh();
    return () => {
      active = false;
    };
  }, []);

  const setProducts = async (nextProducts) => {
    setProductsState(nextProducts);
    const syncedProducts = await upsertProducts(nextProducts);
    setProductsState(syncedProducts);
    return syncedProducts;
  };

  return { products, setProducts };
}
