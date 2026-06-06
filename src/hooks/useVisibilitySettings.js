import { useEffect, useState } from "react";
import { getHiddenCategories, getHiddenSubcategories } from "../lib/storefront";

export function useVisibilitySettings() {
  const [hiddenCategories, setHiddenCategories] = useState(() => getHiddenCategories());
  const [hiddenSubcategories, setHiddenSubcategories] = useState(() => getHiddenSubcategories());

  useEffect(() => {
    const refresh = () => {
      setHiddenCategories(getHiddenCategories());
      setHiddenSubcategories(getHiddenSubcategories());
    };

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("hidden_categories", refresh);
    window.addEventListener("hidden_subcategories", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("hidden_categories", refresh);
      window.removeEventListener("hidden_subcategories", refresh);
    };
  }, []);

  return { hiddenCategories, hiddenSubcategories };
}
