import { catalogProducts } from "../data/catalogProducts";
import { SUPABASE_STORAGE_BUCKET, supabase } from "./supabase";
import { buildCartItem, getProductCategories, normalizeText } from "./storefront";

const SETTINGS_KEYS = {
  hiddenCategories: "hidden_categories",
  hiddenSubcategories: "hidden_subcategories",
  savedAttributes: "saved_attributes",
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
  };
}

function mapProductToRow(product) {
  return {
    id: Number(product.id),
    name: product.name,
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
    variations: Array.isArray(product.variations) ? product.variations : [],
    attributes: Array.isArray(product.attributes) ? product.attributes : [],
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
    created_at: row.created_at || null,
    last_login: row.last_login || null,
  };
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
    email: row.email || "",
    phone: row.phone || "",
    user_id: row.user_id || null,
    total: Number(row.total || 0),
    subtotal: Number(row.subtotal || 0),
    shipping: Number(row.shipping || 0),
    discount: Number(row.discount || 0),
    coupon_code: row.coupon_code || null,
    payment_method: row.payment_method || "",
    status: row.status || "Processing",
    notes: row.notes || "",
    items: Array.isArray(row.items) ? row.items : [],
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

  const data = unwrap(await supabase.from("profiles").select("*").eq("id", id).maybeSingle());
  return mapProfile(data);
}

export async function ensureProfile(authUser, patch = {}) {
  if (!authUser || authUser.is_anonymous) {
    return null;
  }

  const existing = await fetchProfileById(authUser.id);
  const payload = {
    id: authUser.id,
    email: patch.email || authUser.email || existing?.email || "",
    name: patch.name || authUser.user_metadata?.name || existing?.name || "",
    phone: patch.phone || authUser.user_metadata?.phone || existing?.phone || "",
    billing_address: patch.billing_address ?? existing?.billing_address ?? "",
    shipping_address: patch.shipping_address ?? existing?.shipping_address ?? "",
    role: patch.role || existing?.role || "customer",
    last_login: new Date().toISOString(),
  };

  if (!existing) {
    payload.created_at = new Date().toISOString();
  }

  unwrap(await supabase.from("profiles").upsert(payload, { onConflict: "id" }));
  return fetchProfileById(authUser.id);
}

export async function updateProfile(profileId, patch, authPatch = null) {
  if (authPatch) {
    const { error } = await supabase.auth.updateUser(authPatch);
    if (error) {
      throw error;
    }
  }

  unwrap(await supabase.from("profiles").update(patch).eq("id", profileId));
  return fetchProfileById(profileId);
}

export async function listProfiles() {
  const rows = unwrap(await supabase.from("profiles").select("*").order("created_at", { ascending: false }));
  return rows.map(mapProfile);
}

export async function fetchProducts() {
  const rows = unwrap(await supabase.from("products").select("*").order("id", { ascending: true }));
  return rows.map(mapProductFromRow);
}

export async function upsertProducts(products) {
  const payload = products.map(mapProductToRow);
  unwrap(await supabase.from("products").upsert(payload, { onConflict: "id" }));
  return fetchProducts();
}

export async function fetchSetting(key, fallback) {
  const row = unwrap(await supabase.from("site_settings").select("value").eq("key", key).maybeSingle());
  return row?.value ?? fallback;
}

export async function saveSetting(key, value) {
  unwrap(await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" }));
  return value;
}

export async function fetchVisibilitySettings() {
  const [hiddenCategories, hiddenSubcategories] = await Promise.all([
    fetchSetting(SETTINGS_KEYS.hiddenCategories, []),
    fetchSetting(SETTINGS_KEYS.hiddenSubcategories, []),
  ]);

  return {
    hiddenCategories: Array.isArray(hiddenCategories) ? hiddenCategories : [],
    hiddenSubcategories: Array.isArray(hiddenSubcategories) ? hiddenSubcategories : [],
  };
}

export async function saveHiddenCategories(categories) {
  return saveSetting(SETTINGS_KEYS.hiddenCategories, categories);
}

export async function saveHiddenSubcategories(categories) {
  return saveSetting(SETTINGS_KEYS.hiddenSubcategories, categories);
}

export async function fetchSavedAttributes() {
  const attributes = await fetchSetting(SETTINGS_KEYS.savedAttributes, []);
  return Array.isArray(attributes) ? attributes : [];
}

export async function saveSavedAttributes(attributes) {
  return saveSetting(SETTINGS_KEYS.savedAttributes, attributes);
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

export async function recordCouponUsage(coupon, userIdentifier) {
  if (!coupon) {
    return;
  }

  const userUses = coupon.userUses && typeof coupon.userUses === "object" ? { ...coupon.userUses } : {};
  if (userIdentifier) {
    userUses[userIdentifier] = Number(userUses[userIdentifier] || 0) + 1;
  }

  unwrap(await supabase.from("coupons").update({
    used_count: Number(coupon.usedCount || 0) + 1,
    user_uses: userUses,
  }).eq("code", String(coupon.code).toUpperCase()));
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

export async function createOrder(order) {
  const payload = {
    order_id: order.id,
    customer_name: order.customer_name,
    email: order.email,
    phone: order.phone,
    user_id: order.user_id || null,
    total: Number(order.total || 0),
    subtotal: Number(order.subtotal || 0),
    shipping: Number(order.shipping || 0),
    discount: Number(order.discount || 0),
    coupon_code: order.coupon_code || null,
    payment_method: order.payment_method,
    status: order.status || "Processing",
    notes: order.notes || "",
    items: Array.isArray(order.items) ? order.items : [],
  };

  unwrap(await supabase.from("orders").insert(payload));
  return fetchOrderByOrderId(order.id);
}

export async function updateOrderStatus(orderId, status) {
  unwrap(await supabase.from("orders").update({ status }).eq("order_id", orderId));
  return fetchOrderByOrderId(orderId);
}

export async function uploadBlobToStorage(blob, fileExt = "webp", folder = "products") {
  const objectPath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  unwrap(await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(objectPath, blob, {
    contentType: blob.type,
    upsert: true,
  }));
  const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

export function buildOrderCartItem(product, qty = 1, variation = null) {
  return buildCartItem(product, qty, variation);
}

export function getInitialProductSeedRows() {
  return catalogProducts.map(mapProductToRow);
}
