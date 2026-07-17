import { catalogProducts } from "../data/catalogProducts";
import { SUPABASE_STORAGE_BUCKET, supabase } from "./supabase";
import { buildCartItem, getProductCategories, normalizeText } from "./storefront";

const SETTINGS_KEYS = {
  hiddenCategories: "hidden_categories",
  hiddenSubcategories: "hidden_subcategories",
  savedAttributes: "saved_attributes",
  brands: "product_brands",
  customCategories: "custom_categories",
  showBrandsFilter: "show_brands_filter",
  clients: "site_clients",
  partners: "site_partners",
  blogs: "site_blogs",
  integrationSettings: "integration_settings",
};

export const DEFAULT_COUPONS = [
  { code: "WELCOME10", discountType: "percentage", discount: 10, limitPerCoupon: null, limitPerItems: null, limitPerUser: 1, usedCount: 0, userUses: {}, specificProducts: [] },
  { code: "SPORTSWAY20", discountType: "percentage", discount: 20, limitPerCoupon: null, limitPerItems: null, limitPerUser: 1, usedCount: 0, userUses: {}, specificProducts: [] },
  { code: "OFFER50", discountType: "percentage", discount: 50, limitPerCoupon: 5, limitPerItems: 2, limitPerUser: 1, usedCount: 0, userUses: {}, specificProducts: [] },
];

function unwrap(response) {
  if (response.error) {
    throw response.error;
  }
  return response.data;
}

function isMissingProfilesTableError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("public.profiles") && (message.includes("could not find the table") || message.includes("schema cache"));
}

function isMissingProfileColumnError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("profiles") && message.includes("column");
}

function unique(values) {
  return [...new Set(values)];
}

function coerceArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

function mapProductFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || null,
    category: row.category,
    categories: coerceArray(row.categories),
    price: Number(row.price || 0),
    oldPrice: row.old_price == null ? null : Number(row.old_price),
    stockStatus: row.stock_status || "instock",
    stockCount: row.stock_count == null ? null : Number(row.stock_count),
    badge: row.badge || "",
    img: row.img || row.image || row.cover || "",
    image: row.image || row.img || row.cover || "",
    imgHover: row.img_hover || "",
    cover: row.cover || row.img || row.image || "",
    gallery: coerceArray(row.gallery),
    shortDesc: row.short_desc || "",
    description: row.description || "",
    featured: Boolean(row.featured),
    rating: Number(row.rating || 0),
    reviews: Number(row.reviews || 0),
    variations: Array.isArray(row.variations) ? row.variations : [],
    attributes: Array.isArray(row.attributes) ? row.attributes : [],
    brand: row.brand || "",
    dolibarr_ref: row.dolibarr_ref || null,
    dolibarr_id: row.dolibarr_id == null ? null : Number(row.dolibarr_id),
  };
}

function mapProductToRow(product) {
  return {
    id: Number(product.id),
    name: product.name,
    slug: product.slug || null,
    category: product.category,
    categories: unique(product.categories?.length ? product.categories : getProductCategories(product)),
    price: Number(product.price || 0),
    old_price: product.oldPrice == null ? null : Number(product.oldPrice),
    stock_status: product.stockStatus || "instock",
    stock_count: product.stockCount == null || product.stockCount === "" ? null : Number(product.stockCount),
    badge: product.badge || "",
    img: product.img || product.image || product.cover || "",
    image: product.image || product.img || product.cover || "",
    img_hover: product.imgHover || "",
    cover: product.cover || product.img || product.image || "",
    gallery: coerceArray(product.gallery),
    short_desc: product.shortDesc || "",
    description: product.description || "",
    featured: Boolean(product.featured),
    rating: Number(product.rating || 0),
    reviews: Number(product.reviews || 0),
    brand: product.brand || "",
    variations: Array.isArray(product.variations) ? product.variations : [],
    attributes: Array.isArray(product.attributes) ? product.attributes : [],
    dolibarr_ref: product.dolibarr_ref || null,
    dolibarr_id: product.dolibarr_id == null ? null : Number(product.dolibarr_id),
  };
}

