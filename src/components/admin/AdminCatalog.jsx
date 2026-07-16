import { useState } from "react";
import { adminCategoryToggles } from "../../data/adminData";
import { AdminHero } from "./AdminHero";

const CAT_ICONS = {
  "gym-equipment": () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M6.5 6.5h11M6.5 17.5h11M4 10h16M4 14h16"/></svg>,
  "sports-tools":  () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  "sportswear":    () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>,
  "footwear":      () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 11v6l2 2h14l2-2v-3L9 8 3 11z"/><path d="M9 8V5a2 2 0 0 0-4 0v3"/></svg>,
  "supplements":   () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>,
  "flooring":      () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>,
};

/* ─── Default category structure ─────────────────────── */
const MAIN_CATEGORIES = [
  { value: "gym-equipment",  label: "Gym Equipment",
    subs: ["Cardio","Treadmills","Bikes","Ellipticals","Rowers","Stairs","Strength","Selectorized","Plate Loaded","Cable Motion","Multi Stations","Racks","Benches","Bars","Weights","Accessories"],
  },
  { value: "sports-tools",   label: "Sports Tools",
    subs: ["Football","Basketball","Volleyball","Indoor Sports","Training Tools","Sports Accessories","Gloves","Protectors","Socks","Bags","Caps","Rackets","Bottles"],
  },
  { value: "sportswear",     label: "Sportswear",
    subs: ["Men's","Ladies","Kids","Tracksuit","Sports Set","T-Shirt","Polo Shirt","Pants","Shorts"],
  },
  { value: "footwear",       label: "Footwear",
    subs: ["Running","Futsal"],
  },
  { value: "supplements",    label: "Supplements",
    subs: ["Protein","Creatine","Pre-Workout","Vitamins","Minerals","Fat Burner"],
  },
  { value: "flooring",       label: "Flooring",
    subs: ["Gym Mats","Sports Flooring","Rubber","Grass","Vinyl","Wood","Indoor","Outdoor"],
  },
];

/* ─── Tabs ─────────────────────────────────────────────── */
const TABS = [
  { id: "categories", label: "Categories & Subcategories" },
  { id: "brands",     label: "Brands" },
  { id: "custom",     label: "Custom Categories" },
];

