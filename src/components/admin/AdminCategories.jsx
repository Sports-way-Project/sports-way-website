import { useState } from "react";
import { useAdminModal } from "./AdminModal";
import { AdminHero } from "./AdminHero";

/* ─── Category icon SVGs ─────────────────────────── */
const CAT_ICONS = {
  "gym-equipment": () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M6.5 6.5h11M6.5 17.5h11M4 10h16M4 14h16"/></svg>,
  "sports-tools":  () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  "sportswear":    () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>,
  "footwear":      () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 11v6l2 2h14l2-2v-3L9 8 3 11z"/><path d="M9 8V5a2 2 0 0 0-4 0v3"/></svg>,
  "supplements":   () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>,
  "flooring":      () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>,
};

/* ─── Canonical category structure (synced with adminData.js) ── */
const MAIN_CATEGORIES = [
  { value: "gym-equipment", label: "Gym Equipment",
    defaultSubs: ["cardio","treadmills","bikes","ellipticals","rowers","stairs","strength","selectorized","plate-loaded","cable-motion","multi-stations","racks","benches","bars-weights","bars","weights","accessories","boxing"] },
  { value: "sports-tools", label: "Sports Tools",
    defaultSubs: ["football","basketball","volleyball","indoor","training","sports-accessories","gloves","protector","socks","bags","caps","rackets","bottles"] },
  { value: "sportswear", label: "Sportswear",
    defaultSubs: ["mens","ladies","kids","tracksuit","sports-set","t-shirt","polo-shirt","pants","shorts"] },
  { value: "footwear", label: "Footwear",
    defaultSubs: ["running","futsal"] },
  { value: "supplements", label: "Supplements",
    defaultSubs: ["protein","creatine","preworkout","vitamins","minerals","fatburner"] },
  { value: "flooring", label: "Flooring",
    defaultSubs: ["gym-mats","sports-flooring","rubber","grass","vinyl","wood","indoor-flooring","outdoor-flooring"] },
];

/* non-product page keys — filter from product creation */
const NON_PRODUCT_KEYS = new Set(["clients","partners","blog","wholesale","about","contact","clients_partners"]);

function countProductsInCategory(products, value) {
  return (products || []).filter(p =>
    (p.categories || []).some(c => c === value || c === value.toLowerCase().replace(/\s+/g, "-"))
    || p.category === value
  ).length;
}

function SlugLabel({ slug }) {
  const label = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return <span>{label}</span>;
}

