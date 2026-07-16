import { useEffect, useState } from "react";
import { fetchVisibilitySettings } from "../lib/storefrontApi";

export function useVisibilitySettings() {
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [hiddenSubcategories, setHiddenSubcategories] = useState([]);
  const [showBrandsFilter, setShowBrandsFilter] = useState(true);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      const nextSettings = await fetchVisibilitySettings();
      if (!active) {
        return;
      }

      setHiddenCategories(nextSettings.hiddenCategories);
      setHiddenSubcategories(nextSettings.hiddenSubcategories);
      setShowBrandsFilter(nextSettings.showBrandsFilter);
      setBrands(nextSettings.brands);
    };

    refresh();
    return () => {
      active = false;
    };
  }, []);

  return { hiddenCategories, hiddenSubcategories, showBrandsFilter, brands };
}
