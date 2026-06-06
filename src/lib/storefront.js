import { catalogProducts } from "../data/catalogProducts";

export const STORAGE_KEYS = {
  adminAuth: "sportsway_admin_authed_v1",
  adminPasswordOverride: "sw_admin_pass_override",
  cart: "sw_cart",
  coupons: "sw_coupons",
  users: "sw_users",
  currentUser: "sw_current_user",
  orders: "sw_orders",
  latestOrder: "sw_latest_order",
  wishlist: "sw_wishlist",
  hiddenCategories: "hidden_categories",
  hiddenSubcategories: "hidden_subcategories",
  savedAttributes: "sportsway_saved_attributes",
  masterProducts: "sportsway_master_products",
};

export function getStoredJson(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setStoredJson(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function unique(values) {
  return [...new Set(values)];
}

export function getProductCategories(product) {
  return unique(
    [product.category, ...(product.categories || [])]
      .filter(Boolean)
      .map((value) => normalizeText(value)),
  );
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

export function getMasterProducts() {
  const stored = getStoredJson(STORAGE_KEYS.masterProducts, []);
  return stored.length ? stored : catalogProducts;
}

export function saveMasterProducts(products) {
  setStoredJson(STORAGE_KEYS.masterProducts, products);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORAGE_KEYS.masterProducts));
    window.dispatchEvent(new CustomEvent("productsUpdated", { detail: products }));
  }
}

export function getUsers() {
  return getStoredJson(STORAGE_KEYS.users, []);
}

export function saveUsers(users) {
  setStoredJson(STORAGE_KEYS.users, users);
}

export function getCurrentUser() {
  const localUser = getStoredJson(STORAGE_KEYS.currentUser, null);
  if (localUser) {
    return localUser;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const sessionUser = window.sessionStorage.getItem(STORAGE_KEYS.currentUser);
    return sessionUser ? JSON.parse(sessionUser) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user, remember = true) {
  if (typeof window === "undefined") {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(STORAGE_KEYS.currentUser);
    window.sessionStorage.removeItem(STORAGE_KEYS.currentUser);
    return;
  }

  if (remember) {
    window.localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
    window.sessionStorage.removeItem(STORAGE_KEYS.currentUser);
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.currentUser);
  window.sessionStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

export function getOrders() {
  return getStoredJson(STORAGE_KEYS.orders, []);
}

export function saveOrders(orders) {
  setStoredJson(STORAGE_KEYS.orders, orders);
}

export function getWishlistMap() {
  return getStoredJson(STORAGE_KEYS.wishlist, {});
}

export function saveWishlistMap(map) {
  setStoredJson(STORAGE_KEYS.wishlist, map);
}

export function getCoupons() {
  const existing = getStoredJson(STORAGE_KEYS.coupons, []);
  if (existing.length) {
    return existing;
  }

  const seeded = [
    { code: "WELCOME10", discountType: "percentage", discount: 10, limitPerCoupon: null, limitPerItems: null, limitPerUser: 1, usedCount: 0, userUses: {}, specificProducts: [] },
    { code: "SPORTSWAY20", discountType: "percentage", discount: 20, limitPerCoupon: null, limitPerItems: null, limitPerUser: 1, usedCount: 0, userUses: {}, specificProducts: [] },
    { code: "OFFER50", discountType: "percentage", discount: 50, limitPerCoupon: 5, limitPerItems: 2, limitPerUser: 1, usedCount: 0, userUses: {}, specificProducts: [] },
  ];
  setStoredJson(STORAGE_KEYS.coupons, seeded);
  return seeded;
}

export function saveCoupons(coupons) {
  setStoredJson(STORAGE_KEYS.coupons, coupons);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORAGE_KEYS.coupons));
  }
}

export function getHiddenCategories() {
  return getStoredJson(STORAGE_KEYS.hiddenCategories, []);
}

export function saveHiddenCategories(categories) {
  setStoredJson(STORAGE_KEYS.hiddenCategories, categories);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORAGE_KEYS.hiddenCategories));
  }
}

export function getHiddenSubcategories() {
  return getStoredJson(STORAGE_KEYS.hiddenSubcategories, []);
}

export function saveHiddenSubcategories(categories) {
  setStoredJson(STORAGE_KEYS.hiddenSubcategories, categories);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORAGE_KEYS.hiddenSubcategories));
  }
}

export function getSavedAttributes() {
  return getStoredJson(STORAGE_KEYS.savedAttributes, []);
}

export function saveSavedAttributes(attributes) {
  setStoredJson(STORAGE_KEYS.savedAttributes, attributes);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORAGE_KEYS.savedAttributes));
  }
}

export function getWishlistKey(user) {
  return normalizeText(user?.email) || "__guest__";
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
    name: variation?.label ? `${product.name} - ${variation.label}` : product.name,
    price: variation?.price || product.price,
    image,
    img: image,
    qty,
    category: product.category,
    categories: product.categories || [],
  };
}