export function AdminCategories({ products = [], customCategories, onCategoryAdd, onCategoryRemove }) {
  const { showAlert, showConfirm } = useAdminModal();

  const productCustomCategories = (customCategories || []).filter(c => !NON_PRODUCT_KEYS.has(c.toLowerCase()));

  const [expanded, setExpanded] = useState(null);
  const [subs, setSubs]         = useState(() => Object.fromEntries(MAIN_CATEGORIES.map(c => [c.value, [...c.defaultSubs]])));
  const [newSub, setNewSub]     = useState({});
  const [customInput, setCustomInput] = useState("");
  const [activeTab, setActiveTab] = useState("main");

  async function addSub(catValue) {
    const v = (newSub[catValue] || "").trim().toLowerCase().replace(/\s+/g, "-");
    if (!v) return;
    if ((subs[catValue] || []).includes(v)) {
      await showAlert(`"${v}" already exists in this category.`, { type: "warning", title: "Duplicate" });
      return;
    }
    setSubs(s => ({ ...s, [catValue]: [...(s[catValue] || []), v] }));
    setNewSub(i => ({ ...i, [catValue]: "" }));
  }

  async function removeSub(catValue, sub) {
    const count = (products || []).filter(p =>
      (p.categories || []).some(c => c === sub)
    ).length;
    if (count > 0) {
      await showAlert(
        `"${sub}" is used by ${count} product${count > 1 ? "s" : ""}. Reassign those products first before removing this subcategory.`,
        { type: "warning", title: "Cannot remove subcategory" }
      );
      return;
    }
    const ok = await showConfirm(`Remove subcategory "${sub}"?`, { title: "Remove subcategory", okLabel: "Remove" });
    if (!ok) return;
    setSubs(s => ({ ...s, [catValue]: (s[catValue] || []).filter(x => x !== sub) }));
  }

  async function handleAddCustom(e) {
    e.preventDefault();
    if (!customInput.trim()) return;
    onCategoryAdd(customInput.trim());
    setCustomInput("");
  }

  async function handleRemoveCustom(c) {
    const count = countProductsInCategory(products, c);
    if (count > 0) {
      await showAlert(
        `"${c}" is used by ${count} product${count > 1 ? "s" : ""}. Reassign those products first.`,
        { type: "warning", title: "Cannot remove category" }
      );
      return;
    }
    const ok = await showConfirm(`Remove custom category "${c}"?`, { title: "Remove category", okLabel: "Remove" });
    if (!ok) return;
    onCategoryRemove(c);
  }

  const TABS = [
    { id: "main",   label: `Main categories (${MAIN_CATEGORIES.length})` },
    { id: "custom", label: `Custom (${productCustomCategories.length})` },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>}
        title="Categories"
        subtitle="Manage main categories and their subcategories"
      />


      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} style={{ cursor:"pointer" }} onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all ${
              activeTab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MAIN CATEGORIES ── */}
      {activeTab === "main" && (
        <div className="space-y-3">
          {MAIN_CATEGORIES.map(cat => {
            const isOpen = expanded === cat.value;
            const catSubs = subs[cat.value] || [];
            return (
              <div key={cat.value}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
                  isOpen ? "border-brand-200 shadow-sm" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Row header */}
                <button style={{ cursor:"pointer" }}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                  onClick={() => setExpanded(isOpen ? null : cat.value)}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOpen ? "bg-brand-50 text-brand-500" : "bg-slate-50 text-slate-400"}`}>
                    {CAT_ICONS[cat.value]?.()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{cat.label}</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">{catSubs.length} subcategories</p>
                  </div>

                  {/* Sub preview chips */}
                  {!isOpen && (
                    <div className="hidden lg:flex items-center gap-1.5 flex-1 max-w-xs overflow-hidden">
                      {catSubs.slice(0, 4).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-medium rounded-lg whitespace-nowrap">
                          <SlugLabel slug={s} />
                        </span>
                      ))}
                      {catSubs.length > 4 && (
                        <span className="text-[10px] text-slate-400 font-medium">+{catSubs.length - 4} more</span>
                      )}
                    </div>
                  )}

                  {/* Chevron */}
                  <div className={`w-7 h-7 flex items-center justify-center rounded-lg ${isOpen ? "bg-brand-50 text-brand-500" : "text-slate-300"} transition-all`}>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                </button>

                {/* Expanded subcategory panel */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5">
                    {/* Add subcategory */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Subcategories ({catSubs.length})
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          value={newSub[cat.value] || ""}
                          onChange={e => setNewSub(i => ({ ...i, [cat.value]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSub(cat.value))}
                          placeholder="e.g. boxing-bags"
                          className="h-8 px-3 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-brand-400 transition-colors w-40"
                        />
                        <button style={{ cursor:"pointer" }} onClick={() => addSub(cat.value)}
                          className="h-8 px-4 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors flex items-center gap-1.5">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-2">
                      {catSubs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No subcategories yet</p>
                      ) : catSubs.map(sub => {
                        const inUse = (products || []).some(p => (p.categories || []).includes(sub));
                        return (
                          <div key={sub}
                            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              inUse
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            <SlugLabel slug={sub} />
                            {inUse && (
                              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                in use
                              </span>
                            )}
                            <button style={{ cursor:"pointer" }}
                              onClick={() => removeSub(cat.value, sub)}
                              className="w-4 h-4 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors ml-0.5 rounded-full"
                              title="Remove subcategory"
                            >
                              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── CUSTOM CATEGORIES ── */}
      {activeTab === "custom" && (
        <div className="space-y-5">
          {/* Add form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-800 mb-1">Add Custom Category</p>
            <p className="text-xs text-slate-400 mb-4">
              Additional product categories beyond the main 6. Do not add page names (clients, blog, etc.)
            </p>
            <form onSubmit={handleAddCustom} className="flex gap-3">
              <input value={customInput} onChange={e => setCustomInput(e.target.value)}
                placeholder="e.g. Beach Sports, Dance, Martial Arts..."
                required
                className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
              <button style={{ cursor:"pointer" }} type="submit"
                className="h-10 px-6 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors">
                Add
              </button>
            </form>
          </div>

          {productCustomCategories.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-14 flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                <svg width="22" height="22" fill="none" stroke="#94a3b8" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p className="text-sm font-semibold text-slate-500">No custom categories yet</p>
              <p className="text-xs text-slate-400">Add categories that go beyond the main 6 routes</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-50">
              {productCustomCategories.map(c => {
                const count = countProductsInCategory(products, c);
                return (
                  <div key={c} className="flex items-center justify-between px-5 py-3.5 group hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.59 13.41L11 3.83A2 2 0 0 0 9.59 3.17H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .66 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.52-4.52a2 2 0 0 0 0-2.83z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-700">{c}</span>
                        {count > 0 && (
                          <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                            {count} product{count > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <button style={{ cursor:"pointer" }}
                      onClick={() => handleRemoveCustom(c)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-100 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4h4v2"/></svg>
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
