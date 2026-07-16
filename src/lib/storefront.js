export const STORAGE_KEYS = {};

export function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function getProductCategories(product) {
  return [...new Set(
    [product.category, ...(product.categories || [])]
      .filter(Boolean)
      .map((value) => normalizeText(value)),
  )];
}

export function isOutOfStock(product) {
  const badge = normalizeText(product.badge);
  return product.stockStatus === "outofstock" || badge === "sold out" || badge === "out of stock";
}

const BADGE_PRIORITY = {
  trending: 1,
  clearance: 2,
  "best seller": 3,
  "top rated": 4,
  popular: 5,
  sale: 6,
  offer: 7,
  new: 8,
  premium: 9,
};

export function sortByPriority(list) {
  return [...list].sort((left, right) => {
    const leftRank = isOutOfStock(left) ? 99 : BADGE_PRIORITY[normalizeText(left.badge)] || 50;
    const rightRank = isOutOfStock(right) ? 99 : BADGE_PRIORITY[normalizeText(right.badge)] || 50;
    return leftRank - rightRank;
  });
}

export function matchProduct(product, filter) {
  const categories = getProductCategories(product);

  if (filter.matchAll?.length) {
    return filter.matchAll.every((token) => categories.includes(normalizeText(token)));
  }

  if (filter.matchAny?.length) {
    return filter.matchAny.some((token) => categories.includes(normalizeText(token)));
  }

  return true;
}

export function buildCartItem(product, qty = 1, variation = null) {
  const variationSuffix = variation?.label || variation?.options
    ? JSON.stringify(variation.label || variation.options)
    : "";
  const cartId = variationSuffix ? `${product.id}-${variationSuffix}` : String(product.id);
  const image = variation?.img || variation?.image || product.img || product.image || product.cover || "";

  return {
    cartId,
    id: product.id,
    productId: product.id,
    // Carried through into the order's items JSON so a placed order records
    // exactly which website product and which Dolibarr product it came from
    // — needed to later link the order back to Dolibarr for fulfillment.
    dolibarrId: product.dolibarr_id || null,
    dolibarrRef: product.dolibarr_ref || null,
    name: variation?.label ? `${product.name} - ${variation.label}` : product.name,
    price: variation?.price || product.price,
    image,
    img: image,
    qty,
    category: product.category,
    categories: product.categories || [],
    variation: variation || null,
  };
}
