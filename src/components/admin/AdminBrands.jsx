import { useState, useMemo } from "react";
import { adminCategoryToggles } from "../../data/adminData";
import { useAdminModal } from "./AdminModal";
import { AdminHero } from "./AdminHero";

const BRAND_COLORS = ["bg-rose-500","bg-orange-500","bg-amber-500","bg-emerald-500","bg-teal-500","bg-cyan-500","bg-blue-500","bg-violet-500","bg-purple-500","bg-pink-500"];

function brandColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xFFFFFF;
  return BRAND_COLORS[Math.abs(h) % BRAND_COLORS.length];
}

export function AdminBrands({ products = [], brands, onBrandAdd, onBrandRemove }) {
  const { showAlert, showConfirm } = useAdminModal();
  const [name, setName] = useState("");
  const [cat, setCat]   = useState("gym-equipment");
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onBrandAdd({ name: name.trim(), category: cat });
    setName("");
  }

  const filtered = useMemo(() => {
    let list = brands;
    if (filterCat !== "all") list = list.filter(b => (b.category || "") === filterCat);
    if (search.trim()) list = list.filter(b => (b.name || b).toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [brands, filterCat, search]);

  const byCategory = useMemo(() => {
    const map = {};
    brands.forEach(b => {
      const k = b.category || "other";
      if (!map[k]) map[k] = 0;
      map[k]++;
    });
    return map;
  }, [brands]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.59 13.41L11 3.83A2 2 0 0 0 9.59 3.17H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .66 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.52-4.52a2 2 0 0 0 0-2.83z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>}
        title="Brands"
        subtitle={`${brands.length} brands across ${Object.keys(byCategory).length} categories`}
      />

      {/* Add brand card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <h2 className="text-sm font-bold text-slate-800">Add New Brand</h2>
        </div>
        <form onSubmit={handleAdd} className="p-6 flex flex-wrap gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Brand name (e.g. Technogym, Nike, Adidas)" required
            className="flex-1 min-w-[200px] h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all" />
          <select value={cat} onChange={e => setCat(e.target.value)}
            className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-brand-400 focus:bg-white transition-all">
            {adminCategoryToggles.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button style={{ cursor:"pointer" }} type="submit"
            className="h-11 px-6 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm shadow-brand-200">
            Add Brand
          </button>
        </form>
      </div>

      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search brands by name..."
          className="w-full h-12 pl-12 pr-12 bg-white border-2 border-slate-200 focus:border-brand-400 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all shadow-sm cursor-text"
        />
        {search ? (
          <button onClick={() => setSearch("")} style={{ cursor:"pointer" }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors text-sm font-bold">
            x
          </button>
        ) : (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">{filtered.length} brands</span>
        )}
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button style={{ cursor:"pointer" }} onClick={() => setFilterCat("all")}
          className={`flex items-center gap-2 h-8 px-4 text-xs font-bold rounded-xl border transition-all ${filterCat === "all" ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700"}`}>
          All brands
          <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md ${filterCat === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}>{brands.length}</span>
        </button>
        {adminCategoryToggles.map(c => (
          <button style={{ cursor:"pointer" }} key={c.value} onClick={() => setFilterCat(c.value)}
            className={`flex items-center gap-2 h-8 px-4 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${filterCat === c.value ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700"}`}>
            {c.label}
            <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md ${filterCat === c.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}>{byCategory[c.value] || 0}</span>
          </button>
        ))}
        {search && (
          <span className="text-xs text-slate-400 font-medium ml-1">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for <strong className="text-slate-700">"{search}"</strong>
          </span>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3 mx-auto"><svg width="24" height="24" fill="none" stroke="#94a3b8" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M20.59 13.41L11 3.83A2 2 0 0 0 9.59 3.17H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .66 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.52-4.52a2 2 0 0 0 0-2.83z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg></div>
          <p className="text-sm font-semibold text-slate-500">{brands.length === 0 ? "No brands yet" : "No brands match this filter"}</p>
          <p className="text-xs text-slate-400 mt-1">{brands.length === 0 ? "Add your first brand above" : "Try a different category"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((b, i) => {
            const bName = b.name || b;
            const color = brandColor(bName);
            const catLabel = adminCategoryToggles.find(c => c.value === (b.category || ""))?.label || "All categories";
            return (
              <div key={i} className="group bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center gap-3 hover:border-slate-300 hover:shadow-md transition-all duration-200">
                {/* Avatar */}
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white text-xl font-black shadow-sm`}>
                  {bName.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="text-center w-full">
                  <p className="text-sm font-bold text-slate-800 truncate">{bName}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-400 text-[10px] font-semibold rounded-full">
                    {catLabel}
                  </span>
                </div>
                {/* Remove */}
                <button
                  style={{ cursor:"pointer" }}
                  onClick={async () => {
                    const bName = b.name || b;
                    const count = (products || []).filter(p => p.brand === bName).length;
                    if (count > 0) {
                      await showAlert(
                        `"${bName}" is used by ${count} product${count > 1 ? "s" : ""}. Reassign those products before removing this brand.`,
                        { type: "warning", title: "Cannot remove brand" }
                      );
                      return;
                    }
                    const ok = await showConfirm(`Remove brand "${bName}"?`, { title: "Remove brand", okLabel: "Remove" });
                    if (!ok) return;
                    onBrandRemove(b);
                  }}
                  className="opacity-0 group-hover:opacity-100 w-full py-1.5 text-xs font-semibold text-red-400 border border-red-100 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all">
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
