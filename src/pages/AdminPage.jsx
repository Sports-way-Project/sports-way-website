import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_DEFAULTS,
  adminCategoryOptions,
  adminCategoryToggles,
  adminSubcategoryToggles,
  productBadgeOptions,
} from "../data/adminData";
import { formatPrice } from "../lib/format";
import {
  getCoupons,
  getHiddenCategories,
  getHiddenSubcategories,
  getOrders,
  getSavedAttributes,
  getUsers,
  saveCoupons,
  saveHiddenCategories,
  saveHiddenSubcategories,
  saveOrders,
  saveSavedAttributes,
  STORAGE_KEYS,
} from "../lib/storefront";

const ADMIN_PAGE_SIZE = 18;

const initialProductForm = {
  id: "",
  name: "",
  price: "",
  stockStatus: "instock",
  stockCount: "",
  badge: "",
  cover: "",
  hover: "",
  galleryText: "",
  shortDesc: "",
  description: "",
  featured: true,
  categories: [],
};

const initialCouponForm = {
  code: "",
  discountType: "percentage",
  discount: "",
  limitPerCoupon: "",
  limitPerItems: "",
  limitPerUser: "1",
  specificProducts: "",
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(",").map((value) => value.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((value) => value.trim());
    return headers.reduce((record, header, index) => ({ ...record, [header]: cells[index] || "" }), {});
  });
}

function cartesian(arrays) {
  return arrays.reduce(
    (accumulator, current) => accumulator.flatMap((existing) => current.map((value) => [...existing, value])),
    [[]],
  );
}

