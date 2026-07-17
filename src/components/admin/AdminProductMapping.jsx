import { useState, useEffect, useMemo } from "react";
import { formatPrice } from "../../lib/format";
import { showAlert } from "../../lib/dialog.jsx";
import { AdminHero } from "./AdminHero";
import {
  FASTAPI_URL,
  listAllDolibarrProducts,
  getDolibarrProductPhotoCount,
  fetchDolibarrProductPhotoBlob,
} from "../../lib/fastapiClient";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function stockCountFromStatus(status, count) {
  return status === "instock" ? count : 0;
}

// Runs `worker` over `items` with at most `limit` in flight at once, so a
// bulk import of hundreds of products doesn't fire hundreds of parallel
// requests at FastAPI/Supabase at the same time.
async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runNext() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runNext));
  return results;
}

const STOCK_META = {
  instock:     { label: "In Stock",     bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  outofstock:  { label: "Out of Stock", bg: "bg-red-50",     text: "text-red-600",     ring: "ring-red-200"     },
  onbackorder: { label: "Backorder",    bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200"   },
};

function Spinner({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function StockPill({ status }) {
  const s = STOCK_META[status] || STOCK_META.instock;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      {s.label}
    </span>
  );
}

function DolibarrThumb({ dolibarrId, label, className }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`${className} bg-slate-100 flex items-center justify-center text-slate-300 flex-shrink-0`}>
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      </div>
    );
  }
  return (
    <img
      src={`${FASTAPI_URL}/products/${dolibarrId}/photo?index=0`}
      alt={label}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} object-cover border border-slate-100 flex-shrink-0 bg-slate-50`}
    />
  );
}

function PageSizeSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 px-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-400 transition-colors cursor-pointer flex-shrink-0"
    >
      {PAGE_SIZE_OPTIONS.map((n) => (
        <option key={n} value={n}>{n} / page</option>
      ))}
    </select>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const visible = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  return (
    <div className="flex items-center justify-center gap-1 px-5 py-3 border-t border-slate-100 bg-slate-50/60">
      <button
        type="button"
        style={{ cursor: page <= 1 ? "not-allowed" : "pointer" }}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="h-7 px-2.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors"
      >
        Prev
      </button>
      {visible.map((p, i, arr) => (
        <span key={p} className="flex items-center">
          {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-xs text-slate-300">…</span>}
          <button
            type="button"
            style={{ cursor: "pointer" }}
            onClick={() => onChange(p)}
            className={`h-7 min-w-[28px] px-2 text-xs font-bold rounded-lg border transition-colors ${
              p === page ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        type="button"
        style={{ cursor: page >= totalPages ? "not-allowed" : "pointer" }}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="h-7 px-2.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors"
      >
        Next
      </button>
    </div>
  );
}

