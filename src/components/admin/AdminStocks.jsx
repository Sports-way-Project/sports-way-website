import { useState, useMemo, useEffect, useRef } from "react";
import { formatPrice } from "../../lib/format";
import { getLiveStock } from "../../lib/fastapiClient";
import { AdminHero } from "./AdminHero";

const STOCK_FILTER_OPTS = [
  { key: "all",         label: "All Products"  },
  { key: "instock",     label: "In Stock"      },
  { key: "low",         label: "Low Stock"     },
  { key: "outofstock",  label: "Out of Stock"  },
  { key: "onbackorder", label: "On Backorder"  },
];

const STOCK_META = {
  instock:     { label: "In Stock",     bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  outofstock:  { label: "Out of Stock", bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500",     ring: "ring-red-200"     },
  onbackorder: { label: "Backorder",    bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   ring: "ring-amber-200"   },
  low:         { label: "Low Stock",    bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400",  ring: "ring-orange-200"  },
};

function StockBadge({ status, count }) {
  const isLow = status === "instock" && count != null && count > 0 && count <= 5;
  const key = isLow ? "low" : (status || "instock");
  const m = STOCK_META[key] || STOCK_META.instock;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${m.bg} ${m.text} ${m.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function StockBar({ count, max }) {
  if (count == null || max === 0) return <span className="text-xs text-slate-300 italic">—</span>;
  const pct = Math.min(100, (count / max) * 100);
  const color = pct <= 20 ? "bg-red-400" : pct <= 50 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 tabular-nums w-8 text-right">{count}</span>
    </div>
  );
}

export function AdminStocks({ products, onUpdateStock, onOpenProduct }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState({}); // { [id]: { status, count } }
  const [syncing, setSyncing] = useState({}); // { [id]: true }

  const maxCount = useMemo(() => Math.max(1, ...products.map(p => p.stockCount || 0)), [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q) || String(p.id).includes(q));
    }
    if (filter === "low") return list.filter(p => (p.stockStatus === "instock") && p.stockCount != null && p.stockCount <= 5);
    if (filter !== "all") return list.filter(p => (p.stockStatus || "instock") === filter);
    return list;
  }, [products, filter, search]);

  const stats = useMemo(() => ({
    total:       products.length,
    instock:     products.filter(p => (p.stockStatus || "instock") === "instock").length,
    outofstock:  products.filter(p => p.stockStatus === "outofstock").length,
    low:         products.filter(p => p.stockStatus === "instock" && p.stockCount != null && p.stockCount <= 5).length,
    onbackorder: products.filter(p => p.stockStatus === "onbackorder").length,
  }), [products]);

  function beginEdit(p) {
    setEditing(e => ({ ...e, [p.id]: { status: p.stockStatus || "instock", count: p.stockCount ?? "" } }));
  }

  function commitEdit(p) {
    const ed = editing[p.id];
    if (!ed) return;
    onUpdateStock(p.id, ed.status, ed.count === "" ? null : Number(ed.count));
    setEditing(e => { const n = { ...e }; delete n[p.id]; return n; });
  }

  function cancelEdit(id) {
    setEditing(e => { const n = { ...e }; delete n[id]; return n; });
  }

  async function refreshFromDolibarr(p, { silent = false } = {}) {
    if (!p.dolibarr_id) return;
    setSyncing(s => ({ ...s, [p.id]: true }));
    try {
      // FastAPI only reads Dolibarr's live stock here — it never touches
      // Supabase. The comparison and the write both happen here in React,
      // same as everywhere else in the admin (via onUpdateStock's upsert).
      const result = await getLiveStock(p.id, p.dolibarr_id);
      if (result.stock_status !== p.stockStatus || result.stock_count !== p.stockCount) {
        await onUpdateStock(p.id, result.stock_status, result.stock_count, { silent });
      }
    } catch (e) {
      console.error("Failed to sync stock from Dolibarr:", e);
    } finally {
      setSyncing(s => { const n = { ...s }; delete n[p.id]; return n; });
    }
  }

  // Same idea as the website's live-stock overlay: as soon as this page has a
  // linked product, pull its real Dolibarr stock in the background and write
  // it into Supabase if it drifted, instead of trusting whatever is cached.
  const autoSynced = useRef(new Set());
  useEffect(() => {
    const linked = products.filter(p => p.dolibarr_id && !autoSynced.current.has(p.id));
    linked.forEach(p => {
      autoSynced.current.add(p.id);
      refreshFromDolibarr(p, { silent: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  return (
    <div className="p-6 lg:p-8 space-y-6">

      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
        title="Stock Management"
        subtitle="Monitor and update inventory levels across all products"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: stats.total,      color: "from-slate-50 to-slate-100/50",    border: "border-slate-200",   text: "text-slate-700",   iconCls: "text-slate-400",   Icon: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg> },
          { label: "In Stock",       value: stats.instock,   color: "from-emerald-50 to-emerald-100/50", border: "border-emerald-200", text: "text-emerald-700", iconCls: "text-emerald-400", Icon: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
          { label: "Low Stock",      value: stats.low,       color: "from-orange-50 to-amber-50/50",     border: "border-orange-200",  text: "text-orange-700",  iconCls: "text-orange-400",  Icon: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
          { label: "Out of Stock",   value: stats.outofstock,color: "from-red-50 to-red-100/50",         border: "border-red-200",     text: "text-red-600",     iconCls: "text-red-400",     Icon: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
        ].map(s => (
          <div key={s.label} className={`relative bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-5 overflow-hidden`}>
            <div className={`absolute right-4 top-4 opacity-60 ${s.iconCls}`}><s.Icon /></div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {STOCK_FILTER_OPTS.map(opt => (
          <button style={{ cursor:"pointer" }} key={opt.key} onClick={() => setFilter(opt.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              filter === opt.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            {opt.label}
            <span className={`ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
              filter === opt.key ? "bg-slate-100 text-slate-600" : "bg-slate-200/60 text-slate-400"
            }`}>
              {opt.key === "all" ? stats.total
               : opt.key === "low" ? stats.low
               : opt.key === "instock" ? stats.instock
               : opt.key === "outofstock" ? stats.outofstock
               : stats.onbackorder}
            </span>
          </button>
        ))}
      </div>

      {/* Search bar — same as AdminProducts */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products by name or ID..."
          className="w-full h-12 pl-12 pr-12 bg-white border-2 border-slate-200 focus:border-brand-400 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all shadow-sm cursor-text"
        />
        {search ? (
          <button onClick={() => setSearch("")} style={{ cursor:"pointer" }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors text-sm font-bold">
            x
          </button>
        ) : (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">{filtered.length} items</span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Product</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-48">Stock Level</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Price</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-60">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-16 text-center text-sm text-slate-400">No products match this filter.</td></tr>
              ) : filtered.map(p => {
                const ed = editing[p.id];
                return (
                  <tr
                    key={p.id}
                    className="group hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => onOpenProduct?.(p)}
                  >
                    {/* Product */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {(p.img || p.image) ? (
                          <img src={p.img || p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-slate-100 flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 text-lg flex-shrink-0">?</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">{p.name}</p>
                          <p className="text-[11px] text-slate-400">#{p.id}</p>
                        </div>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StockBadge status={p.stockStatus} count={p.stockCount} />
                    </td>
                    {/* Stock bar */}
                    <td className="px-5 py-3.5">
                      <StockBar count={p.stockCount} max={maxCount} />
                    </td>
                    {/* Price */}
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-700">
                      {formatPrice(p.price || 0)}
                    </td>
                    {/* Quick edit */}
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      {ed ? (
                        <div className="flex items-center gap-2">
                          <select value={ed.status}
                            onChange={e => setEditing(prev => ({ ...prev, [p.id]: { ...prev[p.id], status: e.target.value } }))}
                            className="h-8 px-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-brand-400">
                            <option value="instock">In Stock</option>
                            <option value="outofstock">Out of Stock</option>
                            <option value="onbackorder">Backorder</option>
                          </select>
                          <input type="number" min="0" value={ed.count}
                            onChange={e => setEditing(prev => ({ ...prev, [p.id]: { ...prev[p.id], count: e.target.value } }))}
                            placeholder="Qty"
                            className="h-8 w-16 px-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-brand-400 text-center" />
                          <button style={{ cursor:"pointer" }} onClick={() => commitEdit(p)}
                            className="h-8 px-3 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors">
                            Save
                          </button>
                          <button style={{ cursor:"pointer" }} onClick={() => cancelEdit(p.id)}
                            className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-lg">
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {p.dolibarr_id ? (
                            <button style={{ cursor:"pointer" }} onClick={() => refreshFromDolibarr(p)} disabled={!!syncing[p.id]}
                              title={`Linked to Dolibarr ref ${p.dolibarr_ref || p.dolibarr_id}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:border-blue-400 transition-all disabled:opacity-50">
                              <svg className={`w-3 h-3 ${syncing[p.id] ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                              {syncing[p.id] ? "Syncing…" : "Sync"}
                            </button>
                          ) : null}
                          <button style={{ cursor:"pointer" }} onClick={() => beginEdit(p)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-brand-300 hover:text-brand-600 transition-all">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
