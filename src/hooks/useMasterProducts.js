import { useEffect, useState } from "react";
import { fetchProducts, upsertProducts } from "../lib/storefrontApi";

export function useMasterProducts() {
  const [products, setProductsState] = useState([]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const nextProducts = await fetchProducts();
        if (active) {
          setProductsState(nextProducts);
        }
      } catch (e) {
        console.error("Failed to fetch products:", e);
      }
    };

    refresh();
    return () => {
      active = false;
    };
  }, []);

  const setProducts = async (nextProducts) => {
    const previousProducts = products;
    setProductsState(nextProducts); // Optimistic update
    try {
      const syncedProducts = await upsertProducts(nextProducts);
      setProductsState(syncedProducts);
      return syncedProducts;
    } catch (e) {
      setProductsState(previousProducts); // Revert on failure
      throw e;
    }
  };

  const deleteProduct = async (id) => {
    const previousProducts = products;
    setProductsState((current) => current.filter((p) => p.id !== id)); // Optimistic delete
    try {
      const { deleteProductRecord } = await import("../lib/storefrontApi");
      const syncedProducts = await deleteProductRecord(id);
      setProductsState(syncedProducts);
      return syncedProducts;
    } catch (e) {
      setProductsState(previousProducts); // Revert on failure
      throw e;
    }
  };

  return { products, setProducts, deleteProduct };
}
