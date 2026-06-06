import { useEffect, useMemo, useState } from "react";
import {
  adminCategoryOptions,
  adminCategoryToggles,
  adminSubcategoryToggles,
  productBadgeOptions,
} from "../data/adminData";
import { formatPrice } from "../lib/format";
import {
  deleteCoupon,
  fetchAllOrders,
  fetchCoupons,
  fetchSavedAttributes,
  fetchVisibilitySettings,
  listProfiles,
  saveHiddenCategories,
  saveHiddenSubcategories,
  saveSavedAttributes,
  updateOrderStatus,
  uploadBlobToStorage,
  upsertCoupon,
} from "../lib/storefrontApi";

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

export function AdminPage({ currentUser, products, requestPasswordReset, setProducts, signIn, signOut }) {
  const [section, setSection] = useState("visibility");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [search, setSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [couponPage, setCouponPage] = useState(1);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [variations, setVariations] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [history, setHistory] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [hiddenSubcategories, setHiddenSubcategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState(initialCouponForm);
  const [toast, setToast] = useState("");

  const authed = currentUser?.role === "admin";

  useEffect(() => {
    document.title = "Admin Dashboard - Sports Way Trading";
  }, []);

  useEffect(() => {
    const timer = toast ? window.setTimeout(() => setToast(""), 2500) : null;
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [toast]);

  useEffect(() => {
    if (!authed) {
      return;
    }

    let active = true;

    const load = async () => {
      const [visibility, nextAttributes, nextOrders, nextUsers, nextCoupons] = await Promise.all([
        fetchVisibilitySettings(),
        fetchSavedAttributes(),
        fetchAllOrders(),
        listProfiles(),
        fetchCoupons(),
      ]);

      if (!active) {
        return;
      }

      setHiddenCategories(visibility.hiddenCategories);
      setHiddenSubcategories(visibility.hiddenSubcategories);
      setAttributes(nextAttributes);
      setOrders(nextOrders);
      setUsers(nextUsers);
      setCoupons(nextCoupons);
    };

    load();
    return () => {
      active = false;
    };
  }, [authed]);

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

  const userOrderCounts = useMemo(() => {
    return Object.fromEntries(
      users.map((user) => [
        user.email,
        orders.filter((order) => String(order.email || "").toLowerCase() === String(user.email || "").toLowerCase()).length,
      ]),
    );
  }, [orders, users]);

  async function persistProducts(nextProducts) {
    setHistory((current) => [...current.slice(-9), JSON.stringify(products)]);
    await setProducts(nextProducts);
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

  async function handleAdminLogin(event) {
    event.preventDefault();
    try {
      const profile = await signIn({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      if (profile?.role !== "admin") {
        await signOut();
        setLoginError("This account is not marked as admin.");
        return;
      }

      setLoginError("");
    } catch (error) {
      setLoginError(error.message || "Incorrect email or password.");
    }
  }

  async function toggleCategoryVisibility(value, nextVisible) {
    const nextCategories = nextVisible
      ? hiddenCategories.filter((item) => item !== value)
      : [...new Set([...hiddenCategories, value])];
    setHiddenCategories(nextCategories);
    await saveHiddenCategories(nextCategories);
  }

  async function toggleSubcategoryVisibility(value, nextVisible) {
    const nextSubcategories = nextVisible
      ? hiddenSubcategories.filter((item) => item !== value)
      : [...new Set([...hiddenSubcategories, value])];
    setHiddenSubcategories(nextSubcategories);
    await saveHiddenSubcategories(nextSubcategories);
  }

  function updateCategorySelection(value, checked) {
    setProductForm((current) => ({
      ...current,
      categories: checked ? [...new Set([...current.categories, value])] : current.categories.filter((item) => item !== value),
    }));
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!productForm.categories.length) {
      window.alert("Please select at least one category.");
      return;
    }

    const existingProduct = productForm.id
      ? products.find((product) => product.id === Number(productForm.id))
      : null;

    const normalizedVariations = variations
      .filter((variation) => (variation.label || "").trim() || variation.options)
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

    await saveSavedAttributes(attributes);
    await persistProducts(nextProducts);
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
    setAttributes(product.attributes?.length ? product.attributes : attributes);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProduct(id) {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    await persistProducts(products.filter((product) => product.id !== id));
    setToast("Product removed.");
  }

  function undoLastChange() {
    const previous = history[history.length - 1];
    if (!previous) {
      return;
    }
    setHistory((current) => current.slice(0, -1));
    setProducts(JSON.parse(previous));
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

  async function importCsv(file) {
    const reader = new FileReader();
    reader.onload = async () => {
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
      await persistProducts([...products, ...imported]);
      setToast(`Imported ${imported.length} products from CSV.`);
    };
    reader.readAsText(file);
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

      await persistProducts(nextProducts);
      setToast(`Optimized ${optimizedCount} images.`);
    } catch (error) {
      window.alert(`Image optimization failed: ${error.message}`);
    }
  }

  async function migrateImagesAndSyncToSupabase() {
    try {
      const nextProducts = [];
      let migratedCount = 0;
      for (const product of products) {
        const nextProduct = { ...product };
        for (const field of ["img", "image", "imgHover"]) {
          if (typeof nextProduct[field] === "string" && nextProduct[field].startsWith("data:image/")) {
            const blob = dataUrlToBlob(nextProduct[field]);
            nextProduct[field] = await uploadBlobToStorage(blob, "webp", "products");
            migratedCount += 1;
          }
        }
        if (Array.isArray(nextProduct.gallery)) {
          nextProduct.gallery = await Promise.all(nextProduct.gallery.map(async (item) => {
            if (typeof item === "string" && item.startsWith("data:image/")) {
              migratedCount += 1;
              return uploadBlobToStorage(dataUrlToBlob(item), "webp", "products/gallery");
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
                img: await uploadBlobToStorage(dataUrlToBlob(variation.img), "webp", "products/variations"),
              };
            }
            return variation;
          }));
        }
        nextProducts.push(nextProduct);
      }

      await persistProducts(nextProducts);
      setToast(`Migrated ${migratedCount} images and synced products.`);
    } catch (error) {
      window.alert(`Image migration failed: ${error.message}`);
    }
  }

  async function saveCoupon() {
    if (!couponForm.code || !couponForm.discount) {
      window.alert("Enter coupon code and discount.");
      return;
    }

    const nextCoupons = await upsertCoupon({
      code: couponForm.code.toUpperCase(),
      discountType: couponForm.discountType,
      discount: Number(couponForm.discount),
      limitPerCoupon: couponForm.limitPerCoupon ? Number(couponForm.limitPerCoupon) : null,
      limitPerItems: couponForm.limitPerItems ? Number(couponForm.limitPerItems) : null,
      limitPerUser: couponForm.limitPerUser ? Number(couponForm.limitPerUser) : null,
      specificProducts: couponForm.specificProducts.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean),
      usedCount: 0,
      userUses: {},
      active: true,
    });
    setCoupons(nextCoupons);
    setCouponForm(initialCouponForm);
    setToast("Coupon saved.");
  }

  async function removeCoupon(code) {
    const nextCoupons = await deleteCoupon(code);
    setCoupons(nextCoupons);
    setToast("Coupon deleted.");
  }

  async function refreshOrders() {
    const [nextOrders, nextUsers] = await Promise.all([fetchAllOrders(), listProfiles()]);
    setOrders(nextOrders);
    setUsers(nextUsers);
  }

  async function changeOrderStatus(orderId, status) {
    await updateOrderStatus(orderId, status);
    const nextOrders = await fetchAllOrders();
    setOrders(nextOrders);
    setToast("Order status updated.");
  }

  if (!authed) {
    return (
      <div className="admin-login-wrap-react">
        <div className="admin-login-card-react">
          <div className="admin-login-title">Admin Access</div>
          <div className="admin-login-sub">This route now uses Supabase Auth plus the `profiles.role = admin` check.</div>
          <form onSubmit={handleAdminLogin} className="admin-auth-form">
            <label>
              <span>Admin Email</span>
              <input type="email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} autoFocus />
            </label>
            <label>
              <span>Password</span>
              <input type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} />
            </label>
            <button className="btn btn-primary" type="submit">Unlock Dashboard</button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={async () => {
                try {
                  await requestPasswordReset(loginForm.email.trim());
                  setLoginError("Password reset email sent.");
                } catch (error) {
                  setLoginError(error.message || "Unable to send reset email.");
                }
              }}
            >
              Reset Password
            </button>
          </form>
          <div className="account-msg error" style={{ minHeight: 20 }}>{loginError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell-react">
      <aside className="admin-sidebar-react">
        <div>
          <div className="admin-brand-react">Sports Way Admin</div>
          <div className="admin-user-pill">Logged in as {currentUser.email}</div>
        </div>
        <nav className="admin-nav-react">
          {[
            ["visibility", "Visibility"],
            ["products", "Products"],
            ["orders", "Orders"],
            ["users", "Users"],
            ["coupons", "Coupons"],
          ].map(([value, label]) => (
            <button key={value} className={section === value ? "active" : ""} onClick={() => setSection(value)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="admin-footer-actions">
          <button className="btn btn-outline" type="button" onClick={undoLastChange}>Undo</button>
          <button className="btn btn-outline" type="button" onClick={() => signOut()}>Logout</button>
        </div>
      </aside>

      <main className="admin-main-react">
        {toast ? <div className="admin-toast-react">{toast}</div> : null}

        {section === "visibility" ? (
          <>
            <section className="admin-card-react">
              <div className="admin-card-head">
                <h2>Category Visibility</h2>
              </div>
              <div className="admin-toggle-grid">
                {adminCategoryToggles.map((item) => (
                  <label key={item.value} className="admin-toggle-row">
                    <span>{item.label}</span>
                    <input
                      type="checkbox"
                      checked={!hiddenCategories.includes(item.value)}
                      onChange={(event) => toggleCategoryVisibility(item.value, event.target.checked)}
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="admin-card-react">
              <div className="admin-card-head">
                <h2>Subcategory Visibility</h2>
              </div>
              <div className="admin-toggle-grid compact">
                {adminSubcategoryToggles.map((item) => (
                  <label key={item} className="admin-toggle-row compact">
                    <span>{item}</span>
                    <input
                      type="checkbox"
                      checked={!hiddenSubcategories.includes(item)}
                      onChange={(event) => toggleSubcategoryVisibility(item, event.target.checked)}
                    />
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
                <h2>Product Management</h2>
                <div className="admin-inline-actions">
                  <button className="btn btn-outline" type="button" onClick={optimizeDatabase}>Optimize Inline Images</button>
                  <button className="btn btn-outline" type="button" onClick={migrateImagesAndSyncToSupabase}>Upload Inline Images</button>
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
                    <div className="admin-inline-actions">
                      <button className="btn btn-outline" type="button" onClick={() => addAttributeRow()}>Add Attribute</button>
                      <button className="btn btn-outline" type="button" onClick={generateVariationsFromAttributes}>Generate Variations</button>
                    </div>
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
                      <input value={variation.label || ""} placeholder="Label" onChange={(event) => updateVariation(index, { label: event.target.value })} />
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
              <button className="btn btn-outline" onClick={refreshOrders}>Refresh</button>
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
                  {pagedOrders.items.length ? pagedOrders.items.map((order) => (
                    <tr key={order.id}>
                      <td className="table-main">{order.id}</td>
                      <td>
                        <div className="table-main">{order.customer_name || "—"}</div>
                        <div className="table-sub">{order.email || ""}</div>
                        <div className="table-sub">{order.phone || ""}</div>
                      </td>
                      <td>{new Date(order.created_at).toLocaleString()}</td>
                      <td>{order.payment_method || "—"}</td>
                      <td>{formatPrice(Number(order.total || 0))}</td>
                      <td>
                        <select value={order.status || "Processing"} onChange={(event) => changeOrderStatus(order.id, event.target.value)}>
                          {["Processing", "Paid", "Completed", "Cancelled", "Failed", "Pending Payment"].map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td>{(order.items || []).map((item) => `${item.name} x ${item.qty || 1}`).join(", ") || "—"}</td>
                    </tr>
                  )) : (
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
                          <button onClick={() => removeCoupon(coupon.code)}>Delete</button>
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
