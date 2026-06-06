import { useMemo, useState } from "react";

export function useSearch(products, pageLinks) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) {
      return [];
    }

    const productMatches = products
      .filter((product) => {
        const categories = (product.categories || [product.category]).join(" ").toLowerCase();
        return product.name.toLowerCase().includes(query) || categories.includes(query);
      })
      .slice(0, 6)
      .map((product) => ({
        type: "product",
        href: `product.html?id=${product.id}`,
        label: product.name,
        sublabel: product.category,
        image: product.image || product.img,
      }));

    const pageMatches = pageLinks
      .filter((page) => page.label.toLowerCase().includes(query))
      .slice(0, 4)
      .map((page) => ({
        type: "page",
        href: page.href,
        label: page.label,
        sublabel: "Page",
      }));

    return [...productMatches, ...pageMatches];
  }, [pageLinks, products, searchQuery]);

  return {
    searchOpen,
    searchQuery,
    searchSuggestions,
    setSearchOpen,
    setSearchQuery,
  };
}
