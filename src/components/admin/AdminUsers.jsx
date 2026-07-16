import { useState, useMemo } from "react";
import { showConfirm } from "../../lib/dialog.jsx";
import { isAdmin, isSuperAdmin } from "../../lib/roles";
import { AdminHero } from "./AdminHero";

const PAGE_SIZE = 18;

export function AdminUsers({ users, userOrderCounts, onDelete, canDelete = true }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage]     = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  const filtered = useMemo(() => {
    let list = users;
    if (filter === "marketing") list = list.filter(u => u.marketing_opt_in);
    if (filter === "ordered")   list = list.filter(u => (userOrderCounts[u.email] || 0) > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
      );
    }
    return [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [users, filter, search, userOrderCounts]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const totalOrders = Object.values(userOrderCounts).reduce((s, n) => s + n, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        title="Customers"
        subtitle={`${users.length} registered accounts · ${totalOrders} total orders placed`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Customers", value: users.length,       color: "text-slate-800" },
          { label: "Marketing Opt-in", value: users.filter(u => u.marketing_opt_in).length, color: "text-emerald-600" },
          { label: "Have Ordered",     value: Object.values(userOrderCounts).filter(n => n > 0).length, color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email or phone..."
          className="w-full h-12 pl-12 pr-10 bg-white border-2 border-slate-200 focus:border-brand-400 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all shadow-sm cursor-text" />
        {search && <button onClick={() => setSearch("")} style={{ cursor:"pointer" }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 text-sm font-bold">x</button>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all",       label: "All customers", count: users.length },
          { key: "ordered",   label: "Have ordered",  count: Object.values(userOrderCounts).filter(n => n > 0).length },
          { key: "marketing", label: "Subscribed",    count: users.filter(u => u.marketing_opt_in).length },
        ].map(({ key, label, count }) => (
          <button key={key} style={{ cursor:"pointer" }} onClick={() => { setFilter(key); setPage(1); }}
            className={`flex items-center gap-2 h-8 px-4 text-xs font-bold rounded-xl border transition-all ${
              filter === key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}>
            {label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-black ${filter === key ? "bg-white/20" : "bg-slate-100 text-slate-400"}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50/70">
                {["Customer","Contact","Role","Address","Orders","Marketing","Joined",""].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-20 text-center">
                  <p className="text-sm font-semibold text-slate-500">{search ? "No customers match your search" : "No customers yet"}</p>
                </td></tr>
              ) : paged.map(user => {
                const orderCount = userOrderCounts[user.email] || 0;
                return (
                  <tr key={user.id || user.email} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                          {(user.name || user.email || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{user.name || "—"}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{isAdmin(user.role) ? "Admin" : "Customer"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-slate-700">{user.email || "—"}</p>
                      {user.phone && <p className="text-[11px] text-slate-400 mt-0.5">{user.phone}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                        isSuperAdmin(user.role)
                          ? "bg-violet-50 text-violet-700 border-violet-200"
                          : isAdmin(user.role)
                          ? "bg-brand-50 text-brand-600 border-brand-200"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}>
                        {isSuperAdmin(user.role) ? "Superadmin" : isAdmin(user.role) ? "Admin" : "Customer"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[160px]">
                      <p className="text-xs text-slate-500 truncate">{user.billing_address || user.shipping_address || "—"}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black ${
                        orderCount > 0 ? "bg-brand-50 text-brand-600 border border-brand-200" : "bg-slate-100 text-slate-400"
                      }`}>
                        {orderCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                        user.marketing_opt_in
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}>
                        {user.marketing_opt_in ? (
                          <><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Subscribed</>
                        ) : "Not subscribed"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {onDelete && canDelete && !isAdmin(user.role) && (
                        <button
                          type="button"
                          disabled={deletingId === (user.id || user.email)}
                          style={{ cursor: deletingId === (user.id || user.email) ? "not-allowed" : "pointer" }}
                          onClick={async () => {
                            if (deletingId) return;
                            const ok = await showConfirm(
                              `Delete the account for ${user.email}? This removes their login, cart, wishlist and profile. Their past orders are kept but unlinked from any account. This cannot be undone.`,
                              { title: "Delete customer account", confirmText: "Delete", danger: true },
                            );
                            if (!ok) return;
                            const key = user.id || user.email;
                            setDeletingId(key);
                            try {
                              await onDelete(user);
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          title="Delete account"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-400">{filtered.length} customers &middot; page {page} of {pages}</p>
            <div className="flex gap-1">
              <button disabled={page<=1} onClick={() => setPage(p=>p-1)} style={{ cursor: page<=1?"not-allowed":"pointer" }}
                className="h-8 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50">Prev</button>
              <button disabled={page>=pages} onClick={() => setPage(p=>p+1)} style={{ cursor: page>=pages?"not-allowed":"pointer" }}
                className="h-8 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
