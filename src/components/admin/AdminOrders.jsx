import { useState, useMemo, useEffect, Fragment } from "react";
import { formatPrice } from "../../lib/format";
import { showConfirm } from "../../lib/dialog.jsx";
import { AdminHero } from "./AdminHero";
import { AdminOrderModal } from "./AdminOrderModal";

const STATUS_META = {
  "Processing":       { bg: "bg-blue-50",    text: "text-blue-600",    dot: "bg-blue-400",    border: "border-blue-200"    },
  "Pending Payment":  { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-400",   border: "border-amber-200"   },
  "Confirmed":        { bg: "bg-indigo-50",  text: "text-indigo-600",  dot: "bg-indigo-400",  border: "border-indigo-200"  },
  "Shipped":          { bg: "bg-violet-50",  text: "text-violet-600",  dot: "bg-violet-400",  border: "border-violet-200"  },
  "Out for Delivery": { bg: "bg-cyan-50",    text: "text-cyan-600",    dot: "bg-cyan-400",    border: "border-cyan-200"    },
  "Delivered":        { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  "Cancelled":        { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400",     border: "border-red-200"     },
  "Failed":           { bg: "bg-slate-100",  text: "text-slate-500",   dot: "bg-slate-400",   border: "border-slate-200"   },
};

const ALL_STATUSES = ["Pending Payment","Processing","Confirmed","Shipped","Out for Delivery","Delivered","Cancelled","Failed"];
const PAGE_SIZE = 15;

export function AdminOrders({ orders, onStatusChange, onRefresh, onDelete, canDelete = true, getAccessToken, openOrderId, onOpenOrderHandled, onOrderSeen }) {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [page, setPage]           = useState(1);
  const [viewingOrderId, setViewingOrderId] = useState(null);
  const viewingOrder = orders.find(o => o.id === viewingOrderId) || null;
  const [deletingId, setDeletingId] = useState(null);

  // Opens a specific order's modal when navigated here from elsewhere (the
  // dashboard's Recent Orders list) instead of a plain nav-item click.
  useEffect(() => {
    if (openOrderId) {
      setViewingOrderId(openOrderId);
      onOrderSeen?.(openOrderId);
      onOpenOrderHandled?.();
    }
  }, [openOrderId]);

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter !== "all") list = list.filter(o => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.order_id?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.phone?.includes(q)
      );
    }
    return [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [orders, statusFilter, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const revenue = orders.filter(o => !["Cancelled","Failed"].includes(o.status))
    .reduce((s, o) => s + Number(o.total || 0), 0);

  const counts = useMemo(() => {
    const map = { all: orders.length };
    orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1; });
    return map;
  }, [orders]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 2h16v20l-3-2-2.5 2-2.5-2-2.5 2L7 20l-3 2V2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/></svg>}
        title="Orders"
        subtitle={`${orders.length} total orders · ${formatPrice(revenue)} revenue`}
        actions={
          <button onClick={onRefresh} style={{ cursor:"pointer" }}
            className="flex items-center gap-2 h-9 px-4 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
            Refresh
          </button>
        }
      />

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by order ID, customer name, email or phone..."
          className="w-full h-12 pl-12 pr-10 bg-white border-2 border-slate-200 focus:border-brand-400 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all shadow-sm cursor-text" />
        {search && <button onClick={() => setSearch("")} style={{ cursor:"pointer" }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 text-sm font-bold">x</button>}
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <button style={{ cursor:"pointer" }} onClick={() => { setStatus("all"); setPage(1); }}
          className={`flex items-center gap-2 h-8 px-4 text-xs font-bold rounded-xl border transition-all ${statusFilter === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}>
          All <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-black ${statusFilter === "all" ? "bg-white/20" : "bg-slate-100 text-slate-400"}`}>{orders.length}</span>
        </button>
        {ALL_STATUSES.map(s => {
          const m = STATUS_META[s];
          return (
            <button key={s} style={{ cursor:"pointer" }} onClick={() => { setStatus(s); setPage(1); }}
              className={`flex items-center gap-2 h-8 px-4 text-xs font-bold rounded-xl border transition-all ${
                statusFilter === s ? `${m.bg} ${m.text} ${m.border}` : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              }`}>
              {s}
              {counts[s] > 0 && <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-black ${statusFilter === s ? "bg-white/40" : "bg-slate-100 text-slate-400"}`}>{counts[s]}</span>}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50/70">
                {["Order","Customer","Date","Payment","Total","Status",""].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 2h16v20l-3-2-2.5 2-2.5-2-2.5 2L7 20l-3 2V2z"/></svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-500">{search ? "No orders match your search" : "No orders yet"}</p>
                  </div>
                </td></tr>
              ) : paged.map(order => {
                const isNew = !order.seen;
                return (
                <Fragment key={order.id}>
                  <tr className={`border-b border-slate-50 transition-colors cursor-pointer ${isNew ? "bg-blue-50 hover:bg-blue-100/70" : "hover:bg-slate-50/60"}`}
                    onClick={() => { setViewingOrderId(order.id); onOrderSeen?.(order.id); }}>
                    <td className="px-5 py-3.5">
                      {isNew && (
                        <span className="inline-flex items-center px-1.5 py-0.5 mr-2 rounded-md text-[10px] font-black bg-blue-600 text-white align-middle">NEW</span>
                      )}
                      <p className="text-xs font-bold text-slate-800 font-mono inline align-middle">{order.order_id}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-slate-800">{order.customer_name || "—"}</p>
                      <p className="text-[11px] text-slate-400">{order.email}</p>
                      {order.phone && <p className="text-[11px] text-slate-400">{order.phone}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                      <p className="text-[10px] text-slate-400">{new Date(order.created_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{order.payment_method || "—"}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-black text-slate-900">{formatPrice(Number(order.total || 0))}</p>
                      {order.discount > 0 && <p className="text-[10px] text-emerald-600">-{formatPrice(order.discount)} discount</p>}
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      {(() => {
                        const m = STATUS_META[order.status] || STATUS_META.Processing;
                        return (
                          <div className={`relative inline-flex items-center h-8 pl-4 pr-7 rounded-full border ${m.bg} ${m.text} ${m.border} font-bold text-xs`} style={{ cursor: "pointer" }}>
                            <span className={`w-1.5 h-1.5 rounded-full ${m.dot} mr-2`}></span>
                            {order.status || "Processing"}
                            <svg className="w-3 h-3 absolute right-2 pointer-events-none opacity-60" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                            <select value={order.status || "Processing"}
                              onChange={e => onStatusChange(order.id, e.target.value)}
                              title="Click to change status"
                              style={{ cursor: "pointer" }}
                              className="absolute inset-0 w-full h-full opacity-0">
                              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        {onDelete && canDelete && (
                          <button
                            type="button"
                            disabled={deletingId === order.order_id}
                            style={{ cursor: deletingId === order.order_id ? "not-allowed" : "pointer" }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (deletingId) return;
                              const ok = await showConfirm(`Delete order ${order.order_id}? This cannot be undone.`, {
                                title: "Delete order",
                                confirmText: "Delete",
                                danger: true,
                              });
                              if (!ok) return;
                              setDeletingId(order.order_id);
                              try {
                                await onDelete(order.order_id);
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                            title="Delete order"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>
                          </button>
                        )}
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                      </div>
                    </td>
                  </tr>
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-400">{filtered.length} orders &middot; page {page} of {pages}</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ cursor: page<=1 ? "not-allowed":"pointer" }}
                className="h-8 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors">Prev</button>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={{ cursor: page>=pages ? "not-allowed":"pointer" }}
                className="h-8 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {viewingOrder && (
        <AdminOrderModal
          order={viewingOrder}
          onClose={() => setViewingOrderId(null)}
          onStatusChange={onStatusChange}
          getAccessToken={getAccessToken}
        />
      )}
    </div>
  );
}
