import { useEffect, useMemo, useState } from "react";

export function useCatalog(products) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    setVisibleCount(8);
  }, [activeFilter]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === "all") {
      return products;
    }

    return products.filter((product) => product.category === activeFilter);
  }, [activeFilter, products]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount],
  );

  return {
    activeFilter,
    filteredProducts,
    setActiveFilter,
    setVisibleCount,
    visibleCount,
    visibleProducts,
  };
}
