import { useEffect, useMemo, useState } from "react";
import { getLiveStock } from "../lib/fastapiClient";

// Overlays a product with a fresh Dolibarr stock check. Falls back to the
// product's cached Supabase stock (stockStatus/stockCount) until the live
// check resolves, and silently keeps the cached values if it fails.
export function useLiveStock(product) {
  const [live, setLive] = useState(null);

  useEffect(() => {
    setLive(null);
    if (!product?.dolibarr_id) return;

    let active = true;
    // Variations don't have their own Supabase row id, so there's nothing
    // meaningful to pass here — the backend only echoes it back, it never
    // uses it to look anything up. 0 is a safe placeholder.
    getLiveStock(product.id ?? 0, product.dolibarr_id)
      .then((result) => {
        if (active) setLive(result);
      })
      .catch((e) => {
        console.error("Live stock check failed:", e);
      });

    return () => {
      active = false;
    };
  }, [product?.id, product?.dolibarr_id]);

  return useMemo(() => {
    if (!live) return product;
    return {
      ...product,
      stockStatus: live.stock_status,
      stockCount: live.stock_count,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, live?.stock_status, live?.stock_count]);
}
