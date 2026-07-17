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

// Descriptions are stored/edited as HTML (see the "Full Description"
// textarea), but a meta description must be plain text — strip tags and
// decode the handful of entities that show up in Dolibarr-imported copy.
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function effectiveMetaDescription(product) {
  if (!product) return "";
  if (product.shortDesc?.trim()) return stripHtml(product.shortDesc);
  if (product.description?.trim()) return stripHtml(product.description);
  return "";
}
