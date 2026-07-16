import { useState } from "react";
import { BrandLoader } from "../BrandLoader";

/* ── inline SVG icons ─────────────────────────── */
const Icons = {
  Grid:     () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  Eye:      () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Box:      () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>,
  Layers:   () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Stocks:   () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Receipt:  () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 2h16v20l-3-2-2.5 2-2.5-2-2.5 2L7 20l-3 2V2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/></svg>,
  Tag:      () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.59 13.41L11 3.83A2 2 0 0 0 9.59 3.17H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .66 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.52-4.52a2 2 0 0 0 0-2.83z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>,
  Users:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Partners: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 12l5-5 4 4 3-3 4 4"/></svg>,
  File:     () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/></svg>,
  Link:     () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Menu:     () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  ChevL:    () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>,
  ChevR:    () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>,
  Undo:     () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,
  Logout:   () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Check:    () => <svg width="16" height="16" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
};

const NAV = [
  { label: "Overview", items: [
    { id: "dashboard",        label: "Dashboard",           Icon: Icons.Grid },
    { id: "visibility",       label: "Visibility",          Icon: Icons.Eye  },
  ]},
  { label: "Sales", items: [
    { id: "orders",           label: "Orders",  Icon: Icons.Receipt, badgeKey: "orders" },
    { id: "coupons",          label: "Coupons", Icon: Icons.Tag },
    { id: "users",            label: "Users",   Icon: Icons.Users, badgeKey: "users"   },
  ]},
  { label: "Catalog", items: [
    { id: "products",         label: "Products",   Icon: Icons.Box      },
    { id: "stocks",           label: "Stocks",     Icon: Icons.Stocks   },
    { id: "categories",       label: "Categories", Icon: Icons.Layers   },
    { id: "brands",           label: "Brands",     Icon: Icons.Tag      },
    { id: "attributes",       label: "Attributes", Icon: Icons.Layers   },
    { id: "product_mapping",  label: "Product Mapping", Icon: Icons.Link, badgeKey: "unlinked_products" },
  ]},
  { label: "Content", items: [
    { id: "clients_partners", label: "Clients & Partners",  Icon: Icons.Partners },
    { id: "blogs",            label: "Blog",                Icon: Icons.File     },
  ]},
  { label: "Administration", superadminOnly: true, items: [
    { id: "manage_admins",    label: "Manage Admins", Icon: Icons.Users },
  ]},
];

const TITLES = {
  dashboard: "Dashboard", visibility: "Visibility", products: "Products",
  catalog: "Categories & Brands", taxonomy: "Categories & Brands",
  stocks: "Stocks", categories: "Categories", brands: "Brands", attributes: "Attributes",
  product_mapping: "Product Mapping",
  orders: "Orders", coupons: "Coupons", users: "Users",
  clients_partners: "Clients & Partners", blogs: "Blog",
  manage_admins: "Manage Admins",
};

