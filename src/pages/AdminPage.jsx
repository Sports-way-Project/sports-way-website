import { useEffect, useMemo, useRef, useState } from "react";
import {
  adminCategoryOptions,
  adminCategoryToggles,
  adminSubcategoryToggles,
  productBadgeOptions,
} from "../data/adminData";
import { formatPrice } from "../lib/format";
import {
  BoxIcon,
  CloseIcon,
  EyeIcon,
  FileTextIcon,
  GridIcon,
  HandshakeIcon,
  LayersIcon,
  MenuIcon,
  PanelLeftIcon,
  ReceiptIcon,
  TagIcon,
  UsersIcon,
} from "../components/Icons";
import { ProductWizard } from "../components/admin/ProductWizard";
import { AdminBlogList } from "../components/admin/AdminBlogList";
import { AdminBlogView } from "../components/admin/AdminBlogView";
import { AdminBlogEditor } from "../components/admin/AdminBlogEditor";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminDashboard } from "../components/admin/AdminDashboard";
import { AdminProducts } from "../components/admin/AdminProducts";
import { AdminProductView } from "../components/admin/AdminProductView";
import { AdminProductEdit } from "../components/admin/AdminProductEdit";
import { AdminCatalog } from "../components/admin/AdminCatalog";
import { AdminStocks } from "../components/admin/AdminStocks";
import { AdminCategories } from "../components/admin/AdminCategories";
import { AdminBrands } from "../components/admin/AdminBrands";
import { AdminAttributes } from "../components/admin/AdminAttributes";
import { AdminProductMapping } from "../components/admin/AdminProductMapping";
import { AdminVisibility } from "../components/admin/AdminVisibility";
import { AdminOrders } from "../components/admin/AdminOrders";
import { AdminUsers } from "../components/admin/AdminUsers";
import { AdminCoupons } from "../components/admin/AdminCoupons";
import { AdminContent } from "../components/admin/AdminContent";
import {
  deleteCoupon,
  deleteOrder,
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
  fetchBrands,
  saveBrands,
  fetchCustomCategories,
  saveCustomCategories,
  saveShowBrandsFilter,
  generateSeoPrefix,
  renameStorageObject,
  fetchClients,
  saveClients,
  fetchPartners,
  savePartners,
  fetchBlogs,
  saveBlogs,
  upsertProducts,
  deleteStorageObject,
  deleteStorageObjects,
} from "../lib/storefrontApi";
import { supabase } from "../lib/supabase";
import { createAdmin, deleteUserAccount, getLiveStock, listAdmins, updateAdminRole } from "../lib/fastapiClient";
import { AdminManageAdmins } from "../components/admin/AdminManageAdmins";
import { showAlert, showConfirm } from "../lib/dialog.jsx";
import { friendlyApiError } from "../lib/apiError";
import { isAdmin, isSuperAdmin } from "../lib/roles";
import { useAdminPageTransition } from "../hooks/useAdminPageTransition";
import { playNotificationSound, setFaviconBadge, setTitleBadge } from "../lib/adminNotify";
import { BrandLoader } from "../components/BrandLoader";

const ADMIN_PAGE_SIZE = 18;

