import { useEffect, useState } from "react";
import { fetchVisibilitySettings } from "../lib/storefrontApi";

export function useVisibilitySettings() {
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [hiddenSubcategories, setHiddenSubcategories] = useState([]);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      const nextSettings = await fetchVisibilitySettings();
      if (!active) {
        return;
      }

      setHiddenCategories(nextSettings.hiddenCategories);
      setHiddenSubcategories(nextSettings.hiddenSubcategories);
    };

    refresh();
    return () => {
      active = false;
    };
  }, []);

  return { hiddenCategories, hiddenSubcategories };
}