function FilterToggle({ value, onChange, unlinkedLabel = "Unlinked" }) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg flex-shrink-0">
      {[["all", "All"], ["unlinked", unlinkedLabel]].map(([key, label]) => (
        <button
          key={key}
          type="button"
          style={{ cursor: "pointer" }}
          onClick={() => onChange(key)}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
            value === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function AdminProductMapping({ products, onImportFromDolibarr, onImportManyFromDolibarr, onLinkProduct, onOpenProduct }) {
  const [dolibarrProducts, setDolibarrProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [siteSearch, setSiteSearch] = useState("");
  const [doliSearch, setDoliSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("all");
  const [doliFilter, setDoliFilter] = useState("all");
  const [sitePage, setSitePage] = useState(1);
  const [doliPage, setDoliPage] = useState(1);
  const [sitePageSize, setSitePageSize] = useState(50);
  const [doliPageSize, setDoliPageSize] = useState(50);
  const [importingId, setImportingId] = useState(null);
  const [linking, setLinking] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [selectedDoliId, setSelectedDoliId] = useState(null);
  const [checkedDoliIds, setCheckedDoliIds] = useState(() => new Set());
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null); // { done, total }

  useEffect(() => {
    let active = true;
    setLoading(true);
    listAllDolibarrProducts()
      .then((rows) => { if (active) setDolibarrProducts(rows); })
      .catch((err) => { if (active) setError(err.message || String(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const dolibarrById = useMemo(
    () => Object.fromEntries(dolibarrProducts.map((d) => [d.dolibarr_id, d])),
    [dolibarrProducts]
  );

  const linkedSiteIds = useMemo(
    () => new Set(products.filter((p) => p.dolibarr_id).map((p) => p.id)),
    [products]
  );

  const linkedDolibarrIds = useMemo(
    () => new Set(products.filter((p) => p.dolibarr_id).map((p) => p.dolibarr_id)),
    [products]
  );

  const filteredSiteProducts = useMemo(() => {
    let list = products;
    if (siteFilter === "unlinked") list = list.filter((p) => !p.dolibarr_id);
    if (siteSearch.trim()) {
      const q = siteSearch.toLowerCase();
      list = list.filter((p) => p.name?.toLowerCase().includes(q) || String(p.id).includes(q));
    }
    return [...list].sort((a, b) => Number(linkedSiteIds.has(a.id)) - Number(linkedSiteIds.has(b.id)));
  }, [products, siteSearch, siteFilter, linkedSiteIds]);

  const filteredDolibarrProducts = useMemo(() => {
    let list = dolibarrProducts;
    if (doliFilter === "unlinked") list = list.filter((d) => !linkedDolibarrIds.has(d.dolibarr_id));
    if (doliSearch.trim()) {
      const q = doliSearch.toLowerCase();
      list = list.filter((d) => d.ref.toLowerCase().includes(q) || d.label.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => Number(linkedDolibarrIds.has(a.dolibarr_id)) - Number(linkedDolibarrIds.has(b.dolibarr_id)));
  }, [dolibarrProducts, doliSearch, doliFilter, linkedDolibarrIds]);

  // Reset pagination whenever the underlying filtered set changes shape, so
  // a stale page number doesn't leave the list looking cut off or empty.
  useEffect(() => { setSitePage(1); }, [siteSearch, siteFilter, sitePageSize]);
  useEffect(() => { setDoliPage(1); }, [doliSearch, doliFilter, doliPageSize]);

  // Pagination is skipped entirely while searching — search results are
  // usually a short, already-filtered list, so slicing them further just
  // hides matches instead of helping performance.
  const isSiteSearching = siteSearch.trim().length > 0;
  const isDoliSearching = doliSearch.trim().length > 0;

  const siteTotalPages = Math.max(1, Math.ceil(filteredSiteProducts.length / sitePageSize));
  const doliTotalPages = Math.max(1, Math.ceil(filteredDolibarrProducts.length / doliPageSize));

  const visibleSiteProducts = isSiteSearching
    ? filteredSiteProducts
    : filteredSiteProducts.slice((sitePage - 1) * sitePageSize, sitePage * sitePageSize);
  const visibleDolibarrProducts = isDoliSearching
    ? filteredDolibarrProducts
    : filteredDolibarrProducts.slice((doliPage - 1) * doliPageSize, doliPage * doliPageSize);

  const mappedRows = useMemo(
    () => products.filter((p) => p.dolibarr_id).sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [products]
  );

  const selectedSiteProduct = products.find((p) => p.id === selectedSiteId) || null;
  const selectedDoliProduct = dolibarrById[selectedDoliId] || null;

  // "Select all" only ever covers what's actually on screen (the current
  // page, or all search matches when pagination is off) — never the full
  // filtered set across every page, so it can't silently queue up hundreds
  // of imports the admin never saw.
  const selectablePageUnlinkedIds = useMemo(
    () => visibleDolibarrProducts.filter((d) => !linkedDolibarrIds.has(d.dolibarr_id)).map((d) => d.dolibarr_id),
    [visibleDolibarrProducts, linkedDolibarrIds]
  );
  const allPageChecked = selectablePageUnlinkedIds.length > 0 && selectablePageUnlinkedIds.every((id) => checkedDoliIds.has(id));

  function toggleSiteSelect(p) {
    setSelectedSiteId((current) => (current === p.id ? null : p.id));
  }

  function toggleDoliSelect(d) {
    setSelectedDoliId((current) => (current === d.dolibarr_id ? null : d.dolibarr_id));
  }

  function toggleDoliCheck(id) {
    setCheckedDoliIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setCheckedDoliIds((current) => {
      if (allPageChecked) {
        const next = new Set(current);
        selectablePageUnlinkedIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...current, ...selectablePageUnlinkedIds]);
    });
  }

  async function confirmLink() {
    if (!selectedSiteProduct || !selectedDoliProduct) return;
    setLinking(true);
    try {
      await onLinkProduct(selectedSiteProduct, selectedDoliProduct);
      setSelectedSiteId(null);
      setSelectedDoliId(null);
    } catch (err) {
      showAlert("Link failed: " + (err.message || String(err)));
    } finally {
      setLinking(false);
    }
  }

  async function buildProductFromDolibarr(d, uploadBlobToStorage) {
    const { count } = await getDolibarrProductPhotoCount(d.dolibarr_id);
    const prefix = slugify(d.label || d.ref) || `dolibarr-${d.dolibarr_id}`;
    const uploadedUrls = [];
    for (let i = 0; i < count; i++) {
      const blob = await fetchDolibarrProductPhotoBlob(d.dolibarr_id, i);
      const ext = blob.type?.split("/")[1] || "jpg";
      const folder = i === 0 ? "products" : "products/gallery";
      uploadedUrls.push(await uploadBlobToStorage(blob, ext, folder, prefix));
    }
    const cover = uploadedUrls[0] || "";
    const baseSlug = slugify(d.label) || "product";
    return {
      id: Date.now() + Math.floor(Math.random() * 10000),
      name: d.label,
      // Suffixed with the Dolibarr id so two products sharing a label (e.g.
      // "ONE YEAR AMC - ...") never collide on products_slug_key.
      slug: `${baseSlug}-${d.dolibarr_id}`,
      category: "",
      categories: [],
      price: d.price || 0,
      stockStatus: d.stock_status,
      stockCount: stockCountFromStatus(d.stock_status, d.stock_count),
      badge: "",
      img: cover,
      image: cover,
      imgHover: "",
      cover,
      gallery: uploadedUrls.slice(1),
      shortDesc: "",
      description: d.description || "",
      featured: false,
      rating: 5,
      reviews: 0,
      variations: [],
      attributes: [],
      brand: "",
      dolibarr_id: d.dolibarr_id,
      dolibarr_ref: d.ref,
    };
  }

  async function importProduct(d) {
    setImportingId(d.dolibarr_id);
    try {
      const { uploadBlobToStorage } = await import("../../lib/storefrontApi");
      const newProduct = await buildProductFromDolibarr(d, uploadBlobToStorage);
      await onImportFromDolibarr(newProduct);
    } catch (err) {
      showAlert("Import failed: " + (err.message || String(err)));
    } finally {
      setImportingId(null);
    }
  }

  async function importCheckedProducts() {
    const targets = dolibarrProducts.filter((d) => checkedDoliIds.has(d.dolibarr_id) && !linkedDolibarrIds.has(d.dolibarr_id));
    if (!targets.length) return;
    setBulkImporting(true);
    setBulkProgress({ done: 0, total: targets.length });
    try {
      const { uploadBlobToStorage } = await import("../../lib/storefrontApi");
      let done = 0;
      const rows = await runWithConcurrency(targets, 4, async (d) => {
        const row = await buildProductFromDolibarr(d, uploadBlobToStorage);
        done += 1;
        setBulkProgress({ done, total: targets.length });
        return row;
      });
      await onImportManyFromDolibarr(rows);
      setCheckedDoliIds(new Set());
    } catch (err) {
      showAlert("Bulk import failed: " + (err.message || String(err)));
    } finally {
      setBulkImporting(false);
      setBulkProgress(null);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
        title="Product Mapping"
        subtitle="Select a website product and a Dolibarr product to link them, or import Dolibarr products straight onto the website — one at a time or in bulk."
      />

      {/* Bulk-import bar — sits at the top so it's visible as soon as you start checking boxes */}
      {checkedDoliIds.size > 0 && (
        <div className="bg-brand-700 text-white rounded-2xl shadow-lg px-5 py-3.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-semibold flex-1 min-w-0 flex items-center gap-2">
              {bulkImporting && <Spinner />}
              {bulkProgress ? `Importing ${bulkProgress.done}/${bulkProgress.total}…` : `${checkedDoliIds.size} Dolibarr product${checkedDoliIds.size > 1 ? "s" : ""} selected`}
            </span>
            <button
              type="button"
              style={{ cursor: "pointer" }}
              onClick={importCheckedProducts}
              disabled={bulkImporting}
              className="flex-shrink-0 px-4 py-2 text-xs font-bold rounded-xl bg-white text-brand-700 hover:bg-brand-50 disabled:opacity-50 transition-colors"
            >
              {bulkImporting ? "Importing…" : `Create ${checkedDoliIds.size} on Website`}
            </button>
            <button
              type="button"
              style={{ cursor: "pointer" }}
              onClick={() => setCheckedDoliIds(new Set())}
              disabled={bulkImporting}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              ×
            </button>
          </div>
          {bulkProgress && (
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-300 ease-out"
                style={{ width: `${Math.round((bulkProgress.done / bulkProgress.total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Two-column picker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Left: website products */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">Website Products</h2>
            <span className="text-xs font-semibold text-slate-400">{filteredSiteProducts.length} of {products.length}</span>
          </div>
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                value={siteSearch}
                onChange={(e) => setSiteSearch(e.target.value)}
                placeholder="Search website products..."
                className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-400 transition-colors"
              />
            </div>
            <FilterToggle value={siteFilter} onChange={setSiteFilter} />
            <PageSizeSelect value={sitePageSize} onChange={setSitePageSize} />
          </div>
          <div className="divide-y divide-slate-50 max-h-[34rem] overflow-y-auto">
            {visibleSiteProducts.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No products match.</p>
            ) : visibleSiteProducts.map((p) => {
              const linked = Boolean(p.dolibarr_id);
              const selected = selectedSiteId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => toggleSiteSelect(p)}
                  style={{ cursor: "pointer" }}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                    selected ? "bg-brand-50 ring-1 ring-inset ring-brand-300" : "hover:bg-slate-50"
                  }`}
                >
                  {(p.img || p.image) ? (
                    <img src={p.img || p.image} alt={p.name} loading="lazy" className="w-16 h-16 rounded-xl object-cover border border-slate-100 flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 text-xl flex-shrink-0">?</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400">
                      #{p.id} · {formatPrice(p.price || 0)}
                    </p>
                  </div>
                  {linked ? (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 ring-1 ring-blue-200">
                      Linked · {p.dolibarr_ref || p.dolibarr_id}
                    </span>
                  ) : (
                    <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400">
                      Unlinked
                    </span>
                  )}
                  {onOpenProduct && (
                    <button
                      type="button"
                      title="Open product page"
                      style={{ cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); onOpenProduct(p); }}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {isSiteSearching ? (
            <p className="px-5 py-2 text-[11px] text-slate-400 border-t border-slate-100 bg-slate-50/60 text-center">
              Showing all {filteredSiteProducts.length} search match{filteredSiteProducts.length === 1 ? "" : "es"} (pagination is off while searching)
            </p>
          ) : (
            <Pagination page={sitePage} totalPages={siteTotalPages} onChange={setSitePage} />
          )}
        </div>

        {/* Right: dolibarr products */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">Dolibarr Products</h2>
            <span className="text-xs font-semibold text-slate-400">{filteredDolibarrProducts.length} of {dolibarrProducts.length}</span>
          </div>
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                value={doliSearch}
                onChange={(e) => setDoliSearch(e.target.value)}
                placeholder="Search by ref or label..."
                className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-400 transition-colors"
              />
            </div>
            <FilterToggle value={doliFilter} onChange={setDoliFilter} />
            <PageSizeSelect value={doliPageSize} onChange={setDoliPageSize} />
          </div>

          {selectablePageUnlinkedIds.length > 0 && (
            <div className="px-5 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
              <input
                type="checkbox"
                checked={allPageChecked}
                onChange={toggleSelectAllOnPage}
                className="w-3.5 h-3.5 accent-brand-600 cursor-pointer"
              />
              <span className="text-[11px] font-semibold text-slate-500">
                Select all unlinked on this page — {checkedDoliIds.size} selected
              </span>
            </div>
          )}

          <div className="divide-y divide-slate-50 max-h-[34rem] overflow-y-auto">
            {loading ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">Loading Dolibarr products...</p>
            ) : error ? (
              <p className="px-5 py-8 text-sm text-red-500 text-center">{error}</p>
            ) : visibleDolibarrProducts.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No products match.</p>
            ) : visibleDolibarrProducts.map((d) => {
              const linked = linkedDolibarrIds.has(d.dolibarr_id);
              const selected = selectedDoliId === d.dolibarr_id;
              const checked = checkedDoliIds.has(d.dolibarr_id);
              return (
                <div
                  key={d.dolibarr_id}
                  onClick={() => toggleDoliSelect(d)}
                  style={{ cursor: "pointer" }}
                  className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                    selected ? "bg-brand-50 ring-1 ring-inset ring-brand-300" : "hover:bg-slate-50"
                  }`}
                >
                  {!linked && (
                    <input
                      type="checkbox"
                      checked={checked}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleDoliCheck(d.dolibarr_id)}
                      className="w-3.5 h-3.5 accent-brand-600 cursor-pointer flex-shrink-0"
                    />
                  )}
                  <DolibarrThumb dolibarrId={d.dolibarr_id} label={d.label} className="w-16 h-16 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{d.label}</p>
                    <p className="text-[11px] text-slate-400">
                      Ref {d.ref} · {formatPrice(d.price || 0)} · <StockPill status={d.stock_status} />
                    </p>
                  </div>
                  {linked ? (
                    <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 ring-1 ring-blue-200">
                      Linked
                    </span>
                  ) : (
                    <button
                      type="button"
                      style={{ cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); importProduct(d); }}
                      disabled={importingId === d.dolibarr_id || bulkImporting}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {importingId === d.dolibarr_id ? (<><Spinner /> Importing…</>) : "Create on Website"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {isDoliSearching ? (
            <p className="px-5 py-2 text-[11px] text-slate-400 border-t border-slate-100 bg-slate-50/60 text-center">
              Showing all {filteredDolibarrProducts.length} search match{filteredDolibarrProducts.length === 1 ? "" : "es"} (pagination is off while searching)
            </p>
          ) : (
            <Pagination page={doliPage} totalPages={doliTotalPages} onChange={setDoliPage} />
          )}
        </div>
      </div>

      {/* Floating link bar */}
      {(selectedSiteProduct || selectedDoliProduct) && (
        <div className="sticky bottom-4 z-10">
          <div className="bg-slate-900 text-white rounded-2xl shadow-xl px-5 py-3.5 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Website:</span>
              <span className="text-sm font-semibold truncate">{selectedSiteProduct?.name || "— select on the left"}</span>
            </div>
            <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Dolibarr:</span>
              <span className="text-sm font-semibold truncate">{selectedDoliProduct?.label || "— select on the right"}</span>
            </div>
            <button
              type="button"
              style={{ cursor: "pointer" }}
              onClick={confirmLink}
              disabled={!selectedSiteProduct || !selectedDoliProduct || linking}
              className="flex-shrink-0 px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {linking ? "Linking…" : "Link Products"}
            </button>
            <button
              type="button"
              style={{ cursor: "pointer" }}
              onClick={() => { setSelectedSiteId(null); setSelectedDoliId(null); }}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Mapping table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">Linked Products</h2>
          <span className="text-xs font-semibold text-slate-400">{mappedRows.length} mapped</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Website Product</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dolibarr Ref</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mappedRows.length === 0 ? (
                <tr><td colSpan="3" className="px-6 py-10 text-center text-sm text-slate-400">No products linked yet.</td></tr>
              ) : mappedRows.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onOpenProduct?.(p)}
                  style={{ cursor: onOpenProduct ? "pointer" : "default" }}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {(p.img || p.image) ? (
                        <img src={p.img || p.image} alt={p.name} loading="lazy" className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-sm">?</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[220px]">{p.name}</p>
                        <p className="text-[11px] text-slate-400">#{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm font-mono text-slate-600">{p.dolibarr_ref || p.dolibarr_id}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StockPill status={p.stockStatus} />
                      <span className="text-xs text-slate-500">{p.stockCount ?? "—"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
