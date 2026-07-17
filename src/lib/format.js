export function formatPrice(value) {
  return `QAR ${value.toLocaleString()}`;
}

// Shared SEO-default logic — used by the public product page, the admin
// edit form's placeholders, and the bulk CSV export. No separate meta
// title/description columns are stored — these are always derived live
// from the product's own name/short description/description.
export function effectiveMetaTitle(product) {
  return product?.name || "";
}

export function effectiveMetaDescription(product) {
  if (!product) return "";
  if (product.shortDesc?.trim()) return product.shortDesc.trim();
  if (product.description?.trim()) return product.description.trim();
  return "";
}
