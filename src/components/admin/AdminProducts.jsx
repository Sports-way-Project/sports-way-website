import { useState, useMemo, useRef, useEffect } from "react";
import { formatPrice } from "../../lib/format";
import { useAdminModal } from "./AdminModal";
import { AdminHero } from "./AdminHero";

const STOCK = {
  instock:     { label: "In Stock",     dot: "bg-emerald-400", bg: "bg-emerald-50",  text: "text-emerald-700", ring: "ring-emerald-200" },
  outofstock:  { label: "Out of Stock", dot: "bg-red-400",     bg: "bg-red-50",      text: "text-red-600",     ring: "ring-red-200"     },
  onbackorder: { label: "Backorder",    dot: "bg-amber-400",   bg: "bg-amber-50",    text: "text-amber-700",   ring: "ring-amber-200"   },
};

function StockPill({ status }) {
  const s = STOCK[status] || STOCK.instock;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function Pagination({ page, total, pageSize, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const visible = Array.from({ length: pages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1);
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 24px", borderTop:"1px solid #f1f5f9", background:"#fafafa" }}>
      <p style={{ fontSize:12, color:"#94a3b8", fontWeight:500, margin:0 }}>{total} products / page {page} of {pages}</p>
      <div style={{ display:"flex", gap:4 }}>
        <button disabled={page <= 1} onClick={() => onChange(page - 1)}
          style={{ height:32, padding:"0 12px", fontSize:12, fontWeight:700, borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", color: page<=1 ? "#cbd5e1" : "#475569", cursor: page<=1 ? "not-allowed" : "pointer" }}>
          Prev
        </button>
        {visible.map((p, i, arr) => (
          <span key={p} style={{ display:"contents" }}>
            {i > 0 && arr[i-1] !== p-1 && (
              <span style={{ height:32, padding:"0 6px", display:"flex", alignItems:"center", color:"#cbd5e1", fontSize:12 }}>...</span>
            )}
            <button onClick={() => onChange(p)}
              style={{ height:32, minWidth:32, padding:"0 10px", fontSize:12, fontWeight:700, borderRadius:8, border:"1px solid", cursor:"pointer", borderColor: page===p ? "#0f172a" : "#e2e8f0", background: page===p ? "#0f172a" : "#fff", color: page===p ? "#fff" : "#475569" }}>
              {p}
            </button>
          </span>
        ))}
        <button disabled={page >= pages} onClick={() => onChange(page + 1)}
          style={{ height:32, padding:"0 12px", fontSize:12, fontWeight:700, borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", color: page>=pages ? "#cbd5e1" : "#475569", cursor: page>=pages ? "not-allowed" : "pointer" }}>
          Next
        </button>
      </div>
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function AdminProducts({ products, onAddNew, onView, onEdit, onDelete, onRenameImages, onBulkEditCsv, onUploadExcel }) {
  const { showConfirm } = useAdminModal();
  const [search, setSearch] = useState("");
  const [stockF, setStockF] = useState("all");
  const [page, setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [selected, setSelected] = useState(() => new Set());
  const searchRef = useRef(null);

  const counts = useMemo(() => ({
    all:         products.length,
    instock:     products.filter(p => (p.stockStatus || "instock") === "instock").length,
    outofstock:  products.filter(p => p.stockStatus === "outofstock").length,
    onbackorder: products.filter(p => p.stockStatus === "onbackorder").length,
  }), [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        p.categories?.some(c => c.toLowerCase().includes(q)) ||
        p.brand?.toLowerCase().includes(q)
      );
    }
    if (stockF !== "all") list = list.filter(p => (p.stockStatus || "instock") === stockF);
    return list;
  }, [products, search, stockF]);

  useEffect(() => { setPage(1); }, [pageSize]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pagedIds = useMemo(() => paged.map(p => p.id), [paged]);
  const allPagedSelected = pagedIds.length > 0 && pagedIds.every(id => selected.has(id));

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelected(prev => {
      const next = new Set(prev);
      if (allPagedSelected) {
        pagedIds.forEach(id => next.delete(id));
      } else {
        pagedIds.forEach(id => next.add(id));
      }
      return next;
    });
  }

  const FILTERS = [
    { key: "all",         label: "All products" },
    { key: "instock",     label: "In Stock"     },
    { key: "outofstock",  label: "Out of Stock" },
    { key: "onbackorder", label: "Backorder"    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">

      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>}
        title="Products"
        subtitle={`${products.length} products in catalog`}
        actions={
          <>
            <button disabled
              title="Disabled — this only compresses images still stored as raw base64 in the database. Every product now uploads straight to Storage on save, so there's nothing left for this to do on a normally-managed catalog."
              className="h-9 px-4 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-xl cursor-not-allowed opacity-60">
              Optimize Images
            </button>
            <button onClick={onRenameImages}
              title="Uploads any images still stored as base64, and renames existing Storage images to match this product's SEO-friendly name/brand/category prefix"
              className="h-9 px-4 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
              SEO Rename
            </button>
            <label
              title="Jump straight to the bulk Excel import screen with this file already loaded"
              className="h-9 px-4 flex items-center text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
              Upload Excel
              <input type="file" accept=".xlsx,.xls" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onUploadExcel(f); }} />
            </label>
            <button onClick={onAddNew}
              className="h-9 px-5 flex items-center gap-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl cursor-pointer transition-colors shadow-md shadow-brand-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Product
            </button>
          </>
        }
      />

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          ref={searchRef}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products by name, ID, category or brand..."
          className="w-full h-12 pl-12 pr-12 bg-white border-2 border-slate-200 focus:border-brand-400 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all shadow-sm cursor-text"
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 cursor-pointer transition-colors text-sm font-bold">
            x
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(({ key, label }) => (
          <button key={key} onClick={() => { setStockF(key); setPage(1); }}
            className={`flex items-center gap-2 h-8 px-4 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
              stockF === key
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700"
            }`}>
            {label}
            <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md ${
              stockF === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
            }`}>{counts[key] || 0}</span>
          </button>
        ))}
        {search && (
          <span className="text-xs text-slate-400 font-medium ml-1">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for <strong className="text-slate-700">"{search}"</strong>
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Per page</label>
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
            className="h-8 px-3 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer outline-none">
            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-5 py-3 bg-brand-50 border border-brand-200 rounded-2xl">
          <span className="text-xs font-bold text-brand-700">{selected.size} product{selected.size !== 1 ? "s" : ""} selected</span>
          <button onClick={() => onBulkEditCsv(Array.from(selected))}
            className="h-8 px-4 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg cursor-pointer transition-colors">
            Bulk Edit via Excel
          </button>
          <button onClick={() => setSelected(new Set())}
            className="h-8 px-3 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse:"separate", borderSpacing:0 }}>
            <thead>
              <tr className="border-b-2 border-slate-100">
                <th className="px-5 py-3.5 w-10">
                  <input type="checkbox" checked={allPagedSelected} onChange={toggleAllOnPage}
                    className="w-4 h-4 rounded cursor-pointer accent-brand-600" />
                </th>
                {["Image","Product","Categories","Stock","Price","Dolibarr","Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/></svg>
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-600">{search ? "No results for that search" : "No products yet"}</p>
                        <p className="text-sm text-slate-400 mt-1">{search ? "Try different keywords" : "Add your first product to get started"}</p>
                      </div>
                      {!search && (
                        <button onClick={onAddNew} className="mt-2 h-9 px-5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl cursor-pointer transition-colors">
                          + Add Product
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : paged.map((p, idx) => (
                <tr key={p.id}
                  onClick={() => onView(p)}
                  className={`border-b border-slate-50 hover:bg-brand-50/30 transition-colors cursor-pointer ${idx === paged.length - 1 ? "border-b-0" : ""}`}
                >
                  <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)}
                      className="w-4 h-4 rounded cursor-pointer accent-brand-600" />
                  </td>
                  {/* Image */}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="relative w-[72px] h-[72px] flex-shrink-0 cursor-pointer" onClick={() => onView(p)}>
                      {(p.img || p.image || p.cover) ? (
                        <img src={p.cover || p.img || p.image} alt={p.name}
                          className="w-full h-full rounded-2xl object-cover border border-slate-100 shadow-sm" />
                      ) : (
                        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                      )}
                      {p.badge && (
                        <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 text-[9px] font-black text-white bg-brand-600 rounded-full uppercase leading-tight">
                          {p.badge}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Product info */}
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="text-sm font-bold text-slate-900 truncate leading-tight">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-400">#{p.id}</span>
                      {p.brand && <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">{p.brand}</span>}
                      {p.featured && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">Featured</span>}
                    </div>
                  </td>

                  {/* Categories */}
                  <td className="px-4 py-3 max-w-[180px]">
                    <div className="flex flex-wrap gap-1">
                      {(p.categories || []).slice(0, 2).map(c => (
                        <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded-lg">{c}</span>
                      ))}
                      {(p.categories || []).length > 2 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] rounded-lg font-semibold">+{p.categories.length - 2}</span>
                      )}
                    </div>
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-3">
                    <StockPill status={p.stockStatus} />
                    {p.stockCount != null && (
                      <p className="text-[10px] text-slate-400 font-medium mt-1">{p.stockCount} units</p>
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-black text-slate-900">{formatPrice(p.price || 0)}</p>
                    {p.oldPrice && (
                      <p className="text-[11px] text-slate-400 line-through font-medium">{formatPrice(p.oldPrice)}</p>
                    )}
                  </td>

                  {/* Dolibarr */}
                  <td className="px-4 py-3">
                    {p.dolibarr_ref ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                        <span className="text-[11px] font-semibold text-blue-600 font-mono">{p.dolibarr_ref}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-300 italic">Not linked</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onView(p)}
                        className="h-8 px-3 flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        View
                      </button>
                      <button onClick={() => onEdit(p)}
                        className="h-8 px-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer transition-all shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        Edit
                      </button>
                      <button onClick={async () => {
                          const ok = await showConfirm(`Delete "${p.name}"?`, { title: "Delete product", okLabel: "Delete", type: "error" });
                          if (ok) onDelete(p.id);
                        }}
                        className="h-8 w-8 flex items-center justify-center text-red-400 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:text-red-600 cursor-pointer transition-all shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4h4v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
      </div>
    </div>
  );
}

/* â”€â”€â”€ constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