function dataUrlToBlob(dataUrl) {
  const [header, body] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : "image/webp";
  const binary = window.atob(body);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

async function compressImage(dataUrl, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", quality));
    };
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function uploadBlobToSupabase(blob, fileExt = "webp", folder = "products") {
  if (!window.supabaseClient) {
    throw new Error("Supabase client is not configured.");
  }
  const objectPath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const { error } = await window.supabaseClient.storage
    .from(window.SUPABASE_STORAGE_BUCKET)
    .upload(objectPath, blob, { contentType: blob.type, upsert: true });
  if (error) {
    throw error;
  }
  const { data } = window.supabaseClient.storage.from(window.SUPABASE_STORAGE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function sendOtp(otp) {
  const message = `SportsWay Admin OTP: ${otp}. Valid for 10 minutes. Do not share this code.`;
  try {
    const response = await fetch("https://textbelt.com/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: ADMIN_DEFAULTS.otpPhone, message, key: "textbelt" }),
    });
    const data = await response.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

function getAdminPassword() {
  return window.sessionStorage.getItem(STORAGE_KEYS.adminPasswordOverride) || ADMIN_DEFAULTS.password;
}

export function AdminPage({ products, setProducts }) {
  const [section, setSection] = useState("visibility");
  const [authed, setAuthed] = useState(() => window.sessionStorage.getItem(STORAGE_KEYS.adminAuth) === "1");
  const [loginStep, setLoginStep] = useState("login");
  const [loginForm, setLoginForm] = useState({ user: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [otpInput, setOtpInput] = useState("");
  const [otpMeta, setOtpMeta] = useState({ code: "", expiry: 0 });
  const [resetPassword, setResetPassword] = useState({ next: "", confirm: "" });
  const [search, setSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [couponPage, setCouponPage] = useState(1);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [variations, setVariations] = useState([]);
  const [attributes, setAttributes] = useState(() => getSavedAttributes());
  const [history, setHistory] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState(() => getHiddenCategories());
  const [hiddenSubcategories, setHiddenSubcategories] = useState(() => getHiddenSubcategories());
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState(() => getCoupons());
  const [couponForm, setCouponForm] = useState(initialCouponForm);
  const [toast, setToast] = useState("");

  useEffect(() => {
    document.title = "Admin Dashboard - Sports Way Trading";
  }, []);

  useEffect(() => {
    saveHiddenCategories(hiddenCategories);
  }, [hiddenCategories]);

  useEffect(() => {
    saveHiddenSubcategories(hiddenSubcategories);
  }, [hiddenSubcategories]);

  useEffect(() => {
    saveCoupons(coupons);
  }, [coupons]);

  useEffect(() => {
    const timer = toast ? window.setTimeout(() => setToast(""), 2500) : null;
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [toast]);

  useEffect(() => {
    const syncUsers = () => {
      const nextUsers = getUsers().sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0));
      setUsers(nextUsers);
    };
    syncUsers();
    refreshOrders(syncUsers);
    const interval = window.setInterval(() => refreshOrders(syncUsers), 10000);
    return () => window.clearInterval(interval);
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = [...products].sort((left, right) => right.id - left.id);
    if (!query) {
      return list;
    }

    return list.filter((product) => {
      const categories = (product.categories || [product.category]).join(" ").toLowerCase();
      return String(product.id).includes(query) || String(product.name || "").toLowerCase().includes(query) || categories.includes(query);
    });
  }, [products, search]);

  const pagedProducts = useMemo(() => paginate(filteredProducts, productPage), [filteredProducts, productPage]);
  const pagedOrders = useMemo(() => paginate(orders, orderPage), [orders, orderPage]);
  const pagedUsers = useMemo(() => paginate(users, userPage), [users, userPage]);
  const pagedCoupons = useMemo(() => paginate(coupons, couponPage), [coupons, couponPage]);

  function paginate(items, page) {
    const totalPages = Math.max(1, Math.ceil(items.length / ADMIN_PAGE_SIZE));
    const nextPage = Math.min(Math.max(1, page), totalPages);
    return {
      page: nextPage,
      totalPages,
      items: items.slice((nextPage - 1) * ADMIN_PAGE_SIZE, nextPage * ADMIN_PAGE_SIZE),
      totalItems: items.length,
    };
  }

  async function refreshOrders(syncUsers) {
    let nextOrders = getOrders();
    if (window.supabaseClient && window.location.protocol !== "file:") {
      try {
        const { data } = await window.supabaseClient.from("orders").select("*").order("created_at", { ascending: false });
        if (Array.isArray(data) && data.length) {
          nextOrders = data;
          saveOrders(data);
        }
      } catch {
        // ignore and keep local fallback
      }
    }

    nextOrders = [...nextOrders].sort((left, right) => new Date(right.created_at) - new Date(left.created_at));
    setOrders(nextOrders);
    syncUsers();
  }

  function persistProducts(nextProducts) {
    setHistory((current) => [...current.slice(-9), JSON.stringify(products)]);
    setProducts(nextProducts);
  }

  function resetEditor() {
    setProductForm(initialProductForm);
    setVariations([]);
  }

  async function handleImageFieldChange(field, file) {
    const dataUrl = await readFileAsDataUrl(file);
    setProductForm((current) => ({ ...current, [field]: dataUrl }));
  }

  async function handleGalleryUpload(files) {
    const images = [];
    for (const file of files) {
      images.push(await readFileAsDataUrl(file));
    }
    setProductForm((current) => ({
      ...current,
      galleryText: [...current.galleryText.split("\n").filter(Boolean), ...images].join("\n"),
    }));
  }

  async function handleVariationImageUpload(index, file) {
    const dataUrl = await readFileAsDataUrl(file);
    updateVariation(index, { img: dataUrl });
  }

  function handleAdminLogin(event) {
    event.preventDefault();
    if (loginForm.user.trim().toLowerCase() === ADMIN_DEFAULTS.user.toLowerCase() && loginForm.password === getAdminPassword()) {
      window.sessionStorage.setItem(STORAGE_KEYS.adminAuth, "1");
      setAuthed(true);
      setLoginError("");
      setLoginAttempts(0);
      setLoginStep("login");
      return;
    }

    const attempts = loginAttempts + 1;
    setLoginAttempts(attempts);
    if (attempts >= ADMIN_DEFAULTS.maxAttempts) {
      triggerOtpFlow();
      return;
    }
    setLoginError(`Incorrect username or password. ${ADMIN_DEFAULTS.maxAttempts - attempts} attempts remaining.`);
  }

  async function triggerOtpFlow() {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = Date.now() + 10 * 60 * 1000;
    setOtpMeta({ code, expiry });
    setLoginStep("otp");
    setLoginError("");
    await sendOtp(code);
    window.console.warn(`Admin OTP: ${code}`);
  }

  function verifyOtp() {
    if (!otpMeta.code || Date.now() > otpMeta.expiry) {
      setLoginError("OTP has expired. Please request a new one.");
      return;
    }
    if (otpInput.trim() !== otpMeta.code) {
      setLoginError("Invalid OTP. Please try again.");
      return;
    }
    setLoginStep("reset");
    setLoginError("");
  }

  function applyPasswordReset() {
    if (!resetPassword.next || resetPassword.next.length < 6) {
      setLoginError("Password must be at least 6 characters.");
      return;
    }
    if (resetPassword.next !== resetPassword.confirm) {
      setLoginError("Passwords do not match.");
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEYS.adminPasswordOverride, resetPassword.next);
    window.sessionStorage.setItem(STORAGE_KEYS.adminAuth, "1");
    setAuthed(true);
    setLoginAttempts(0);
    setLoginStep("login");
    setLoginError("");
    setToast("Admin password updated for this browser session.");
  }

  function logout() {
    window.sessionStorage.removeItem(STORAGE_KEYS.adminAuth);
    setAuthed(false);
    setLoginForm({ user: "", password: "" });
    setLoginStep("login");
    setOtpInput("");
    setResetPassword({ next: "", confirm: "" });
    setLoginAttempts(0);
  }

  function updateCategorySelection(value, checked) {
    setProductForm((current) => ({
      ...current,
      categories: checked ? [...new Set([...current.categories, value])] : current.categories.filter((item) => item !== value),
    }));
  }

  function saveProduct(event) {
    event.preventDefault();
    if (!productForm.categories.length) {
      window.alert("Please select at least one category.");
      return;
    }

    const existingProduct = productForm.id
      ? products.find((product) => product.id === Number(productForm.id))
      : null;

    const normalizedVariations = variations
      .filter((variation) => (variation.label || "").trim())
      .map((variation) => ({ ...variation, price: Number(variation.price || 0) }))
      .filter((variation) => !Number.isNaN(variation.price));
    const minVariationPrice = normalizedVariations.length ? Math.min(...normalizedVariations.map((variation) => variation.price)) : null;

    const nextProduct = {
      id: productForm.id ? Number(productForm.id) : Date.now(),
      name: productForm.name,
      category: productForm.categories[0],
      categories: productForm.categories,
      price: minVariationPrice ?? Number(productForm.price || 0),
      oldPrice: existingProduct?.oldPrice ?? null,
      stockStatus: productForm.stockStatus,
      stockCount: productForm.stockCount === "" ? null : Number(productForm.stockCount),
      rating: existingProduct?.rating ?? 5,
      reviews: existingProduct?.reviews ?? 0,
      badge: productForm.badge,
      img: productForm.cover,
      image: productForm.cover,
      imgHover: productForm.hover,
      gallery: productForm.galleryText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      shortDesc: productForm.shortDesc,
      description: productForm.description,
      featured: productForm.featured,
      variations: normalizedVariations,
      attributes: attributes.filter((attribute) => attribute.name && attribute.values),
      cover: productForm.cover,
    };

    const nextProducts = productForm.id
      ? products.map((product) => product.id === nextProduct.id ? { ...product, ...nextProduct } : product)
      : [...products, nextProduct];
    persistProducts(nextProducts);
    resetEditor();
    setToast(productForm.id ? "Product updated successfully." : "Product added successfully.");
  }

  function editProduct(id) {
    const product = products.find((item) => item.id === id);
    if (!product) {
      return;
    }
    setProductForm({
      id: String(product.id),
      name: product.name || "",
      price: String(product.price || ""),
      stockStatus: product.stockStatus || "instock",
      stockCount: product.stockCount ?? "",
      badge: product.badge || "",
      cover: product.img || product.image || "",
      hover: product.imgHover || "",
      galleryText: (product.gallery || []).join("\n"),
      shortDesc: product.shortDesc || "",
      description: product.description || "",
      featured: Boolean(product.featured),
      categories: product.categories || [product.category].filter(Boolean),
    });
    setVariations(product.variations || []);
    setAttributes(product.attributes?.length ? product.attributes : getSavedAttributes());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteProduct(id) {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    persistProducts(products.filter((product) => product.id !== id));
    setToast("Product removed.");
  }

  function undoLastChange() {
    const previous = history[history.length - 1];
    if (!previous) {
      return;
    }
    const nextHistory = history.slice(0, -1);
    setHistory(nextHistory);
    const nextProducts = JSON.parse(previous);
    setProducts(nextProducts);
    setToast("Undo applied.");
  }

  function addVariationRow(data = { label: "", price: "", stockStatus: "instock", img: "", options: null }) {
    setVariations((current) => [...current, data]);
  }

  function updateVariation(index, patch) {
    setVariations((current) => current.map((variation, currentIndex) => currentIndex === index ? { ...variation, ...patch } : variation));
  }

  function removeVariation(index) {
    setVariations((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function addAttributeRow(attribute = { name: "", values: "" }) {
    setAttributes((current) => [...current, attribute]);
  }

  function updateAttribute(index, patch) {
    setAttributes((current) => current.map((attribute, currentIndex) => currentIndex === index ? { ...attribute, ...patch } : attribute));
  }

  function removeAttribute(index) {
    setAttributes((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function generateVariationsFromAttributes() {
    const activeAttributes = attributes.filter((attribute) => attribute.name && attribute.values);
    if (!activeAttributes.length) {
      window.alert("Add at least one attribute first.");
      return;
    }

    const valueSets = activeAttributes.map((attribute) => attribute.values.split("|").flatMap((chunk) => chunk.split(",")).map((value) => value.trim()).filter(Boolean));
    const combinations = cartesian(valueSets);
    const nextVariations = combinations.map((combination) => {
      const options = {};
      activeAttributes.forEach((attribute, index) => {
        options[attribute.name] = combination[index];
      });
      return {
        label: Object.entries(options).map(([key, value]) => `${key}: ${value}`).join(" / "),
        price: productForm.price || "",
        stockStatus: "instock",
        img: "",
        options,
      };
    });
    setVariations(nextVariations);
  }

  function importCsv(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result || ""));
      const imported = rows.map((row) => {
        const categories = (row.categories || row.category || "")
          .split("|")
          .flatMap((chunk) => chunk.split(","))
          .map((value) => value.trim())
          .filter(Boolean);
        return {
          id: Date.now() + Math.floor(Math.random() * 10000),
          name: row.name,
          category: categories[0] || "gym-equipment",
          categories,
          price: Number(row.price || 0),
          stockStatus: row.stock_status || "instock",
          badge: row.badge || "",
          img: row.img || row.image || "",
          image: row.img || row.image || "",
          imgHover: row.img_hover || "",
          gallery: [],
          shortDesc: row.short_desc || "",
          description: row.description || "",
          featured: String(row.featured || "").toLowerCase() !== "false",
          reviews: 0,
          rating: 5,
        };
      });
      persistProducts([...products, ...imported]);
      setToast(`Imported ${imported.length} products from CSV.`);
    };
    reader.readAsText(file);
  }

  async function syncProductsToSupabase() {
    if (!window.supabaseClient) {
      window.alert("Supabase is not configured in this page.");
      return;
    }

    const payload = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      categories: product.categories,
      stock_status: product.stockStatus,
      badge: product.badge,
      img: product.img || product.image,
      img_hover: product.imgHover || null,
      gallery: product.gallery || [],
      short_desc: product.shortDesc || "",
      description: product.description || "",
      featured: product.featured,
      rating: product.rating || 5,
      reviews: product.reviews || 0,
    }));

    try {
      const { error } = await window.supabaseClient.from("products").upsert(payload, { onConflict: "id" });
      if (error) {
        throw error;
      }
      setToast(`Synced ${payload.length} products to Supabase.`);
    } catch (error) {
      window.alert(`Supabase sync failed: ${error.message}`);
    }
  }

  async function optimizeDatabase() {
    try {
      let optimizedCount = 0;
      const nextProducts = [];

      for (const product of products) {
        const nextProduct = { ...product };
        for (const field of ["img", "image", "imgHover"]) {
          if (typeof nextProduct[field] === "string" && nextProduct[field].startsWith("data:image/")) {
            nextProduct[field] = await compressImage(nextProduct[field], 800, 0.65);
            optimizedCount += 1;
          }
        }
        if (Array.isArray(nextProduct.gallery)) {
          nextProduct.gallery = await Promise.all(nextProduct.gallery.map(async (item) => {
            if (typeof item === "string" && item.startsWith("data:image/")) {
              optimizedCount += 1;
              return compressImage(item, 800, 0.65);
            }
            return item;
          }));
        }
        if (Array.isArray(nextProduct.variations)) {
          nextProduct.variations = await Promise.all(nextProduct.variations.map(async (variation) => {
            if (typeof variation.img === "string" && variation.img.startsWith("data:image/")) {
              optimizedCount += 1;
              return { ...variation, img: await compressImage(variation.img, 600, 0.65) };
            }
            return variation;
          }));
        }
        nextProducts.push(nextProduct);
      }

      persistProducts(nextProducts);
      setToast(`Optimized ${optimizedCount} images.`);
    } catch (error) {
      window.alert(`Image optimization failed: ${error.message}`);
    }
  }

  async function migrateImagesAndSyncToSupabase() {
    if (!window.supabaseClient) {
      window.alert("Supabase Storage is not configured.");
      return;
    }

    try {
      const nextProducts = [];
      let migratedCount = 0;
      for (const product of products) {
        const nextProduct = { ...product };
        for (const field of ["img", "image", "imgHover"]) {
          if (typeof nextProduct[field] === "string" && nextProduct[field].startsWith("data:image/")) {
            const blob = dataUrlToBlob(nextProduct[field]);
            nextProduct[field] = await uploadBlobToSupabase(blob, "webp", "products");
            migratedCount += 1;
          }
        }
        if (Array.isArray(nextProduct.gallery)) {
          nextProduct.gallery = await Promise.all(nextProduct.gallery.map(async (item) => {
            if (typeof item === "string" && item.startsWith("data:image/")) {
              migratedCount += 1;
              return uploadBlobToSupabase(dataUrlToBlob(item), "webp", "products/gallery");
            }
            return item;
          }));
        }
        if (Array.isArray(nextProduct.variations)) {
          nextProduct.variations = await Promise.all(nextProduct.variations.map(async (variation) => {
            if (typeof variation.img === "string" && variation.img.startsWith("data:image/")) {
              migratedCount += 1;
              return {
                ...variation,
                img: await uploadBlobToSupabase(dataUrlToBlob(variation.img), "webp", "products/variations"),
              };
            }
            return variation;
          }));
        }
        nextProducts.push(nextProduct);
      }

      persistProducts(nextProducts);
      await syncProductsToSupabase();
      setToast(`Migrated ${migratedCount} images and synced products.`);
    } catch (error) {
      window.alert(`Image migration failed: ${error.message}`);
    }
  }

  function saveCoupon() {
    if (!couponForm.code || !couponForm.discount) {
      window.alert("Enter coupon code and discount.");
      return;
    }
    const nextCoupon = {
      code: couponForm.code.toUpperCase(),
      discountType: couponForm.discountType,
      discount: Number(couponForm.discount),
      limitPerCoupon: couponForm.limitPerCoupon ? Number(couponForm.limitPerCoupon) : null,
      limitPerItems: couponForm.limitPerItems ? Number(couponForm.limitPerItems) : null,
      limitPerUser: couponForm.limitPerUser ? Number(couponForm.limitPerUser) : null,
      specificProducts: couponForm.specificProducts.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean),
      usedCount: 0,
      userUses: {},
    };
    setCoupons((current) => {
      const existing = current.findIndex((coupon) => coupon.code === nextCoupon.code);
      if (existing >= 0) {
        return current.map((coupon, index) => index === existing ? { ...coupon, ...nextCoupon } : coupon);
      }
      return [...current, nextCoupon];
    });
    setCouponForm(initialCouponForm);
    setToast("Coupon saved.");
  }

  function deleteCoupon(code) {
    setCoupons((current) => current.filter((coupon) => coupon.code !== code));
    setToast("Coupon deleted.");
  }

  async function updateOrderStatus(orderId, status) {
    const nextOrders = orders.map((order) => {
      const currentId = order.order_id || order.id;
      return currentId === orderId ? { ...order, status, updated_at: new Date().toISOString() } : order;
    });
    setOrders(nextOrders);
    saveOrders(nextOrders);
    if (window.supabaseClient) {
      try {
        await window.supabaseClient.from("orders").update({ status }).eq("order_id", orderId);
      } catch {
        // ignore network sync failure
      }
    }
    setToast("Order status updated.");
  }

  const userOrderCounts = useMemo(() => {
    return Object.fromEntries(
      users.map((user) => [
        user.email,
        orders.filter((order) => String(order.email || "").toLowerCase() === String(user.email || "").toLowerCase()).length,
      ]),
    );
  }, [orders, users]);

  if (!authed) {
    return (
      <div className="admin-login-wrap-react">
        <div className="admin-login-card-react">
          <div className="admin-login-title">Admin Access</div>
          <div className="admin-login-sub">This is still client-side only. It prevents casual access, not real server-side abuse.</div>
          {loginStep === "login" ? (
            <form onSubmit={handleAdminLogin} className="admin-auth-form">
              <label>
                <span>Username</span>
                <input value={loginForm.user} onChange={(event) => setLoginForm((current) => ({ ...current, user: event.target.value }))} autoFocus />
              </label>
              <label>
                <span>Password</span>
                <input type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <button className="btn btn-primary" type="submit">Unlock Dashboard</button>
            </form>
          ) : null}
          {loginStep === "otp" ? (
            <div className="admin-auth-form">
              <label>
                <span>Enter OTP</span>
                <input value={otpInput} onChange={(event) => setOtpInput(event.target.value)} autoFocus />
              </label>
              <button className="btn btn-primary" type="button" onClick={verifyOtp}>Verify OTP</button>
              <button className="btn btn-outline" type="button" onClick={triggerOtpFlow}>Resend OTP</button>
            </div>
          ) : null}
          {loginStep === "reset" ? (
            <div className="admin-auth-form">
              <label>
                <span>New Password</span>
                <input type="password" value={resetPassword.next} onChange={(event) => setResetPassword((current) => ({ ...current, next: event.target.value }))} autoFocus />
              </label>
              <label>
                <span>Confirm Password</span>
                <input type="password" value={resetPassword.confirm} onChange={(event) => setResetPassword((current) => ({ ...current, confirm: event.target.value }))} />
              </label>
              <button className="btn btn-primary" type="button" onClick={applyPasswordReset}>Save Password</button>
            </div>
          ) : null}
          {loginError ? <div className="admin-login-err-react">{loginError}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-app">
      <aside className="admin-sidebar-react">
        <a href="index.html" className="admin-logo-react">
          <img src="/logo.png" alt="Sports Way Trading" className="nav-logo-img" />
        </a>
        <nav className="admin-nav-react">
          {[
            ["visibility", "Visibility"],
            ["products", "Products"],
            ["orders", "Orders"],
            ["users", "Users"],
            ["coupons", "Coupons"],
          ].map(([key, label]) => (
            <button key={key} className={section === key ? "active" : ""} onClick={() => setSection(key)}>
              {label}
            </button>
          ))}
          <a href="index.html">View Site</a>
        </nav>
      </aside>

      <main className="admin-main-react">
        <div className="admin-header-react">
          <h1>Admin Dashboard</h1>
          <button className="admin-logout-btn" onClick={logout}>Logout</button>
        </div>

        {toast ? <div className="admin-toast-react">{toast}</div> : null}

        {section === "visibility" ? (
          <>
            <section className="admin-card-react">
              <h2>Website Category Visibility</h2>
              <p>Toggle which product categories stay visible in the public navigation and footer.</p>
              <div className="admin-toggle-grid">
                {adminCategoryToggles.map((item) => (
                  <label key={item.value} className="admin-toggle-row">
                    <input
                      type="checkbox"
                      checked={!hiddenCategories.includes(item.value)}
                      onChange={(event) => setHiddenCategories((current) => (
                        event.target.checked ? current.filter((value) => value !== item.value) : [...current, item.value]
                      ))}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="admin-card-react">
              <div className="admin-card-head">
                <h2>Website Subcategory Visibility</h2>
                <div className="admin-inline-actions">
                  <button className="btn btn-outline" onClick={() => setHiddenSubcategories([])}>Unhide All</button>
                  <button className="btn btn-outline" onClick={() => setHiddenSubcategories(adminSubcategoryToggles)}>Hide All</button>
                </div>
              </div>
              <div className="admin-toggle-grid">
                {adminSubcategoryToggles.map((item) => (
                  <label key={item} className="admin-toggle-row">
                    <input
                      type="checkbox"
                      checked={!hiddenSubcategories.includes(item)}
                      onChange={(event) => setHiddenSubcategories((current) => (
                        event.target.checked ? current.filter((value) => value !== item) : [...current, item]
                      ))}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {section === "products" ? (
          <>
            <section className="admin-card-react">
              <div className="admin-card-head">
                <h2>{productForm.id ? "Edit Product" : "Add New Product"}</h2>
                <div className="admin-inline-actions">
                  <button className="btn btn-outline" onClick={undoLastChange} disabled={!history.length}>Undo</button>
                  <button className="btn btn-outline" onClick={() => saveSavedAttributes(attributes)}>Save Attributes</button>
                  <button className="btn btn-outline" onClick={generateVariationsFromAttributes}>Generate Variations</button>
                  <button className="btn btn-outline" onClick={migrateImagesAndSyncToSupabase}>Migrate Images</button>
                  <button className="btn btn-outline" onClick={optimizeDatabase}>Optimize Images</button>
                  <button className="btn btn-outline" onClick={syncProductsToSupabase}>Sync to Supabase</button>
                </div>
              </div>

              <form className="admin-product-form" onSubmit={saveProduct}>
                <label>
                  <span>Product Name</span>
                  <input value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} required />
                </label>
                <label>
                  <span>Base Price</span>
                  <input type="number" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} />
                </label>
                <label>
                  <span>Stock Status</span>
                  <select value={productForm.stockStatus} onChange={(event) => setProductForm((current) => ({ ...current, stockStatus: event.target.value }))}>
                    <option value="instock">In Stock</option>
                    <option value="outofstock">Out of Stock</option>
                    <option value="onbackorder">On Backorder</option>
                  </select>
                </label>
                <label>
                  <span>Stock Count</span>
                  <input type="number" value={productForm.stockCount} onChange={(event) => setProductForm((current) => ({ ...current, stockCount: event.target.value }))} />
                </label>
                <label>
                  <span>Badge</span>
                  <select value={productForm.badge} onChange={(event) => setProductForm((current) => ({ ...current, badge: event.target.value }))}>
                    {productBadgeOptions.map((option) => <option key={option} value={option}>{option || "None"}</option>)}
                  </select>
                </label>
                <label className="admin-check-inline">
                  <input type="checkbox" checked={productForm.featured} onChange={(event) => setProductForm((current) => ({ ...current, featured: event.target.checked }))} />
                  <span>Featured Product</span>
                </label>

                <label className="span-2">
                  <span>Short Description</span>
                  <textarea rows="3" value={productForm.shortDesc} onChange={(event) => setProductForm((current) => ({ ...current, shortDesc: event.target.value }))} />
                </label>
                <label className="span-2">
                  <span>Detailed Description</span>
                  <textarea rows="6" value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} />
                </label>

                <div className="span-2 admin-image-grid">
                  <label>
                    <span>Cover Image URL / Data URL</span>
                    <input value={productForm.cover} onChange={(event) => setProductForm((current) => ({ ...current, cover: event.target.value }))} />
                    <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && handleImageFieldChange("cover", event.target.files[0])} />
                  </label>
                  <label>
                    <span>Hover Image URL / Data URL</span>
                    <input value={productForm.hover} onChange={(event) => setProductForm((current) => ({ ...current, hover: event.target.value }))} />
                    <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && handleImageFieldChange("hover", event.target.files[0])} />
                  </label>
                </div>

                <label className="span-2">
                  <span>Gallery Images, one per line</span>
                  <textarea rows="4" value={productForm.galleryText} onChange={(event) => setProductForm((current) => ({ ...current, galleryText: event.target.value }))} />
                  <input type="file" accept="image/*" multiple onChange={(event) => event.target.files?.length && handleGalleryUpload(Array.from(event.target.files))} />
                </label>

                <div className="span-2">
                  <span className="admin-block-label">Categories</span>
                  <div className="admin-checkbox-panel">
                    {adminCategoryOptions.map((option) => (
                      <label key={option.value} className="admin-toggle-row compact">
                        <input
                          type="checkbox"
                          checked={productForm.categories.includes(option.value)}
                          onChange={(event) => updateCategorySelection(option.value, event.target.checked)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="span-2 admin-subpanel">
                  <div className="admin-card-head">
                    <h3>Attributes</h3>
                    <button className="btn btn-outline" type="button" onClick={() => addAttributeRow()}>Add Attribute</button>
                  </div>
                  {attributes.map((attribute, index) => (
                    <div key={`${attribute.name}-${index}`} className="admin-row-grid">
                      <input value={attribute.name} placeholder="Attribute name" onChange={(event) => updateAttribute(index, { name: event.target.value })} />
                      <input value={attribute.values} placeholder="Values: S, M, L or Red | Blue" onChange={(event) => updateAttribute(index, { values: event.target.value })} />
                      <button className="btn btn-outline" type="button" onClick={() => removeAttribute(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                <div className="span-2 admin-subpanel">
                  <div className="admin-card-head">
                    <h3>Variations</h3>
                    <button className="btn btn-outline" type="button" onClick={() => addVariationRow()}>Add Variation</button>
                  </div>
                  {variations.map((variation, index) => (
                    <div key={`${variation.label}-${index}`} className="admin-variation-grid">
                      <input value={variation.label} placeholder="Label" onChange={(event) => updateVariation(index, { label: event.target.value })} />
                      <input type="number" value={variation.price} placeholder="Price" onChange={(event) => updateVariation(index, { price: event.target.value })} />
                      <select value={variation.stockStatus} onChange={(event) => updateVariation(index, { stockStatus: event.target.value })}>
                        <option value="instock">In Stock</option>
                        <option value="outofstock">Out of Stock</option>
                        <option value="onbackorder">On Backorder</option>
                      </select>
                      <div className="admin-variation-image-cell">
                        <input value={variation.img || ""} placeholder="Variation image URL" onChange={(event) => updateVariation(index, { img: event.target.value })} />
                        <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && handleVariationImageUpload(index, event.target.files[0])} />
                      </div>
                      <button className="btn btn-outline" type="button" onClick={() => removeVariation(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                <div className="span-2 admin-inline-actions">
                  <button className="btn btn-primary" type="submit">{productForm.id ? "Update Product" : "Add Product to Catalog"}</button>
                  <button className="btn btn-outline" type="button" onClick={resetEditor}>Reset</button>
                  <label className="btn btn-outline admin-file-label">
                    Import CSV
                    <input type="file" accept=".csv" onChange={(event) => event.target.files?.[0] && importCsv(event.target.files[0])} hidden />
                  </label>
                </div>
              </form>
            </section>

            <section className="admin-card-react">
              <div className="admin-card-head">
                <h2>Live Inventory</h2>
                <input className="admin-search" value={search} onChange={(event) => { setSearch(event.target.value); setProductPage(1); }} placeholder="Search products by name, ID, or category..." />
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table-react">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product</th>
                      <th>Stock</th>
                      <th>Price</th>
                      <th>Categories</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedProducts.items.length ? pagedProducts.items.map((product) => (
                      <tr key={product.id}>
                        <td><img className="table-img" src={product.img || product.image} alt={product.name} /></td>
                        <td>
                          <div className="table-main">{product.name}</div>
                          <div className="table-sub">ID: {product.id}</div>
                        </td>
                        <td>{product.stockStatus || "instock"} {product.stockCount != null ? `(${product.stockCount})` : ""}</td>
                        <td>{product.variations?.length ? `${Math.min(...product.variations.map((item) => item.price)).toLocaleString()} - ${Math.max(...product.variations.map((item) => item.price)).toLocaleString()}` : Number(product.price || 0).toLocaleString()}</td>
                        <td>{(product.categories || [product.category]).join(", ")}</td>
                        <td className="table-actions">
                          <button onClick={() => editProduct(product.id)}>Edit</button>
                          <button onClick={() => deleteProduct(product.id)}>Delete</button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="table-empty">No products match the current filter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination state={pagedProducts} currentPage={productPage} onChange={setProductPage} />
            </section>
          </>
        ) : null}

        {section === "orders" ? (
          <section className="admin-card-react">
            <div className="admin-card-head">
              <h2>Orders</h2>
              <button className="btn btn-outline" onClick={() => refreshOrders(() => setUsers(getUsers()))}>Refresh</button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table-react">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedOrders.items.length ? pagedOrders.items.map((order) => {
                    const orderId = order.order_id || order.id;
                    return (
                      <tr key={orderId}>
                        <td className="table-main">{orderId}</td>
                        <td>
                          <div className="table-main">{order.customer_name || "—"}</div>
                          <div className="table-sub">{order.email || ""}</div>
                          <div className="table-sub">{order.phone || ""}</div>
                        </td>
                        <td>{new Date(order.created_at).toLocaleString()}</td>
                        <td>{order.payment_method || "—"}</td>
                        <td>{formatPrice(Number(order.total || 0))}</td>
                        <td>
                          <select value={order.status || "Processing"} onChange={(event) => updateOrderStatus(orderId, event.target.value)}>
                            {["Processing", "Paid", "Completed", "Cancelled", "Failed", "Pending Payment"].map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td>{(order.items || []).map((item) => `${item.name} x ${item.qty || 1}`).join(", ") || "—"}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="7" className="table-empty">No orders found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination state={pagedOrders} currentPage={orderPage} onChange={setOrderPage} />
          </section>
        ) : null}

        {section === "users" ? (
          <section className="admin-card-react">
            <div className="admin-card-head">
              <h2>Registered Users</h2>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table-react">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Orders</th>
                    <th>Created</th>
                    <th>Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.items.length ? pagedUsers.items.map((user) => (
                    <tr key={user.id || user.email}>
                      <td>{user.name || "—"}</td>
                      <td>{user.email || "—"}</td>
                      <td>{user.phone || "—"}</td>
                      <td>{userOrderCounts[user.email] || 0}</td>
                      <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</td>
                      <td>{user.last_login ? new Date(user.last_login).toLocaleString() : "—"}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" className="table-empty">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination state={pagedUsers} currentPage={userPage} onChange={setUserPage} />
          </section>
        ) : null}

        {section === "coupons" ? (
          <>
            <section className="admin-card-react">
              <div className="admin-card-head">
                <h2>Manage Coupons</h2>
              </div>
              <div className="admin-product-form">
                <label>
                  <span>Coupon Code</span>
                  <input value={couponForm.code} onChange={(event) => setCouponForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} />
                </label>
                <label>
                  <span>Discount Type</span>
                  <select value={couponForm.discountType} onChange={(event) => setCouponForm((current) => ({ ...current, discountType: event.target.value }))}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed_cart">Fixed Cart</option>
                    <option value="fixed_product">Fixed Product</option>
                  </select>
                </label>
                <label>
                  <span>Coupon Amount / %</span>
                  <input type="number" value={couponForm.discount} onChange={(event) => setCouponForm((current) => ({ ...current, discount: event.target.value }))} />
                </label>
                <label>
                  <span>Usage Limit Per Coupon</span>
                  <input type="number" value={couponForm.limitPerCoupon} onChange={(event) => setCouponForm((current) => ({ ...current, limitPerCoupon: event.target.value }))} />
                </label>
                <label>
                  <span>Limit Discounted Items</span>
                  <input type="number" value={couponForm.limitPerItems} onChange={(event) => setCouponForm((current) => ({ ...current, limitPerItems: event.target.value }))} />
                </label>
                <label>
                  <span>Usage Limit Per User</span>
                  <input type="number" value={couponForm.limitPerUser} onChange={(event) => setCouponForm((current) => ({ ...current, limitPerUser: event.target.value }))} />
                </label>
                <label className="span-2">
                  <span>Specific Products, comma separated</span>
                  <input value={couponForm.specificProducts} onChange={(event) => setCouponForm((current) => ({ ...current, specificProducts: event.target.value }))} />
                </label>
                <div className="span-2 admin-inline-actions">
                  <button className="btn btn-primary" type="button" onClick={saveCoupon}>Save Coupon</button>
                </div>
              </div>
            </section>

            <section className="admin-card-react">
              <div className="admin-table-wrap">
                <table className="admin-table-react">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Discount</th>
                      <th>Used</th>
                      <th>Per Coupon</th>
                      <th>Per User</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedCoupons.items.length ? pagedCoupons.items.map((coupon) => (
                      <tr key={coupon.code}>
                        <td className="table-main">{coupon.code}</td>
                        <td>{coupon.discountType}</td>
                        <td>{coupon.discountType === "percentage" ? `${coupon.discount}%` : formatPrice(Number(coupon.discount || 0))}</td>
                        <td>{coupon.usedCount || 0}</td>
                        <td>{coupon.limitPerCoupon ?? "Unlimited"}</td>
                        <td>{coupon.limitPerUser ?? "Unlimited"}</td>
                        <td className="table-actions">
                          <button onClick={() => deleteCoupon(coupon.code)}>Delete</button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="7" className="table-empty">No coupons added.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination state={pagedCoupons} currentPage={couponPage} onChange={setCouponPage} />
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

function Pagination({ state, currentPage, onChange }) {
  if (state.totalPages <= 1) {
    return null;
  }

  return (
    <div className="admin-pagination-react">
      {currentPage > 1 ? <button onClick={() => onChange(currentPage - 1)}>&lt;</button> : null}
      {Array.from({ length: state.totalPages }, (_, index) => index + 1).map((page) => (
        <button key={page} className={page === currentPage ? "active" : ""} onClick={() => onChange(page)}>
          {page}
        </button>
      ))}
      {currentPage < state.totalPages ? <button onClick={() => onChange(currentPage + 1)}>&gt;</button> : null}
    </div>
  );
}
