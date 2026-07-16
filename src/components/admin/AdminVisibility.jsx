import { useState } from "react";
import { adminCategoryToggles, adminSubcategoryToggles } from "../../data/adminData";
import { AdminHero } from "./AdminHero";

function Toggle({ checked, onChange, label, sub }) {
  return (
    <label style={{ cursor:"pointer" }}
      className={`flex items-center justify-between gap-3 px-4 py-3 bg-white border rounded-xl transition-all hover:border-slate-300 ${
        checked ? "border-slate-200" : "border-slate-200 opacity-60"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-brand-600" : "bg-slate-200"}`}>
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
    </label>
  );
}

function Section({ title, description, icon, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-start gap-4 px-6 py-5 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 text-brand-600">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

export function AdminVisibility({
  hiddenCategories, setHiddenCategories,
  hiddenSubcategories, setHiddenSubcategories,
  showBrandsFilter, setShowBrandsFilter,
  customCategories,
  onSave, saving,
}) {
  const mainVisible   = adminCategoryToggles.filter(c => !hiddenCategories.includes(c.value)).length;
  const subVisible    = adminSubcategoryToggles.filter(s => !hiddenSubcategories.includes(s)).length;

  function toggleCat(val, checked) {
    setHiddenCategories(prev => checked ? prev.filter(c => c !== val) : [...new Set([...prev, val])]);
  }

  function toggleSub(val, checked) {
    setHiddenSubcategories(prev => checked ? prev.filter(c => c !== val) : [...new Set([...prev, val])]);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">

      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
        title="Visibility Settings"
        subtitle="Control what appears in the website top navigation menu and catalog sidebar"
        actions={
          <button onClick={onSave} disabled={saving} style={{ cursor: saving ? "wait" : "pointer" }}
            className="flex items-center gap-2 h-10 px-6 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm shadow-brand-200 disabled:opacity-60">
            {saving ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        }
      />

      {/* Context info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3 items-start">
        <svg width="18" height="18" fill="none" stroke="#1d4ed8" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div>
          <p className="text-sm font-bold text-blue-800">How this affects the website</p>
          <p className="text-xs text-blue-600 mt-1 leading-relaxed">
            <strong>Main categories</strong> appear in the top navigation bar dropdown menus. Hiding one removes it from the menu and redirects visitors to the homepage.
            <br/>
            <strong>Subcategories</strong> appear as filter options within each category catalog page.
            <br/>
            <strong>Brands filter</strong> shows/hides the brand filter panel in the catalog sidebar.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Categories visible", value: `${mainVisible} / ${adminCategoryToggles.length}`, color: "text-brand-600" },
          { label: "Subcategories visible", value: `${subVisible} / ${adminSubcategoryToggles.length}`, color: "text-slate-700" },
          { label: "Brands filter", value: showBrandsFilter ? "Enabled" : "Disabled", color: showBrandsFilter ? "text-emerald-600" : "text-slate-400" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main categories */}
      <Section
        title="Main Navigation Categories"
        description="These appear as dropdown items in the top menu bar"
        icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>}
      >
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {adminCategoryToggles.map(item => (
            <Toggle
              key={item.value}
              label={item.label}
              sub={`/categories/${item.value}`}
              checked={!hiddenCategories.includes(item.value)}
              onChange={e => toggleCat(item.value, e.target.checked)}
            />
          ))}
        </div>
      </Section>

      {/* Subcategories */}
      <Section
        title="Subcategory Filters"
        description="Filter options shown inside each category catalog page"
        icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {adminSubcategoryToggles.map(item => (
            <Toggle
              key={item}
              label={item.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              checked={!hiddenSubcategories.includes(item)}
              onChange={e => toggleSub(item, e.target.checked)}
            />
          ))}
        </div>
        {customCategories?.filter(c => !["clients","partners","blog"].includes(c)).length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Custom Categories</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {customCategories.filter(c => !["clients","partners","blog"].includes(c)).map(item => (
                <Toggle
                  key={item}
                  label={item}
                  checked={!hiddenSubcategories.includes(item)}
                  onChange={e => toggleSub(item, e.target.checked)}
                />
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Catalog features */}
      <Section
        title="Catalog Sidebar Features"
        description="Additional filter panels shown in the product catalog sidebar"
        icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>}
      >
        <div className="max-w-sm">
          <Toggle
            label="Brands Filter"
            sub="Shows a brand selector in the catalog sidebar"
            checked={showBrandsFilter}
            onChange={e => setShowBrandsFilter(e.target.checked)}
          />
        </div>
      </Section>
    </div>
  );
}