export function AdminShell({ section, onNavigate, pageTransitioning, currentUser, signOut, undoLastChange, isSuperAdmin,
  newOrdersBadge, newUsersBadge, unlinkedProductsBadge, toast, children }) {

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("adminSidebarCollapsed") === "1");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Page-transition overlay state/timing is owned by AdminPage.jsx (via
  // useAdminPageTransition) so the sidebar here and other triggers — the
  // dashboard's stat cards, "Synchronize Stocks" — all share one overlay
  // instead of each running their own timers.
  function navigate(id) {
    setMobileOpen(false);
    onNavigate(id);
  }

  function toggleCollapse() {
    const n = !collapsed;
    setCollapsed(n);
    localStorage.setItem("adminSidebarCollapsed", n ? "1" : "0");
  }

  const badges = { orders: newOrdersBadge, users: newUsersBadge, unlinked_products: unlinkedProductsBadge };

  /* ── shared sidebar markup ── */
  const Sidebar = (
    <div className="flex flex-col h-full">
      {/* top: logo + collapse btn */}
      <div className="flex items-center justify-between gap-2 px-4 py-5 border-b border-white/[0.06]">
        {collapsed
          ? <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">SW</div>
          : <img src="/logo.png" alt="Sports Way" className="h-8 w-auto object-contain brightness-0 invert flex-1 min-w-0" />
        }
        <button onClick={toggleCollapse} style={{ cursor:"pointer" }}
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg border border-white/10 text-slate-500 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
          {collapsed ? <Icons.ChevR /> : <Icons.ChevL />}
        </button>
        <button onClick={() => setMobileOpen(false)} style={{ cursor:"pointer" }}
          className="flex lg:hidden w-7 h-7 items-center justify-center rounded-lg text-slate-400 hover:text-white">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* email pill */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-slate-500 truncate">
          {currentUser?.email}
        </div>
      )}

      {/* nav */}
      <nav className="flex-1 overflow-y-auto admin-scroll px-3 py-4 space-y-5">
        {NAV.filter(group => !group.superadminOnly || isSuperAdmin).map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold tracking-widest uppercase text-slate-600">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ id, label, Icon, badgeKey }) => {
                const active = section === id || (id === "catalog" && section === "taxonomy");
                const badge  = badgeKey ? badges[badgeKey] : 0;
                return (
                  <button key={id} onClick={() => navigate(id)} title={collapsed ? label : undefined}
                    style={{ cursor: "pointer" }}
                    className={[
                      "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all",
                      collapsed ? "justify-center" : "",
                      active
                        ? "bg-brand-600/15 text-brand-400 font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]",
                    ].join(" ")}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-500 rounded-r-full" />
                    )}
                    <span className={active ? "text-brand-400" : "text-slate-500 group-hover:text-white"}>
                      <Icon />
                    </span>
                    {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
                    {!collapsed && badge > 0 && (
                      <span className="px-1.5 h-5 min-w-[20px] bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                    {collapsed && badge > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* footer actions */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-1">
        <button onClick={undoLastChange} style={{ cursor:"pointer" }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors">
          <Icons.Undo /> {!collapsed && <span>Undo</span>}
        </button>
        <button onClick={signOut} style={{ cursor:"pointer" }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-500/70 hover:text-red-300 hover:bg-red-500/10 transition-colors">
          <Icons.Logout /> {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8fafc", color:"#111827", fontFamily:"'Inter',system-ui,sans-serif" }}>
      {/* mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:30, backdropFilter:"blur(4px)" }} />
      )}

      {/* ── Desktop sidebar ────────────── */}
      <aside style={{
        width: collapsed ? 72 : 248,
        minWidth: collapsed ? 72 : 248,
        background:"#0f172a",
        borderRight:"1px solid rgba(255,255,255,0.06)",
        position:"sticky", top:0, height:"100vh",
        overflowY:"auto", overflowX:"hidden",
        transition:"width 0.2s ease, min-width 0.2s ease",
        flexShrink:0, display:"flex", flexDirection:"column",
        zIndex:40,
      }}
        className="hidden lg:flex admin-scroll"
      >
        {Sidebar}
      </aside>

      {/* ── Mobile drawer ──────────────── */}
      <aside style={{
        position:"fixed", top:0, left:0, height:"100vh",
        width:260, background:"#0f172a",
        borderRight:"1px solid rgba(255,255,255,0.06)",
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        transition:"transform 0.25s ease",
        zIndex:40, display:"flex", flexDirection:"column",
        boxShadow: mobileOpen ? "8px 0 24px rgba(0,0,0,0.4)" : "none",
      }}>
        {Sidebar}
      </aside>

      {/* ── Main content ───────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>

        {/* topbar */}
        <header style={{
          display:"flex", alignItems:"center", gap:14,
          padding:"0 28px", height:56,
          background:"#fff", borderBottom:"1px solid #e2e8f0",
          boxShadow:"0 1px 3px rgba(0,0,0,0.06)",
          position:"sticky", top:0, zIndex:30, flexShrink:0,
        }}>
          {/* hamburger — mobile only */}
          <button onClick={() => setMobileOpen(true)} style={{ cursor:"pointer" }}
            className="flex lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100">
            <Icons.Menu />
          </button>

          {/* breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13 }}>
            <span style={{ color:"#94a3b8", fontWeight:500 }}>Admin</span>
            <span style={{ color:"#cbd5e1" }}>›</span>
            <span style={{ fontWeight:700, color:"#1e293b" }}>{TITLES[section] || section}</span>
          </div>

          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
            {newOrdersBadge > 0 && (
              <button onClick={() => navigate("orders")}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px",
                  background:"#fff1f2", border:"1px solid #fecdd3", borderRadius:20,
                  fontSize:11, fontWeight:600, color:"#be123c", cursor:"pointer" }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#e63946" }} />
                {newOrdersBadge} new order{newOrdersBadge > 1 ? "s" : ""}
              </button>
            )}
            {newUsersBadge > 0 && (
              <button onClick={() => navigate("users")}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px",
                  background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:20,
                  fontSize:11, fontWeight:600, color:"#475569", cursor:"pointer" }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#94a3b8" }} />
                {newUsersBadge} new user{newUsersBadge > 1 ? "s" : ""}
              </button>
            )}
            <div style={{ width:32, height:32, borderRadius:"50%", background:"#e63946",
              color:"#fff", fontSize:12, fontWeight:800,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {currentUser?.email?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* toast */}
        {toast && (
          <div key={toast} className="admin-toast-anim" style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
            display:"flex", alignItems:"center", gap:10, padding:"12px 18px",
            background:"#0f172a", color:"#fff", borderRadius:12,
            boxShadow:"0 20px 40px rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.08)",
            fontSize:13, fontWeight:500, zIndex:1000, whiteSpace:"nowrap" }}>
            <Icons.Check />
            {toast}
          </div>
        )}

        {/* scrollable page content — key={section} replays the fade-in on every navigation */}
        <div style={{ flex:1, overflowY:"auto" }} className="admin-scroll">
          <div key={section} className="admin-page-transition">
            {children}
          </div>
        </div>
      </div>

      {/* Full-screen dark overlay during page transitions — its duration
          stays in sync with admin.css via the effect above. */}
      <BrandLoader visible={pageTransitioning} />
    </div>
  );
}