const initialProductForm = {
  id: "",
  name: "",
  slug: "",
  price: "",
  oldPrice: "",
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
  brand: "",
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

export function AdminPage({ currentUser, products, requestPasswordReset, setProducts, deleteProduct, signIn, signOut, signUp }) {
  const [section, setSection] = useState("dashboard");
  const [orderIdToOpen, setOrderIdToOpen] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("adminSidebarCollapsed") === "1");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [productWizardOpen, setProductWizardOpen] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState(null);
  const [productMode, setProductMode] = useState("list"); // "list" | "view" | "edit"
  const [productPageData, setProductPageData] = useState(null);
  const [blogMode, setBlogMode] = useState("list"); // "list" | "view" | "edit"
  const [blogPageData, setBlogPageData] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
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
  const [showBrandsFilter, setShowBrandsFilter] = useState(true);
  const [orders, setOrders] = useState([]);
  const knownOrderIdsRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState(initialCouponForm);
  const [brands, setBrands] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [partners, setPartners] = useState([]);
  const [blogs, setBlogs] = useState([]);

  const [newBrand, setNewBrand] = useState("");
  const [newBrandCategory, setNewBrandCategory] = useState("gym-equipment");
  const [editingBrand, setEditingBrand] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [toast, setToast] = useState("");
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [newUsersBadge, setNewUsersBadge] = useState(0);
  const [newOrdersBadge, setNewOrdersBadge] = useState(0);
  // Per-order "unseen" tracking for the blue row highlight in AdminOrders —
  // separate from newOrdersBadge (a plain count), this is the actual set of
  // order ids to highlight, cleared one at a time as each is opened.
  const [newOrderIds, setNewOrderIds] = useState(() => new Set());
  function markOrderSeen(orderId) {
    setNewOrderIds((prev) => {
      if (!prev.has(orderId)) return prev;
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  }
  const authed = isAdmin(currentUser?.role);

  const { pageTransitioning, navigate, runWithTransition } = useAdminPageTransition(
    (id) => { setSection(id); setProductMode("list"); setProductPageData(null); setBlogMode("list"); setBlogPageData(null); },
    {
      onBadgeClear: (id) => {
        if (id === "orders") { setNewOrdersBadge(0); localStorage.setItem("adminLastViewedOrders", new Date().toISOString()); }
        if (id === "users")  { setNewUsersBadge(0);  localStorage.setItem("adminLastViewedUsers",  new Date().toISOString()); }
      },
    },
  );
  function goTo(id) { navigate(id, section); }

  // Deletions are superadmin-only — regular admins keep full create/edit
  // access everywhere, but destructive/hard-to-undo actions are gated here.
  // This is a UX guard (fast, clear message); the real boundary is
  // migration 007's RLS policies, which block the same writes at the DB
  // level even if this check were bypassed.
  function requireSuperAdmin(actionLabel) {
    if (!isSuperAdmin(currentUser?.role)) {
      showAlert(`Only a superadmin can ${actionLabel}.`);
      return false;
    }
    return true;
  }

  useEffect(() => {
    document.title = "Admin Dashboard - Sports Way Trading";
    // Override storefront's dark body background for the admin page
    document.body.style.background = "#f8fafc";
    document.body.style.color = "#111827";
    return () => {
      document.body.style.background = "";
      document.body.style.color = "";
    };
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
      const [visibility, nextAttributes, nextOrders, nextUsers, nextCoupons, nextBrands, nextCats, nextClients, nextPartners, nextBlogs] = await Promise.all([
        fetchVisibilitySettings(),
        fetchSavedAttributes(),
        fetchAllOrders(),
        listProfiles(),
        fetchCoupons(),
        fetchBrands(),
        fetchCustomCategories(),
        fetchClients(),
        fetchPartners(),
        fetchBlogs(),
      ]);

      if (!active) {
        return;
      }

      setHiddenCategories(visibility.hiddenCategories);
      setHiddenSubcategories(visibility.hiddenSubcategories);
      setShowBrandsFilter(visibility.showBrandsFilter);
      setAttributes(nextAttributes);
      setOrders(nextOrders);
      setUsers(nextUsers);
      setCoupons(nextCoupons);
      setBrands(nextBrands);
      setCustomCategories(nextCats);
      setClients(nextClients);
      setPartners(nextPartners);
      setBlogs(nextBlogs);

      // Calculate offline missed badges
      const lastViewedOrders = localStorage.getItem("adminLastViewedOrders") || 0;
      const lastViewedUsers = localStorage.getItem("adminLastViewedUsers") || 0;
      
      const missedOrderRows = nextOrders.filter(o => new Date(o.created_at).getTime() > new Date(lastViewedOrders).getTime());
      const missedUsers = nextUsers.filter(u => new Date(u.created_at).getTime() > new Date(lastViewedUsers).getTime()).length;

      setNewOrdersBadge(missedOrderRows.length);
      setNewUsersBadge(missedUsers);
      setNewOrderIds(new Set(missedOrderRows.map((o) => o.id)));
      knownOrderIdsRef.current = new Set(nextOrders.map((o) => o.id));
    };

    load();

    return () => {
      active = false;
    };
  }, [authed]);

  async function refreshAdmins() {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return;
    setAdmins(await listAdmins(token));
  }

  useEffect(() => {
    if (authed && isSuperAdmin(currentUser?.role)) {
      refreshAdmins();
    }
  }, [authed, currentUser?.role]);

  // Real-time: refresh users + orders lists and show notification badges
  useEffect(() => {
    if (!authed) return;
    const channel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        async () => {
          const nextUsers = await listProfiles();
          setUsers(nextUsers);
          setNewUsersBadge((n) => n + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        async () => {
          const nextUsers = await listProfiles();
          setUsers(nextUsers);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async () => {
          const nextOrders = await fetchAllOrders();
          const previouslyKnown = knownOrderIdsRef.current;
          const freshIds = previouslyKnown ? nextOrders.filter((o) => !previouslyKnown.has(o.id)).map((o) => o.id) : [];
          setOrders(nextOrders);
          knownOrderIdsRef.current = new Set(nextOrders.map((o) => o.id));
          if (freshIds.length > 0) {
            setNewOrderIds((prev) => new Set([...prev, ...freshIds]));
          }
          setNewOrdersBadge((n) => n + 1);
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authed]);

  // Belt-and-suspenders polling fallback alongside the realtime subscription
  // above — Supabase Realtime websockets can silently drop on long-lived
  // admin sessions (sleep/wake, flaky wifi, backgrounded tab) without an
  // obvious reconnect failure. This re-fetches every 20s so data never goes
  // stale for longer than that even if the socket died quietly — and it also
  // diffs against the last known order IDs to catch (badge + sound) any new
  // order the realtime socket missed, so an admin idle on another tab/app
  // still gets notified even if the websocket silently dropped.
  useEffect(() => {
    if (!authed) return;
    const timer = window.setInterval(async () => {
      const [nextOrders, nextUsers] = await Promise.all([fetchAllOrders(), listProfiles()]);
      setOrders(nextOrders);
      setUsers(nextUsers);
      if (knownOrderIdsRef.current) {
        const newOnes = nextOrders.filter((o) => !knownOrderIdsRef.current.has(o.id));
        if (newOnes.length > 0) {
          setNewOrdersBadge((n) => n + newOnes.length);
          setNewOrderIds((prev) => new Set([...prev, ...newOnes.map((o) => o.id)]));
          playNotificationSound();
        }
      }
      knownOrderIdsRef.current = new Set(nextOrders.map((o) => o.id));
    }, 20000);
    return () => window.clearInterval(timer);
  }, [authed]);

  // Favicon dot + "(N) " tab title prefix while there are unseen new orders
  // — mirrors the sidebar badge so it's visible even when the admin has
  // switched to a different browser tab.
  useEffect(() => {
    setFaviconBadge(newOrdersBadge > 0);
    setTitleBadge(newOrdersBadge);
  }, [newOrdersBadge]);

  // Live count, not a "new since last visit" badge like orders/users — a
  // product either is or isn't linked to Dolibarr right now.
  const unlinkedProductsBadge = useMemo(() => products.filter((p) => !p.dolibarr_id).length, [products]);

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
    const enteredEmail = loginForm.email.trim();
    const enteredPassword = loginForm.password;

    setLoginSubmitting(true);
    try {
      const profile = await signIn({
        email: enteredEmail,
        password: enteredPassword,
      });

      if (!isAdmin(profile?.role)) {
        await signOut();
        setLoginError("This account is not marked as admin.");
        return;
      }

      setLoginError("");
    } catch (error) {
      setLoginError(error.message || "Incorrect email or password.");
    } finally {
      setLoginSubmitting(false);
    }
  }

  async function toggleCategoryVisibility(value, nextVisible) {
    const previous = hiddenCategories;
    const nextCategories = nextVisible
      ? hiddenCategories.filter((item) => item !== value)
      : [...new Set([...hiddenCategories, value])];
    setHiddenCategories(nextCategories);
    try {
      await saveHiddenCategories(nextCategories);
      setToast("Category visibility updated.");
    } catch {
      setHiddenCategories(previous);
      setToast("Failed to update visibility.");
    }
  }

  async function toggleBrandsFilterVisibility(nextVisible) {
    const previous = showBrandsFilter;
    setShowBrandsFilter(nextVisible);
    try {
      await saveShowBrandsFilter(nextVisible);
      setToast("Brands filter visibility updated.");
    } catch {
      setShowBrandsFilter(previous);
      setToast("Failed to update visibility.");
    }
  }

  async function toggleSubcategoryVisibility(value, nextVisible) {
    const previous = hiddenSubcategories;
    const nextSubcategories = nextVisible
      ? hiddenSubcategories.filter((item) => item !== value)
      : [...new Set([...hiddenSubcategories, value])];
    setHiddenSubcategories(nextSubcategories);
    try {
      await saveHiddenSubcategories(nextSubcategories);
    } catch (err) {
      setHiddenSubcategories(previous);
      showAlert("Database Error: " + err.message);
    }
  }

  function updateCategorySelection(value, checked) {
    const parentMap = {
      "cardio": ["gym-equipment"],
      "treadmills": ["gym-equipment", "cardio"],
      "bikes": ["gym-equipment", "cardio"],
      "ellipticals": ["gym-equipment", "cardio"],
      "rowers": ["gym-equipment", "cardio"],
      "stairs": ["gym-equipment", "cardio"],
      "strength": ["gym-equipment"],
      "selectorized": ["gym-equipment", "strength"],
      "plate-loaded": ["gym-equipment", "strength"],
      "cable-motion": ["gym-equipment", "strength"],
      "multi-stations": ["gym-equipment", "strength"],
      "racks-benches": ["gym-equipment"],
      "racks": ["gym-equipment", "racks-benches"],
      "benches": ["gym-equipment", "racks-benches"],
      "bars-weights": ["gym-equipment"],
      "bars": ["gym-equipment", "bars-weights"],
      "weights": ["gym-equipment", "bars-weights"],
      "accessories": ["gym-equipment"],
      "boxing": ["gym-equipment"],
      "football": ["sports-tools"],
      "basketball": ["sports-tools"],
      "volleyball": ["sports-tools"],
      "indoor": ["sports-tools"],
      "other": ["sports-tools"],
      "training": ["sports-tools"],
      "sports-accessories": ["sports-tools"],
      "gloves": ["sports-tools"],
      "protector": ["sports-tools"],
      "socks": ["sports-tools", "sportswear"],
      "bags": ["sports-tools"],
      "caps": ["sports-tools", "sportswear"],
      "rackets": ["sports-tools"],
      "bottles": ["sports-tools"],
      "mens": ["sportswear"],
      "ladies": ["sportswear"],
      "kids": ["sportswear"],
      "tracksuit": ["sportswear"],
      "sports-set": ["sportswear"],
      "t-shirt": ["sportswear"],
      "polo-shirt": ["sportswear"],
      "pants": ["sportswear"],
      "shorts": ["sportswear"],
      "footwear": ["sportswear"],
      "running": ["sportswear", "footwear"],
      "futsal": ["sportswear", "footwear"],
      "protein": ["supplements"],
      "creatine": ["supplements"],
      "preworkout": ["supplements"],
      "vitamins": ["supplements"],
      "minerals": ["supplements"],
      "fatburner": ["supplements"],
      "gym-mats": ["flooring"],
      "sports-flooring": ["flooring"],
      "rubber": ["flooring"],
      "grass": ["flooring"],
      "vinyl": ["flooring"],
      "wood": ["flooring"],
      "indoor-flooring": ["flooring"],
      "outdoor-flooring": ["flooring"]
    };

    setProductForm((current) => {
      let nextCategories = new Set(current.categories);
      
      if (checked) {
        nextCategories.add(value);
        if (parentMap[value]) {
          parentMap[value].forEach(parent => nextCategories.add(parent));
        }
      } else {
        nextCategories.delete(value);
      }

      return {
        ...current,
        categories: Array.from(nextCategories),
      };
    });
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!productForm.categories.length) {
      showAlert("Please select at least one category.");
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
      slug: productForm.slug || productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
      category: productForm.categories[0],
      categories: productForm.categories,
      price: minVariationPrice ?? Number(productForm.price || 0),
      oldPrice: productForm.oldPrice === "" ? null : Number(productForm.oldPrice || 0) || null,
      stockStatus: productForm.stockStatus,
      stockCount: productForm.stockCount === "" ? null : Number(productForm.stockCount),
      rating: existingProduct?.rating ?? 5,
      reviews: existingProduct?.reviews ?? 0,
      badge: productForm.badge,
      img: productForm.cover,
      image: productForm.cover,
      imgHover: productForm.hover || productForm.cover,
      gallery: productForm.galleryText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      shortDesc: productForm.shortDesc,
      description: productForm.description,
      featured: productForm.featured,
      variations: normalizedVariations,
      attributes: attributes.filter((attribute) => attribute.name && attribute.values),
      cover: productForm.cover,
      brand: productForm.brand,
    };

    await runWithTransition(async () => {
      try {
        // Auto-upload any base64 images to Storage before saving to DB
        const uploadedImages = {};
        for (const field of ["img", "image", "imgHover", "cover"]) {
          if (typeof nextProduct[field] === "string" && nextProduct[field].startsWith("data:image/")) {
            const base64Str = nextProduct[field];
            if (!uploadedImages[base64Str]) {
              const blob = dataUrlToBlob(base64Str);
              const basePrefix = generateSeoPrefix(nextProduct) || (nextProduct.name || "product");
              const prefix = field.toLowerCase().includes("hover") ? `${basePrefix}-hover` : basePrefix;
              uploadedImages[base64Str] = await uploadBlobToStorage(blob, "webp", "products", prefix);
            }
            nextProduct[field] = uploadedImages[base64Str];
          }
        }

        if (Array.isArray(nextProduct.gallery)) {
          nextProduct.gallery = await Promise.all(nextProduct.gallery.map(async (item) => {
            if (typeof item === "string" && item.startsWith("data:image/")) {
              return uploadBlobToStorage(dataUrlToBlob(item), "webp", "products/gallery", nextProduct.name || "product");
            }
            return item;
          }));
        }

        if (Array.isArray(nextProduct.variations)) {
          nextProduct.variations = await Promise.all(nextProduct.variations.map(async (variation) => {
            if (typeof variation.img === "string" && variation.img.startsWith("data:image/")) {
              return {
                ...variation,
                img: await uploadBlobToStorage(dataUrlToBlob(variation.img), "webp", "products/variations", nextProduct.name || "product"),
              };
            }
            return variation;
          }));
        }

        const nextProducts = productForm.id
          ? products.map((product) => product.id === nextProduct.id ? { ...product, ...nextProduct } : product)
          : [...products, nextProduct];

        await persistProducts(nextProducts);
        resetEditor();
        setToast(productForm.id ? "Product updated successfully." : "Product added successfully.");
      } catch (err) {
        console.error(err);
        showAlert("Database Error: " + friendlyApiError(err));
      }
    });
  }

  function editProduct(id) {
    const product = products.find((item) => item.id === id);
    if (!product) {
      return;
    }
    setProductForm({
      id: String(product.id),
      name: product.name || "",
      slug: product.slug || "",
      price: String(product.price || ""),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
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
      brand: product.brand || "",
    });
    setVariations(product.variations || []);
    setAttributes(product.attributes?.length ? product.attributes : attributes);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteProduct(id) {
    if (!requireSuperAdmin("delete a product")) return;
    if (!(await showConfirm("Are you sure you want to delete this product?"))) {
      return;
    }
    await runWithTransition(async () => {
      try {
        const product = products.find((p) => p.id === id);
        await deleteProduct(id);
        if (product) {
          const variationImages = Array.isArray(product.variations) ? product.variations.map((v) => v.img) : [];
          await deleteStorageObjects([
            product.img, product.image, product.imgHover, product.cover,
            ...(product.gallery || []),
            ...variationImages,
          ]);
        }
        setToast("Product removed.");
      } catch (err) {
        console.error(err);
        showAlert("Database Error: " + friendlyApiError(err));
      }
    });
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

  async function handleAddSavedAttribute(attribute) {
    await runWithTransition(async () => {
      try {
        const next = [...attributes, attribute];
        await saveSavedAttributes(next);
        setAttributes(next);
        setToast("Attribute added.");
      } catch (err) {
        showAlert("Failed to add attribute: " + friendlyApiError(err));
      }
    });
  }

  async function handleUpdateSavedAttribute(index, patch) {
    await runWithTransition(async () => {
      try {
        const next = attributes.map((attribute, currentIndex) => currentIndex === index ? { ...attribute, ...patch } : attribute);
        await saveSavedAttributes(next);
        setAttributes(next);
        setToast("Attribute updated.");
      } catch (err) {
        showAlert("Failed to update attribute: " + friendlyApiError(err));
      }
    });
  }

  async function handleRemoveSavedAttribute(index) {
    await runWithTransition(async () => {
      try {
        const next = attributes.filter((_, currentIndex) => currentIndex !== index);
        await saveSavedAttributes(next);
        setAttributes(next);
        setToast("Attribute removed.");
      } catch (err) {
        showAlert("Failed to remove attribute: " + friendlyApiError(err));
      }
    });
  }

  function generateVariationsFromAttributes() {
    const activeAttributes = attributes.filter((attribute) => attribute.name && attribute.values);
    if (!activeAttributes.length) {
      showAlert("Add at least one attribute first.");
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
    await runWithTransition(async () => {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsText(file);
      });
      const rows = parseCsv(text);
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
    });
  }

  async function optimizeDatabase() {
    await runWithTransition(async () => {
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
        showAlert(`Image optimization failed: ${error.message}`);
      }
    });
  }

  async function migrateImagesAndSyncToSupabase() {
    await runWithTransition(async () => {
    try {
      const nextProducts = [];
      let migratedCount = 0;
      for (const product of products) {
        const nextProduct = { ...product };
        const prefix = generateSeoPrefix(nextProduct);
        const prefixCheck = prefix ? prefix.slice(0, -1) : "";

        async function processImage(url, folder) {
          if (!url) return url;
          if (typeof url === "string" && url.startsWith("data:image/")) {
            migratedCount += 1;
            return uploadBlobToStorage(dataUrlToBlob(url), "webp", folder, prefix);
          } else if (typeof url === "string" && url.startsWith("http")) {
            if (prefixCheck && !url.includes(prefixCheck)) {
              try {
                const newUrl = await renameStorageObject(url, "webp", folder, prefix);
                if (newUrl) {
                  migratedCount += 1;
                  return newUrl;
                }
              } catch (e) {
                console.error("Failed to migrate", url);
              }
            }
          }
          return url;
        }

        for (const field of ["img", "image", "imgHover", "cover"]) {
          nextProduct[field] = await processImage(nextProduct[field], "products");
        }

        if (Array.isArray(nextProduct.gallery)) {
          nextProduct.gallery = await Promise.all(nextProduct.gallery.map(item => processImage(item, "products/gallery")));
        }

        if (Array.isArray(nextProduct.variations)) {
          nextProduct.variations = await Promise.all(nextProduct.variations.map(async (variation) => {
            return {
              ...variation,
              img: await processImage(variation.img, "products/variations"),
            };
          }));
        }

        nextProducts.push(nextProduct);
      }

      await persistProducts(nextProducts);
      setToast(`Migrated ${migratedCount} images and synced products.`);
    } catch (error) {
      showAlert(`Image migration failed: ${error.message}`);
    }
    });
  }

  async function saveCoupon() {
    if (!couponForm.code || !couponForm.discount) {
      showAlert("Enter coupon code and discount.");
      return;
    }

    await runWithTransition(async () => {
      try {
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
      } catch (err) {
        showAlert("Failed to save coupon: " + friendlyApiError(err));
      }
    });
  }

  async function removeCoupon(code) {
    if (!requireSuperAdmin("delete a coupon")) return;
    await runWithTransition(async () => {
      const nextCoupons = await deleteCoupon(code);
      setCoupons(nextCoupons);
      setToast("Coupon deleted.");
    });
  }

  async function refreshOrders() {
    const [nextOrders, nextUsers] = await Promise.all([fetchAllOrders(), listProfiles()]);
    setOrders(nextOrders);
    setUsers(nextUsers);
  }

  async function changeOrderStatus(orderId, status) {
    await runWithTransition(async () => {
      try {
        await updateOrderStatus(orderId, status);
        const nextOrders = await fetchAllOrders();
        setOrders(nextOrders);
        setToast("Order status updated.");
      } catch (err) {
        showAlert("Failed to update order status: " + friendlyApiError(err));
      }
    });
  }

  async function handleDeleteOrder(orderId) {
    if (!requireSuperAdmin("delete an order")) return;
    await runWithTransition(async () => {
      try {
        const nextOrders = await deleteOrder(orderId);
        setOrders(nextOrders);
        setToast("Order deleted.");
      } catch (err) {
        showAlert("Failed to delete order: " + friendlyApiError(err));
      }
    });
  }

  async function handleDeleteUser(userToDelete) {
    if (!requireSuperAdmin("delete a customer account")) return;
    await runWithTransition(async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session?.access_token) {
          throw new Error("Your admin session has expired — please log in again.");
        }
        await deleteUserAccount(userToDelete.id, data.session.access_token);
        const nextUsers = await listProfiles();
        setUsers(nextUsers);
        setToast(`Deleted account for ${userToDelete.email}.`);
      } catch (err) {
        showAlert("Failed to delete account: " + friendlyApiError(err));
      }
    });
  }

  async function requireAccessToken() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.access_token) {
      throw new Error("Your admin session has expired — please log in again.");
    }
    return data.session.access_token;
  }

  async function handlePromoteAdmin(user) {
    await runWithTransition(async () => {
      try {
        const token = await requireAccessToken();
        await updateAdminRole(user.id, "admin", token);
        await Promise.all([refreshAdmins(), listProfiles().then(setUsers)]);
        setToast(`${user.email} is now an admin.`);
      } catch (err) {
        showAlert("Failed to promote account: " + friendlyApiError(err));
      }
    });
  }

  async function handleDemoteAdmin(admin) {
    await runWithTransition(async () => {
      try {
        const token = await requireAccessToken();
        await updateAdminRole(admin.id, "customer", token);
        await Promise.all([refreshAdmins(), listProfiles().then(setUsers)]);
        setToast(`${admin.email} is no longer an admin.`);
      } catch (err) {
        showAlert("Failed to demote account: " + friendlyApiError(err));
      }
    });
  }

  async function handleDeleteAdmin(admin) {
    await runWithTransition(async () => {
      try {
        const token = await requireAccessToken();
        await deleteUserAccount(admin.id, token);
        await Promise.all([refreshAdmins(), listProfiles().then(setUsers)]);
        setToast(`Deleted admin account for ${admin.email}.`);
      } catch (err) {
        showAlert("Failed to delete account: " + friendlyApiError(err));
      }
    });
  }

  async function handleCreateAdmin(payload) {
    await runWithTransition(async () => {
      try {
        const token = await requireAccessToken();
        await createAdmin(payload, token);
        await Promise.all([refreshAdmins(), listProfiles().then(setUsers)]);
        setToast(`Created ${payload.role} account for ${payload.email}.`);
      } catch (err) {
        showAlert("Failed to create account: " + friendlyApiError(err));
      }
    });
  }

  async function updateProductStock(id, status, count, { silent = false } = {}) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const payload = { ...product, stockStatus: status, stockCount: count };
    await setProducts(await upsertProducts([payload]));
    if (!silent) setToast("Stock updated.");
  }

  // Pulls live Dolibarr stock for every linked product, concurrency-capped
  // so a big catalog doesn't fire hundreds of requests at once (same
  // pattern as AdminProductMapping's bulk import). Used by the dashboard's
  // "Synchronize Stocks" quick action, which shows the loader for the
  // whole run rather than the fixed minimum — see runWithTransition below.
  async function syncAllStockFromDolibarr() {
    const linked = products.filter(p => p.dolibarr_id);
    const CONCURRENCY = 4;
    let cursor = 0;
    async function worker() {
      while (cursor < linked.length) {
        const p = linked[cursor++];
        try {
          const result = await getLiveStock(p.id, p.dolibarr_id);
          if (result.stock_status !== p.stockStatus || result.stock_count !== p.stockCount) {
            await updateProductStock(p.id, result.stock_status, result.stock_count, { silent: true });
          }
        } catch (err) {
          console.error("Failed to sync stock for product", p.id, err);
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, linked.length) }, worker));
  }

  async function handleAddBrand(e) {
    e.preventDefault();
    if (!newBrand.trim()) return;
    const nextBrand = { name: newBrand.trim(), category: newBrandCategory };

    if (editingBrand) {
      const filtered = brands.filter(b => !(b.name === editingBrand.name && b.category === editingBrand.category));
      if (filtered.some(b => (b.name || b) === nextBrand.name && b.category === nextBrand.category)) {
        setToast("Brand already assigned to this category.");
        return;
      }
      await runWithTransition(async () => {
        try {
          const next = [...filtered, nextBrand];
          await saveBrands(next);
          setBrands(next);
          setNewBrand("");
          setEditingBrand(null);
          setToast("Brand updated.");
        } catch (err) {
          showAlert("Failed to update brand: " + friendlyApiError(err));
        }
      });
      return;
    }

    // Check if exactly this combination already exists
    if (brands.some(b => (b.name || b) === nextBrand.name && b.category === nextBrand.category)) {
      setToast("Brand already assigned to this category.");
      return;
    }
    await runWithTransition(async () => {
      try {
        const next = [...brands, nextBrand];
        await saveBrands(next);
        setBrands(next);
        setNewBrand("");
        setToast("Brand added.");
      } catch (err) {
        showAlert("Failed to add brand: " + friendlyApiError(err));
      }
    });
  }

  function handleEditBrand(brand) {
    setEditingBrand(brand);
    setNewBrand(brand.name);
    setNewBrandCategory(brand.category || "gym-equipment");
  }
  
  async function handleRemoveBrand(brandToRemove) {
    if (!requireSuperAdmin("delete a brand")) return;
    if (!(await showConfirm("Delete this brand?"))) return;
    await runWithTransition(async () => {
      const previous = brands;
      // brandToRemove is now an object { name, category }
      const next = brands.filter(b => b !== brandToRemove && !(b.name === brandToRemove.name && b.category === brandToRemove.category));
      setBrands(next);
      try {
        await saveBrands(next);
        setToast("Brand removed.");
      } catch (err) {
        setBrands(previous);
        showAlert("Database Error: " + err.message);
      }
    });
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await runWithTransition(async () => {
      try {
        const next = [...new Set([...customCategories, newCategory.trim()])];
        await saveCustomCategories(next);
        setCustomCategories(next);
        setNewCategory("");
        setToast("Category added.");
      } catch (err) {
        showAlert("Failed to add category: " + friendlyApiError(err));
      }
    });
  }

  async function handleRemoveCategory(catToRemove) {
    if (!requireSuperAdmin("delete a category")) return;
    if (!(await showConfirm("Delete this category?"))) return;
    await runWithTransition(async () => {
      const previous = customCategories;
      const next = customCategories.filter(c => c !== catToRemove);
      setCustomCategories(next);
      try {
        await saveCustomCategories(next);
        setToast("Category removed.");
      } catch (err) {
        setCustomCategories(previous);
        showAlert("Database Error: " + err.message);
      }
    });
  }
  async function handleRemoveClient(indexToRemove) {
    if (!requireSuperAdmin("delete a client")) return;
    if (!(await showConfirm("Delete this client?"))) return;
    await runWithTransition(async () => {
      const removed = clients[indexToRemove];
      const next = clients.filter((_, i) => i !== indexToRemove);
      try {
        await saveClients(next);
        setClients(next);
        if (removed) await deleteStorageObject(removed.image);
        setToast("Client removed.");
      } catch (err) {
        showAlert("Error removing client: " + friendlyApiError(err));
      }
    });
  }

  async function handleRemovePartner(indexToRemove) {
    if (!requireSuperAdmin("delete a partner")) return;
    if (!(await showConfirm("Delete this partner?"))) return;
    await runWithTransition(async () => {
      const removed = partners[indexToRemove];
      const next = partners.filter((_, i) => i !== indexToRemove);
      try {
        await savePartners(next);
        setPartners(next);
        if (removed) await deleteStorageObject(removed.image);
        setToast("Partner removed.");
      } catch (err) {
        showAlert("Error removing partner: " + friendlyApiError(err));
      }
    });
  }

  async function handleSaveBlog(blogForm, imageFile) {
    if (!blogForm.title || !blogForm.content) {
      showAlert("Title and content are required.");
      return;
    }
    await runWithTransition(async () => {
      try {
        let imageUrl = blogForm.image;
        if (imageFile) {
          imageUrl = await uploadBlobToStorage(imageFile, "webp", "blogs");
        }

        const newBlog = {
          id: blogForm.id || Date.now().toString(),
          title: blogForm.title,
          image: imageUrl || "",
          content: blogForm.content,
          author: blogForm.author || currentUser?.email || "Admin",
          date: blogForm.date || new Date().toISOString()
        };

        let next;
        if (blogForm.id) {
          next = blogs.map(b => b.id === blogForm.id ? newBlog : b);
        } else {
          next = [newBlog, ...blogs];
        }

        await saveBlogs(next);
        setBlogs(next);
        setToast(blogForm.id ? "Blog updated." : "Blog published.");
      } catch (err) {
        showAlert("Error saving blog: " + friendlyApiError(err));
      }
    });
  }

  async function handleRemoveBlog(idToRemove) {
    if (!requireSuperAdmin("delete a blog post")) return;
    if (!(await showConfirm("Delete this blog post?"))) return;
    await runWithTransition(async () => {
      const removed = blogs.find(b => b.id === idToRemove);
      const next = blogs.filter(b => b.id !== idToRemove);
      try {
        await saveBlogs(next);
        setBlogs(next);
        if (removed) await deleteStorageObject(removed.image);
        setToast("Blog removed.");
      } catch (err) {
        showAlert("Error removing blog: " + friendlyApiError(err));
      }
    });
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a1f2e 0%, #0f172a 100%)", fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Background pattern */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 30%, rgba(230,57,70,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(230,57,70,0.06) 0%, transparent 50%)", pointerEvents: "none" }} />
        <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", padding: "0 24px", position: "relative" }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img src="/logo.png" alt="Sports Way" style={{ height: 48, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", display: "inline-block" }} />
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 36, backdropFilter: "blur(12px)", boxShadow: "0 32px 64px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #e63946, #c1121f)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>Admin Access</div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 20, marginTop: 4 }}>Restricted area — Sports Way staff only</p>
          <form onSubmit={handleAdminLogin} style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>Email</span>
              <input type="text" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} autoFocus style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }} />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>Password</span>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} style={{ width: "100%", paddingRight: "40px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", paddingRight: 40, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#888",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </label>
            <button type="submit" disabled={loginSubmitting} style={{ width: "100%", padding: "12px", background: loginSubmitting ? "rgba(230,57,70,0.5)" : "#e63946", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loginSubmitting ? "not-allowed" : "pointer", marginTop: 4 }}>
              {loginSubmitting ? "Checking..." : "Unlock Dashboard →"}
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await requestPasswordReset(loginForm.email.trim());
                  setLoginError("Password reset email sent.");
                } catch (error) {
                  setLoginError(error.message || "Unable to send reset email.");
                }
              }}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", width: "100%" }}
            >
              Forgot password?
            </button>
          </form>
          {loginError ? (
            <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: 10, color: "#ff8a94", fontSize: 13 }}>
              {loginError}
            </div>
          ) : null}
          </div>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 20 }}>
            Admin accounts are provisioned by a superadmin — there is no self-signup here.
          </p>
        </div>
        <BrandLoader visible={loginSubmitting} />
      </div>
    );
  }

  return (
    <AdminShell
      section={section}
      onNavigate={goTo}
      pageTransitioning={pageTransitioning}
      currentUser={currentUser}
      signOut={() => runWithTransition(signOut)}
      undoLastChange={undoLastChange}
      isSuperAdmin={isSuperAdmin(currentUser?.role)}
      newOrdersBadge={newOrdersBadge}
      newUsersBadge={newUsersBadge}
      unlinkedProductsBadge={unlinkedProductsBadge}
      toast={toast}
    >
        {section === "dashboard" ? (
          <AdminDashboard
            orders={orders}
            users={users}
            products={products}
            onNavigate={goTo}
            onSyncStocks={() => runWithTransition(syncAllStockFromDolibarr, "stocks")}
            onViewOrder={(orderId) => { setOrderIdToOpen(orderId); goTo("orders"); }}
          />
        ) : null}

        {section === "visibility" ? (
          <AdminVisibility
            hiddenCategories={hiddenCategories}
            setHiddenCategories={setHiddenCategories}
            hiddenSubcategories={hiddenSubcategories}
            setHiddenSubcategories={setHiddenSubcategories}
            showBrandsFilter={showBrandsFilter}
            setShowBrandsFilter={setShowBrandsFilter}
            customCategories={customCategories}
            saving={savingVisibility}
            onSave={async () => {
              setSavingVisibility(true);
              await runWithTransition(async () => {
                try {
                  await saveHiddenCategories(hiddenCategories);
                  await saveHiddenSubcategories(hiddenSubcategories);
                  await saveShowBrandsFilter(showBrandsFilter);
                  setToast('Visibility settings saved.');
                } catch (err) {
                  showAlert('Failed to save visibility settings: ' + friendlyApiError(err));
                }
              });
              setSavingVisibility(false);
            }}
          />
        ) : null}

        {section === "products" ? (
          <>
            {/* Full-page view */}
            {productMode === "view" && productPageData && (
              <AdminProductView
                product={productPageData}
                onBack={() => setProductMode("list")}
                onEdit={(p) => { setProductPageData(p); setProductMode("edit"); }}
                onDelete={(id) => { handleDeleteProduct(id); setProductMode("list"); setProductPageData(null); }}
              />
            )}

            {/* Full-page edit / add */}
            {productMode === "edit" && (
              <AdminProductEdit
                product={productPageData}
                brands={brands}
                customCategories={customCategories}
                savedAttributes={attributes}
                uploadImage={async (file, field) => {
                  const prefix = generateSeoPrefix({ name: productPageData?.name || "product", categories: [], brand: "" });
                  const blob = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(new Blob([Uint8Array.from(atob(r.result.split(",")[1]), c => c.charCodeAt(0))], { type: file.type })); r.readAsDataURL(file); });
                  return uploadBlobToStorage(blob, file.name.split(".").pop(), "products", prefix);
                }}
                onSave={async (product) => {
                  const existing = products.find((p) => p.id === product.id);
                  const payload = existing ? { ...existing, ...product } : { ...product, id: Date.now() };
                  const { upsertProducts } = await import("../lib/storefrontApi");
                  await setProducts(await upsertProducts([payload]));
                  setToast(existing ? "Product updated!" : "Product added!");
                  setProductMode("list");
                  setProductPageData(null);
                }}
                onCancel={() => { setProductMode("list"); setProductPageData(null); }}
              />
            )}

            {/* Product list */}
            {productMode === "list" && (
              <AdminProducts
                products={products}
                onAddNew={() => { setProductPageData(null); setProductMode("edit"); }}
                onView={(product) => { setProductPageData(product); setProductMode("view"); }}
                onEdit={(product) => { setProductPageData(product); setProductMode("edit"); }}
                onDelete={handleDeleteProduct}
                onOptimize={optimizeDatabase}
                onRenameImages={migrateImagesAndSyncToSupabase}
                onImportCsv={importCsv}
              />
            )}
          </>
        ) : null}

        {section === "orders" ? (
          <AdminOrders
            orders={orders}
            onStatusChange={changeOrderStatus}
            onRefresh={refreshOrders}
            onDelete={handleDeleteOrder}
            canDelete={isSuperAdmin(currentUser?.role)}
            getAccessToken={requireAccessToken}
            openOrderId={orderIdToOpen}
            onOpenOrderHandled={() => setOrderIdToOpen(null)}
            newOrderIds={newOrderIds}
            onOrderSeen={markOrderSeen}
          />
        ) : null}

        {section === "users" ? (
          <AdminUsers
            users={users}
            userOrderCounts={userOrderCounts}
            onDelete={handleDeleteUser}
            canDelete={isSuperAdmin(currentUser?.role)}
          />
        ) : null}

        {section === "manage_admins" && isSuperAdmin(currentUser?.role) ? (
          <AdminManageAdmins
            admins={admins}
            users={users}
            currentUser={currentUser}
            onPromote={handlePromoteAdmin}
            onDemote={handleDemoteAdmin}
            onDelete={handleDeleteAdmin}
            onCreate={handleCreateAdmin}
          />
        ) : null}

        {section === "coupons" ? (
          <AdminCoupons
            coupons={coupons}
            onSave={saveCoupon}
            onDelete={removeCoupon}
          />
        ) : null}

        {(section === "taxonomy" || section === "catalog") ? (
          <AdminCatalog
            brands={brands}
            customCategories={customCategories}
            onBrandAdd={async (b) => {
              if (!b.name?.trim()) return;
              await runWithTransition(async () => {
                try {
                  const next = [...brands, { name: b.name.trim(), category: b.category || "gym-equipment" }];
                  await saveBrands(next);
                  setBrands(next);
                  setToast("Brand added.");
                } catch (err) {
                  showAlert("Failed to add brand: " + friendlyApiError(err));
                }
              });
            }}
            onBrandRemove={handleRemoveBrand}
            onCategoryAdd={async (c) => {
              if (!c?.trim()) return;
              await runWithTransition(async () => {
                try {
                  const next = [...new Set([...customCategories, c.trim()])];
                  await saveCustomCategories(next);
                  setCustomCategories(next);
                  setToast("Category added.");
                } catch (err) {
                  showAlert("Failed to add category: " + friendlyApiError(err));
                }
              });
            }}
            onCategoryRemove={handleRemoveCategory}
          />
        ) : null}

        {section === "stocks" ? (
          <AdminStocks
            products={products}
            onUpdateStock={updateProductStock}
            onOpenProduct={(product) => {
              setSection("products");
              setProductPageData(product);
              setProductMode("edit");
            }}
          />
        ) : null}

        {section === "categories" ? (
          <AdminCategories
            products={products}
            customCategories={customCategories}
            onCategoryAdd={async (c) => {
              if (!c?.trim()) return;
              await runWithTransition(async () => {
                try {
                  const next = [...new Set([...customCategories, c.trim()])];
                  await saveCustomCategories(next);
                  setCustomCategories(next);
                  setToast("Category added.");
                } catch (err) {
                  showAlert("Failed to add category: " + friendlyApiError(err));
                }
              });
            }}
            onCategoryRemove={handleRemoveCategory}
          />
        ) : null}

        {section === "brands" ? (
          <AdminBrands
            products={products}
            brands={brands}
            onBrandAdd={async (b) => {
              if (!b.name?.trim()) return;
              await runWithTransition(async () => {
                try {
                  const next = [...brands, { name: b.name.trim(), category: b.category || "gym-equipment" }];
                  await saveBrands(next);
                  setBrands(next);
                  setToast("Brand added.");
                } catch (err) {
                  showAlert("Failed to add brand: " + friendlyApiError(err));
                }
              });
            }}
            onBrandRemove={handleRemoveBrand}
          />
        ) : null}

        {section === "attributes" ? (
          <AdminAttributes
            products={products}
            attributes={attributes}
            onAdd={handleAddSavedAttribute}
            onUpdate={handleUpdateSavedAttribute}
            onRemove={handleRemoveSavedAttribute}
          />
        ) : null}

        {section === "product_mapping" ? (
          <AdminProductMapping
            products={products}
            onImportFromDolibarr={async (newProduct) => {
              const { upsertProducts } = await import("../lib/storefrontApi");
              await setProducts(await upsertProducts([newProduct]));
              setToast(`Imported "${newProduct.name}" from Dolibarr.`);
            }}
            onImportManyFromDolibarr={async (newProducts) => {
              const { upsertProducts } = await import("../lib/storefrontApi");
              await setProducts(await upsertProducts(newProducts));
              setToast(`Imported ${newProducts.length} products from Dolibarr.`);
            }}
            onLinkProduct={async (siteProduct, doliProduct) => {
              const payload = {
                ...siteProduct,
                dolibarr_id: doliProduct.dolibarr_id,
                dolibarr_ref: doliProduct.ref,
                stockStatus: doliProduct.stock_status,
                stockCount: doliProduct.stock_status === "instock" ? doliProduct.stock_count : 0,
              };
              const { upsertProducts } = await import("../lib/storefrontApi");
              await setProducts(await upsertProducts([payload]));
              setToast(`Linked "${siteProduct.name}" to Dolibarr ref ${doliProduct.ref}.`);
            }}
            onOpenProduct={(product) => {
              setSection("products");
              setProductPageData(product);
              setProductMode("edit");
            }}
          />
        ) : null}

        {section === "clients_partners" ? (
          <AdminContent
            clients={clients}
            onAddClient={async (name, file) => {
              await runWithTransition(async () => {
                try {
                  const url = await uploadBlobToStorage(file, file.name.split('.').pop(), 'clients', name || 'client');
                  const next = [...clients, { name, image: url }];
                  await saveClients(next);
                  setClients(next);
                  setToast('Client added.');
                } catch (err) {
                  showAlert("Failed to add client: " + friendlyApiError(err));
                }
              });
            }}
            onRemoveClient={handleRemoveClient}
            partners={partners}
            onAddPartner={async (name, file) => {
              await runWithTransition(async () => {
                try {
                  const url = await uploadBlobToStorage(file, file.name.split('.').pop(), 'partners', name || 'partner');
                  const next = [...partners, { name, image: url }];
                  await savePartners(next);
                  setPartners(next);
                  setToast('Partner added.');
                } catch (err) {
                  showAlert("Failed to add partner: " + friendlyApiError(err));
                }
              });
            }}
            onRemovePartner={handleRemovePartner}
          />
        ) : null}

        {section === "blogs" && blogMode === "list" && (
          <AdminBlogList
            blogs={blogs}
            onAddNew={() => { setBlogPageData(null); setBlogMode("edit"); }}
            onView={(post) => { setBlogPageData(post); setBlogMode("view"); }}
            onEdit={(post) => { setBlogPageData(post); setBlogMode("edit"); }}
            onDelete={handleRemoveBlog}
          />
        )}

        {section === "blogs" && blogMode === "view" && (
          <AdminBlogView
            post={blogPageData}
            onBack={() => { setBlogMode("list"); setBlogPageData(null); }}
            onEdit={(post) => { setBlogPageData(post); setBlogMode("edit"); }}
          />
        )}

        {section === "blogs" && blogMode === "edit" && (
          <AdminBlogEditor
            post={blogPageData}
            currentUser={currentUser}
            onCancel={() => { setBlogMode("list"); setBlogPageData(null); }}
            onSave={async (form, imageFile) => {
              await handleSaveBlog(form, imageFile);
              setBlogMode("list");
              setBlogPageData(null);
            }}
          />
        )}
    </AdminShell>
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