function mapProfile(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email || "",
    name: row.name || "",
    phone: row.phone || "",
    billing_address: row.billing_address || "",
    shipping_address: row.shipping_address || "",
    role: row.role || "customer",
    terms_accepted: Boolean(row.terms_accepted),
    marketing_opt_in: Boolean(row.marketing_opt_in),
    created_at: row.created_at || null,
    last_login: row.last_login || null,
  };
}

function sanitizeProfilePayload(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function mapCartRow(row) {
  return {
    cartId: row.cart_id,
    id: row.product_id,
    productId: row.product_id,
    name: row.name,
    price: Number(row.price || 0),
    image: row.image || "",
    img: row.image || "",
    qty: Number(row.qty || 0),
    category: row.category || "",
    categories: coerceArray(row.categories),
    variation: row.variation || null,
  };
}

function mapCartItemToRow(userId, item) {
  return {
    user_id: userId,
    cart_id: item.cartId,
    product_id: Number(item.productId || item.id),
    name: item.name,
    price: Number(item.price || 0),
    image: item.image || item.img || "",
    qty: Number(item.qty || 0),
    category: item.category || "",
    categories: coerceArray(item.categories),
    variation: item.variation || null,
  };
}

function mapCouponFromRow(row) {
  return {
    code: row.code,
    discountType: row.discount_type || "percentage",
    discount: Number(row.discount || 0),
    limitPerCoupon: row.limit_per_coupon == null ? null : Number(row.limit_per_coupon),
    limitPerItems: row.limit_per_items == null ? null : Number(row.limit_per_items),
    limitPerUser: row.limit_per_user == null ? null : Number(row.limit_per_user),
    specificProducts: coerceArray(row.specific_products),
    usedCount: Number(row.used_count || 0),
    userUses: row.user_uses && typeof row.user_uses === "object" ? row.user_uses : {},
    active: row.active !== false,
  };
}

function mapCouponToRow(coupon) {
  return {
    code: String(coupon.code || "").toUpperCase(),
    discount_type: coupon.discountType || "percentage",
    discount: Number(coupon.discount || 0),
    limit_per_coupon: coupon.limitPerCoupon == null || coupon.limitPerCoupon === "" ? null : Number(coupon.limitPerCoupon),
    limit_per_items: coupon.limitPerItems == null || coupon.limitPerItems === "" ? null : Number(coupon.limitPerItems),
    limit_per_user: coupon.limitPerUser == null || coupon.limitPerUser === "" ? null : Number(coupon.limitPerUser),
    specific_products: coerceArray(coupon.specificProducts).map((item) => normalizeText(item)).filter(Boolean),
    used_count: Number(coupon.usedCount || 0),
    user_uses: coupon.userUses && typeof coupon.userUses === "object" ? coupon.userUses : {},
    active: coupon.active !== false,
  };
}

function mapOrderFromRow(row) {
  return {
    id: row.order_id,
    order_id: row.order_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    customer_name: row.customer_name || "",
    company: row.company || "",
    email: row.email || "",
    phone: row.phone || "",
    user_id: row.user_id || null,
    total: Number(row.total || 0),
    subtotal: Number(row.subtotal || 0),
    shipping: Number(row.shipping || 0),
    discount: Number(row.discount || 0),
    coupon_code: row.coupon_code || null,
    payment_method: row.payment_method || "",
    payment_reference: row.payment_reference || "",
    status: row.status || "Processing",
    notes: row.notes || "",
    address: row.address || "",
    billing_details: row.billing_details || null,
    items: Array.isArray(row.items) ? row.items : [],
    dolibarr_order_id: row.dolibarr_order_id || null,
    dolibarr_invoice_id: row.dolibarr_invoice_id || null,
    seen: Boolean(row.seen),
  };
}

export async function ensureSupabaseSession() {
  const existing = unwrap(await supabase.auth.getSession())?.session || null;
  if (existing) {
    return existing;
  }

  try {
    const data = unwrap(await supabase.auth.signInAnonymously());
    return data.session || null;
  } catch {
    return null;
  }
}

export async function fetchProfileById(id) {
  if (!id) {
    return null;
  }

  try {
    const data = unwrap(await supabase.from("profiles").select("*").eq("id", id).maybeSingle());
    return mapProfile(data);
  } catch (error) {
    if (isMissingProfilesTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function ensureProfile(authUser, patch = {}) {
  if (!authUser || authUser.is_anonymous) {
    return null;
  }

  const existing = await fetchProfileById(authUser.id);
  const payload = sanitizeProfilePayload({
    id: authUser.id,
    email: patch.email || authUser.email || existing?.email || "",
    name: patch.name || authUser.user_metadata?.name || existing?.name || "",
    phone: patch.phone || authUser.user_metadata?.phone || existing?.phone || "",
    billing_address: patch.billing_address ?? existing?.billing_address ?? "",
    shipping_address: patch.shipping_address ?? existing?.shipping_address ?? "",
    role: patch.role || existing?.role || "customer",
    terms_accepted: patch.terms_accepted ?? existing?.terms_accepted ?? Boolean(authUser.user_metadata?.terms_accepted),
    marketing_opt_in: patch.marketing_opt_in ?? existing?.marketing_opt_in ?? Boolean(authUser.user_metadata?.marketing_opt_in),
    last_login: new Date().toISOString(),
  });

  if (!existing) {
    payload.created_at = new Date().toISOString();
  }

  try {
    unwrap(await supabase.from("profiles").upsert(payload, { onConflict: "id" }));
    return fetchProfileById(authUser.id);
  } catch (error) {
    if (isMissingProfileColumnError(error)) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.terms_accepted;
      delete fallbackPayload.marketing_opt_in;
      unwrap(await supabase.from("profiles").upsert(fallbackPayload, { onConflict: "id" }));
      return fetchProfileById(authUser.id) || mapProfile(payload);
    }
    if (isMissingProfilesTableError(error)) {
      return mapProfile(payload);
    }
    throw error;
  }
}

export async function updateProfile(profileId, patch, authPatch = null) {
  if (authPatch) {
    const { error } = await supabase.auth.updateUser(authPatch);
    if (error) {
      throw error;
    }
  }

  try {
    unwrap(await supabase.from("profiles").update(patch).eq("id", profileId));
    return fetchProfileById(profileId);
  } catch (error) {
    if (isMissingProfileColumnError(error)) {
      const fallbackPatch = { ...patch };
      delete fallbackPatch.terms_accepted;
      delete fallbackPatch.marketing_opt_in;
      unwrap(await supabase.from("profiles").update(fallbackPatch).eq("id", profileId));
      return fetchProfileById(profileId);
    }
    if (isMissingProfilesTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function listProfiles() {
  try {
    const rows = unwrap(await supabase.from("profiles").select("*").order("created_at", { ascending: false }));
    return rows.map(mapProfile);
  } catch (error) {
    if (isMissingProfilesTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function generateAndUploadSitemap(products) {
  const baseUrl = "https://www.sports-way.com";
  const staticRoutes = [
    "",
    "/about",
    "/blog",
    "/contact",
    "/wholesale",
    "/categories/gym-equipment",
    "/categories/sports-tools",
    "/categories/sportswear",
    "/categories/footwear",
    "/categories/supplements",
    "/categories/flooring",
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes.map((route) => `  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>${route === "" ? "1.0" : "0.8"}</priority>
  </url>`).join("\n")}
${products.map((product) => `  <url>
    <loc>${baseUrl}/products/${product.slug || product.id}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join("\n")}
</urlset>`;

  const blob = new Blob([sitemap], { type: "application/xml" });
  await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload("sitemap.xml", blob, {
    contentType: "application/xml",
    upsert: true,
  });
}

export async function fetchProducts() {
  const rows = unwrap(await supabase.from("products").select("*").order("id", { ascending: true }));
  return rows.map(mapProductFromRow);
}

export async function upsertProducts(products) {
  const payload = products.map(mapProductToRow);
  const response = await supabase.from("products").upsert(payload, { onConflict: "id" }).select("id");
  
  if (response.error) {
    throw new Error(response.error.message || JSON.stringify(response.error));
  }
  
  // If RLS silently blocks the update (0 rows affected), data will be empty or missing rows
  if (!response.data || response.data.length < payload.length) {
    throw new Error("Update blocked by Database Security (RLS). You are not logged in as an authenticated admin!");
  }

  const nextProducts = await fetchProducts();
  
  // Auto-generate and upload sitemap when products change
  try {
    await generateAndUploadSitemap(nextProducts);
  } catch (e) {
    console.error("Failed to generate sitemap", e);
  }
  
  return nextProducts;
}

export async function fetchSetting(key, fallback) {
  const row = unwrap(await supabase.from("site_settings").select("value").eq("key", key).maybeSingle());
  return row?.value ?? fallback;
}

export async function saveSetting(key, value) {
  const response = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" }).select("key");
  
  if (response.error) {
    throw new Error(response.error.message || JSON.stringify(response.error));
  }
  
  if (!response.data || response.data.length === 0) {
    throw new Error("Setting save blocked by Database Security (RLS). You are not logged in as an authenticated admin!");
  }
  
  return value;
}

export async function fetchVisibilitySettings() {
  const [hiddenCategories, hiddenSubcategories, showBrandsFilter, brands] = await Promise.all([
    fetchSetting(SETTINGS_KEYS.hiddenCategories, []),
    fetchSetting(SETTINGS_KEYS.hiddenSubcategories, []),
    fetchSetting(SETTINGS_KEYS.showBrandsFilter, true),
    fetchSetting(SETTINGS_KEYS.brands, []),
  ]);

  return {
    hiddenCategories: Array.isArray(hiddenCategories) ? hiddenCategories : [],
    hiddenSubcategories: Array.isArray(hiddenSubcategories) ? hiddenSubcategories : [],
    showBrandsFilter: Boolean(showBrandsFilter),
    brands: Array.isArray(brands) ? brands : [],
  };
}

export async function saveHiddenCategories(categories) {
  return saveSetting(SETTINGS_KEYS.hiddenCategories, categories);
}

export async function saveHiddenSubcategories(categories) {
  return saveSetting(SETTINGS_KEYS.hiddenSubcategories, categories);
}

export async function saveShowBrandsFilter(show) {
  return saveSetting(SETTINGS_KEYS.showBrandsFilter, Boolean(show));
}

export async function fetchSavedAttributes() {
  const attributes = await fetchSetting(SETTINGS_KEYS.savedAttributes, []);
  return Array.isArray(attributes) ? attributes : [];
}

export async function saveSavedAttributes(attributes) {
  return saveSetting(SETTINGS_KEYS.savedAttributes, attributes);
}

export async function fetchBrands() {
  const brands = await fetchSetting(SETTINGS_KEYS.brands, []);
  return Array.isArray(brands) ? brands : [];
}

export async function saveBrands(brands) {
  return saveSetting(SETTINGS_KEYS.brands, brands);
}

export async function fetchCustomCategories() {
  const cats = await fetchSetting(SETTINGS_KEYS.customCategories, []);
  return Array.isArray(cats) ? cats : [];
}

export async function saveCustomCategories(cats) {
  return saveSetting(SETTINGS_KEYS.customCategories, cats);
}

export async function fetchWishlistIds(userId) {
  if (!userId) {
    return [];
  }

  const rows = unwrap(await supabase.from("wishlist_items").select("product_id").eq("user_id", userId));
  return rows.map((row) => Number(row.product_id));
}

export async function replaceWishlist(userId, ids) {
  if (!userId) {
    return [];
  }

  unwrap(await supabase.from("wishlist_items").delete().eq("user_id", userId));
  const uniqueIds = unique(ids.map((id) => Number(id)).filter(Boolean));
  if (uniqueIds.length) {
    unwrap(await supabase.from("wishlist_items").insert(uniqueIds.map((productId) => ({ user_id: userId, product_id: productId }))));
  }
  return uniqueIds;
}

export async function toggleWishlistId(userId, productId) {
  const current = await fetchWishlistIds(userId);
  const numericId = Number(productId);
  const exists = current.includes(numericId);
  if (exists) {
    unwrap(await supabase.from("wishlist_items").delete().eq("user_id", userId).eq("product_id", numericId));
    return current.filter((id) => id !== numericId);
  }

  unwrap(await supabase.from("wishlist_items").upsert({ user_id: userId, product_id: numericId }, { onConflict: "user_id,product_id" }));
  return [...current, numericId];
}

export async function fetchCartItems(userId) {
  if (!userId) {
    return [];
  }

  const rows = unwrap(await supabase.from("cart_items").select("*").eq("user_id", userId).order("created_at", { ascending: true }));
  return rows.map(mapCartRow);
}

export async function replaceCart(userId, items) {
  if (!userId) {
    return [];
  }

  unwrap(await supabase.from("cart_items").delete().eq("user_id", userId));
  const normalized = items.filter((item) => Number(item.qty || 0) > 0);
  if (normalized.length) {
    unwrap(await supabase.from("cart_items").insert(normalized.map((item) => mapCartItemToRow(userId, item))));
  }
  return normalized;
}

export async function upsertCartItem(userId, item) {
  if (!userId) {
    return null;
  }

  const row = mapCartItemToRow(userId, item);
  unwrap(await supabase.from("cart_items").upsert(row, { onConflict: "user_id,cart_id" }));
  return item;
}

export async function removeCartItem(userId, cartId) {
  if (!userId) {
    return;
  }

  unwrap(await supabase.from("cart_items").delete().eq("user_id", userId).eq("cart_id", cartId));
}

export async function clearCart(userId) {
  if (!userId) {
    return;
  }

  unwrap(await supabase.from("cart_items").delete().eq("user_id", userId));
}

export async function fetchCoupons() {
  const rows = unwrap(await supabase.from("coupons").select("*").order("code", { ascending: true }));
  return rows.map(mapCouponFromRow);
}

export async function fetchCouponByCode(code) {
  if (!code) {
    return null;
  }

  const row = unwrap(await supabase.from("coupons").select("*").eq("code", String(code).toUpperCase()).eq("active", true).maybeSingle());
  return row ? mapCouponFromRow(row) : null;
}

export async function upsertCoupon(coupon) {
  unwrap(await supabase.from("coupons").upsert(mapCouponToRow(coupon), { onConflict: "code" }));
  return fetchCoupons();
}

export async function deleteCoupon(code) {
  unwrap(await supabase.from("coupons").delete().eq("code", String(code).toUpperCase()));
  return fetchCoupons();
}

// Atomic read-check-increment via a Postgres function (see migration 003) —
// a plain "read used_count, add 1, write it back" update would let two
// concurrent checkouts both read the same count and both succeed past the
// coupon's usage limit. Returns the updated coupon row, or null if the
// coupon was no longer valid by the time this ran (limit hit concurrently,
// deactivated, etc.) — the caller must handle that case.
export async function recordCouponUsage(coupon, userIdentifier) {
  if (!coupon) {
    return null;
  }

  const { data, error } = await supabase.rpc("increment_coupon_usage", {
    p_code: String(coupon.code).toUpperCase(),
    p_user_key: userIdentifier || null,
  });
  if (error) {
    throw error;
  }
  return data ? mapCouponFromRow(data) : null;
}

export async function fetchOrdersForUser(userId) {
  if (!userId) {
    return [];
  }

  const rows = unwrap(await supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }));
  return rows.map(mapOrderFromRow);
}

export async function fetchAllOrders() {
  const rows = unwrap(await supabase.from("orders").select("*").order("created_at", { ascending: false }));
  return rows.map(mapOrderFromRow);
}

export async function fetchOrderByOrderId(orderId) {
  if (!orderId) {
    return null;
  }

  const row = unwrap(await supabase.from("orders").select("*").eq("order_id", orderId).maybeSingle());
  return row ? mapOrderFromRow(row) : null;
}

// Atomic per-month sequence (see migration 005) — returns 1, 2, 3, ... for
// the given "YYMM" key. Used to build human-friendly order IDs like
// SWWO-260700001 instead of the old time+random string.
export async function getNextOrderNumber(yearMonth) {
  const { data, error } = await supabase.rpc("next_order_number", { p_yearmonth: yearMonth });
  if (error) {
    throw error;
  }
  return data;
}

// Order IDs are generated client-side (see generateOrderId in CheckoutPage)
// and `order_id` is UNIQUE at the DB level, so a collision surfaces here as
// Postgres error code 23505 — callers should catch that and retry with a
// freshly generated ID rather than treating it as a hard failure.
export async function createOrder(order) {
  const payload = {
    order_id: order.id,
    customer_name: order.customer_name,
    company: order.company || "",
    email: order.email,
    phone: order.phone,
    user_id: order.user_id || null,
    total: Number(order.total || 0),
    subtotal: Number(order.subtotal || 0),
    shipping: Number(order.shipping || 0),
    discount: Number(order.discount || 0),
    coupon_code: order.coupon_code || null,
    payment_method: order.payment_method,
    payment_reference: order.payment_reference || "",
    status: order.status || "Processing",
    notes: order.notes || "",
    address: order.address || "",
    billing_details: order.billing_details || null,
    items: Array.isArray(order.items) ? order.items : [],
  };

  const { error } = await supabase.from("orders").insert(payload);
  if (error) {
    throw error;
  }
  return fetchOrderByOrderId(order.id);
}

// Real (non-spoofable) check for the first-order discount, replacing a
// localStorage flag that anyone could set via devtools. Still client-side —
// enforced by whatever RLS policy the orders table has — but at least it's
// checked against actual order history instead of trusting the browser.
export async function hasCustomerOrderedBefore(email) {
  if (!email) {
    return false;
  }
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("email", String(email).trim().toLowerCase());
  if (error) {
    console.error("hasCustomerOrderedBefore failed:", error.message);
    return false;
  }
  return (count || 0) > 0;
}

// Lightweight targeted update — unlike upsertProducts, this only touches the
// stock columns, so it's safe to call with just { id, stockStatus, stockCount }
// without risking clobbering the rest of the product row.
export async function syncProductStock(updates) {
  await Promise.all(
    updates.map(({ id, stockStatus, stockCount }) =>
      supabase.from("products").update({ stock_status: stockStatus, stock_count: stockCount }).eq("id", id)
    )
  );
}

export async function deleteOrder(orderId) {
  // .delete() alone returns no data and no error even when RLS silently
  // blocks it (0 rows matched) — chaining .select() forces Postgres to
  // return the rows it actually deleted, so a blocked delete is detectable.
  const deletedRows = unwrap(await supabase.from("orders").delete().eq("order_id", orderId).select("order_id"));
  if (!deletedRows || deletedRows.length === 0) {
    throw new Error("Delete blocked by Database Security (RLS). You are not logged in as an authenticated admin!");
  }
  return fetchAllOrders();
}

export async function updateOrderStatus(orderId, status) {
  unwrap(await supabase.from("orders").update({ status }).eq("order_id", orderId));
  return fetchOrderByOrderId(orderId);
}

// Persists that an admin has actually opened this specific order — the
// durable, per-order fact the "new order" badge/highlight/sound are now
// based on (see migration 013), replacing the old in-memory Set + blanket
// last-viewed timestamp that reset on every page reload.
export async function markOrderSeen(orderId) {
  unwrap(await supabase.from("orders").update({ seen: true }).eq("order_id", orderId));
}

export function generateSeoPrefix(product) {
  if (!product) return "";
  const parts = [
    product.name,
    product.brand,
    (product.categories?.[0] || product.category),
    "qatar"
  ];
  return parts.filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-";
}

export async function uploadBlobToStorage(blob, fileExt = "webp", folder = "products", prefix = "") {
  let sanitizedPrefix = prefix ? prefix.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : "image";
  if (!prefix) sanitizedPrefix += "-" + Date.now();
  
  // To prevent gallery images from overwriting the main image, append a small random string if it's a gallery
  if (folder.includes("gallery") || folder.includes("variations")) {
    sanitizedPrefix += "-" + Math.random().toString(36).slice(2, 6);
  }

  const objectPath = `${folder}/${sanitizedPrefix}.${fileExt}`;
  unwrap(await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(objectPath, blob, {
    contentType: blob.type,
    upsert: true,
  }));
  const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

export async function renameStorageObject(oldUrl, fileExt = "webp", folder = "products", prefix = "") {
  if (!oldUrl || !oldUrl.includes("/storage/v1/object/public/")) return null;
  const parts = oldUrl.split("/storage/v1/object/public/" + SUPABASE_STORAGE_BUCKET + "/");
  if (parts.length !== 2) return null;
  const oldPath = parts[1];
  
  let sanitizedPrefix = prefix ? prefix.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : "image";
  if (!prefix) sanitizedPrefix += "-" + Date.now();

  if (folder.includes("gallery") || folder.includes("variations")) {
    sanitizedPrefix += "-" + Math.random().toString(36).slice(2, 6);
  }
  
  const newPath = `${folder}/${sanitizedPrefix}.${fileExt}`;

  // Bulk SEO Rename fires many of these copy calls back-to-back, and a
  // transient blip (dropped connection, brief rate-limit) surfaces as a raw
  // "NetworkError when attempting to fetch resource" — not a real reason to
  // give up on that one image, so retry a couple of times with backoff
  // before treating it as an actual failure.
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
    const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).copy(oldPath, newPath);
    // "Resource already exists" means the destination file is already there
    // (e.g. a previous run already renamed it, or two fields on the same
    // product pointed at the same source image) — that's the desired end
    // state already, not a real failure.
    if (!error || /already exists/i.test(error.message || "")) {
      lastError = null;
      break;
    }
    lastError = error;
    if (!/network ?error/i.test(error.message || "")) {
      break; // not a transient network issue — no point retrying
    }
  }
  if (lastError) {
    throw new Error(lastError.message || JSON.stringify(lastError));
  }
  const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(newPath);
  return data.publicUrl;
}

// Deletes the actual file from Storage for a public URL previously returned
// by uploadBlobToStorage — used whenever the DB row referencing it (a
// product, client logo, partner logo, or blog post) is deleted, so the
// bucket doesn't accumulate orphaned files forever. Silently no-ops for
// anything that isn't one of our own storage URLs (external/placeholder
// images), and never throws — a failed cleanup shouldn't block the actual
// delete the admin asked for.
export async function deleteStorageObject(url) {
  if (!url || typeof url !== "string" || !url.includes("/storage/v1/object/public/" + SUPABASE_STORAGE_BUCKET + "/")) {
    return;
  }
  const parts = url.split("/storage/v1/object/public/" + SUPABASE_STORAGE_BUCKET + "/");
  if (parts.length !== 2 || !parts[1]) return;
  try {
    await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([parts[1]]);
  } catch (error) {
    console.error("Failed to delete storage object:", parts[1], error);
  }
}

export async function deleteStorageObjects(urls) {
  const unique = [...new Set((urls || []).filter(Boolean))];
  await Promise.all(unique.map(deleteStorageObject));
}

export function buildOrderCartItem(product, qty = 1, variation = null) {
  return buildCartItem(product, qty, variation);
}

export function getInitialProductSeedRows() {
  return catalogProducts.map(mapProductToRow);
}

export async function deleteProductRecord(id) {
  const response = await supabase.from("products").delete().eq("id", id);
  if (response.error) {
    throw new Error(response.error.message || JSON.stringify(response.error));
  }
  return fetchProducts();
}

export async function linkProductToDolibarr(id, dolibarrId, dolibarrRef) {
  const response = await supabase
    .from("products")
    .update({ dolibarr_id: dolibarrId, dolibarr_ref: dolibarrRef })
    .eq("id", id);
  if (response.error) {
    throw new Error(response.error.message || JSON.stringify(response.error));
  }
}

export async function fetchClients() {
  const data = await fetchSetting(SETTINGS_KEYS.clients, []);
  return Array.isArray(data) ? data : [];
}

export async function saveClients(data) {
  return saveSetting(SETTINGS_KEYS.clients, data);
}

export async function fetchPartners() {
  const data = await fetchSetting(SETTINGS_KEYS.partners, []);
  return Array.isArray(data) ? data : [];
}

export async function savePartners(data) {
  return saveSetting(SETTINGS_KEYS.partners, data);
}

export async function fetchBlogs() {
  const data = await fetchSetting(SETTINGS_KEYS.blogs, []);
  return Array.isArray(data) ? data : [];
}

export async function saveBlogs(data) {
  return saveSetting(SETTINGS_KEYS.blogs, data);
}

const DEFAULT_INTEGRATION_SETTINGS = {
  fastapiUrl: "",
  dolibarrApiUrl: "",
  dolibarrApiKey: "",
  dolibarrSyncSecret: "",
};

export async function fetchIntegrationSettings() {
  const data = await fetchSetting(SETTINGS_KEYS.integrationSettings, DEFAULT_INTEGRATION_SETTINGS);
  return { ...DEFAULT_INTEGRATION_SETTINGS, ...(data || {}) };
}

export async function saveIntegrationSettings(data) {
  return saveSetting(SETTINGS_KEYS.integrationSettings, data);
}