/* ─── Categories tab ─────────────────────────────────── */
function CategoriesTab() {
  const [open, setOpen] = useState(null);
  const [subs, setSubs] = useState(() => Object.fromEntries(MAIN_CATEGORIES.map((c) => [c.value, c.subs])));
  const [newSub, setNewSub] = useState({});
  const [catImages, setCatImages] = useState({});

  function addSub(catValue) {
    const v = (newSub[catValue] || "").trim();
    if (!v) return;
    setSubs((s) => ({ ...s, [catValue]: [...(s[catValue] || []), v] }));
    setNewSub((i) => ({ ...i, [catValue]: "" }));
  }

  function removeSub(catValue, sub) {
    setSubs((s) => ({ ...s, [catValue]: (s[catValue] || []).filter((x) => x !== sub) }));
  }

  return (
    <div className="space-y-3">
      {MAIN_CATEGORIES.map((cat) => {
        const isOpen = open === cat.value;
        const img = catImages[cat.value];
        return (
          <div key={cat.value} className={`bg-white rounded-2xl border transition-all duration-150 overflow-hidden ${isOpen ? "border-brand-300 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}>
            {/* Header */}
            <div
              className="flex items-center gap-4 px-5 py-4 cursor-pointer"
              onClick={() => setOpen(isOpen ? null : cat.value)}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                {img ? (
                  <img src={img} alt={cat.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400">{CAT_ICONS[cat.value]?.()}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800">{cat.label}</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{(subs[cat.value] || []).length} subcategories</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                  title="Upload category image"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Image
                  <input type="file" accept="image/*" hidden onChange={(e) => {
                    if (e.target.files?.[0]) setCatImages((imgs) => ({ ...imgs, [cat.value]: URL.createObjectURL(e.target.files[0]) }));
                  }} />
                </label>
                <div className={`w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            {/* Subcategories panel */}
            {isOpen && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subcategories</p>
                  <div className="flex items-center gap-2">
                    <input
                      value={newSub[cat.value] || ""}
                      onChange={(e) => setNewSub((i) => ({ ...i, [cat.value]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSub(cat.value))}
                      placeholder="New subcategory…"
                      className="h-8 px-3 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-brand-400 transition-colors w-44"
                    />
                    <button style={{ cursor:"pointer" }}
                      onClick={() => addSub(cat.value)}
                      className="h-8 px-3 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(subs[cat.value] || []).map((sub) => (
                    <div key={sub} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 group">
                      {sub}
                      <button style={{ cursor:"pointer" }}
                        onClick={() => removeSub(cat.value, sub)}
                        className="text-slate-300 hover:text-red-500 transition-colors text-sm leading-none ml-0.5"
                      >×</button>
                    </div>
                  ))}
                  {(subs[cat.value] || []).length === 0 && (
                    <p className="text-xs text-slate-400 italic">No subcategories yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Brands tab ─────────────────────────────────────── */
function BrandsTab({ brands, onAdd, onRemove }) {
  const [name, setName] = useState("");
  const [cat, setCat] = useState("gym-equipment");

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), category: cat });
    setName("");
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Add Brand</h3>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Brand name (e.g. Technogym, Nike)"
            required
            className="flex-1 min-w-[200px] h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-400 transition-colors"
          />
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-400 transition-colors"
          >
            {adminCategoryToggles.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button style={{ cursor:"pointer" }} type="submit" className="h-10 px-5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors">
            Add Brand
          </button>
        </form>
      </div>

      {/* Brands grid */}
      {brands.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">No brands yet. Add your first brand above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {brands.map((b, i) => (
            <div key={i} className="group bg-white rounded-2xl border border-slate-200 p-4 flex flex-col items-center gap-3 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-full bg-brand-50 border-2 border-brand-100 flex items-center justify-center text-brand-600 text-xl font-black">
                {(b.name || b).charAt(0).toUpperCase()}
              </div>
              <div className="text-center min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate w-full">{b.name || b}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {adminCategoryToggles.find((c) => c.value === (b.category || ""))?.label || "All"}
                </p>
              </div>
              <button style={{ cursor:"pointer" }}
                onClick={() => onRemove(b)}
                className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-all"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Custom cats tab ──────────────────────────────────── */
function CustomCatsTab({ customCategories, onAdd, onRemove }) {
  const [val, setVal] = useState("");
  function handleAdd(e) {
    e.preventDefault();
    if (!val.trim()) return;
    onAdd(val.trim());
    setVal("");
  }
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Add Custom Category</h3>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="e.g. Beach Sports"
            required
            className="flex-1 h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-400 transition-colors"
          />
          <button style={{ cursor:"pointer" }} type="submit" className="h-10 px-5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors">
            Add
          </button>
        </form>
      </div>
      {customCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">No custom categories yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {customCategories.map((c) => (
            <div key={c} className="flex items-center justify-between px-5 py-3.5 group hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.59 13.41L11 3.83A2 2 0 0 0 9.59 3.17H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .66 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.52-4.52a2 2 0 0 0 0-2.83z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>
                </div>
                <span className="text-sm font-medium text-slate-700">{c}</span>
              </div>
              <button style={{ cursor:"pointer" }}
                onClick={() => onRemove(c)}
                className="opacity-0 group-hover:opacity-100 px-3 py-1 text-xs font-semibold text-red-400 border border-red-100 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────── */
export function AdminCatalog({ brands, customCategories, onBrandAdd, onBrandRemove, onCategoryAdd, onCategoryRemove }) {
  const [tab, setTab] = useState("categories");

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>}
        title="Catalog Management"
        subtitle="Manage categories, subcategories and brands"
      />

      {/* Tab nav */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map((t) => (
          <button style={{ cursor:"pointer" }}
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150
              ${tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "categories" && <CategoriesTab />}
      {tab === "brands" && <BrandsTab brands={brands} onAdd={onBrandAdd} onRemove={onBrandRemove} />}
      {tab === "custom" && <CustomCatsTab customCategories={customCategories} onAdd={onCategoryAdd} onRemove={onCategoryRemove} />}
    </div>
  );
}
