import { formatPrice } from "../../lib/format";

function StatCard({ title, value, sub, icon, color, onClick, warnings }) {
  const colors = {
    red:   { grad: "from-brand-500 to-brand-600",     ring: "group-hover:ring-brand-100"   },
    blue:  { grad: "from-blue-500 to-indigo-600",      ring: "group-hover:ring-blue-100"    },
    green: { grad: "from-emerald-500 to-teal-600",     ring: "group-hover:ring-emerald-100" },
    amber: { grad: "from-amber-400 to-orange-500",     ring: "group-hover:ring-amber-100"   },
  };
  const c = colors[color] || colors.red;
  return (
    <div
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
      className={`group bg-brand-50/40 rounded-2xl border border-brand-100 shadow-md hover:shadow-xl ring-0 ring-offset-0 ${c.ring} transition-all duration-200 flex flex-col overflow-hidden`}
    >
      <div className="p-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{title}</p>
          <p className="text-[28px] leading-none font-black text-slate-900 tracking-tight">{value}</p>
          {sub && <p className="text-[11px] text-slate-400 mt-2 font-medium">{sub}</p>}
        </div>
        <div className={`bg-gradient-to-br ${c.grad} w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-md transition-transform duration-200 group-hover:scale-105 group-hover:rotate-3`}>
          {icon}
        </div>
      </div>
      {warnings?.length > 0 && (
        <div className="mt-auto px-5 pb-4 pt-1 flex flex-wrap gap-1.5">
          {warnings.map((w) => (
            <button
              key={w.label}
              type="button"
              onClick={w.onClick}
              style={{ cursor: w.onClick ? "pointer" : "default" }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-brand-200 text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span className="text-[10.5px] font-bold whitespace-nowrap">{w.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_STYLES = {
  Processing:      "bg-blue-50 text-blue-600 border-blue-200",
  Shipped:         "bg-indigo-50 text-indigo-600 border-indigo-200",
  Delivered:       "bg-emerald-50 text-emerald-600 border-emerald-200",
  Cancelled:       "bg-red-50 text-red-500 border-red-200",
  "Pending Payment": "bg-amber-50 text-amber-600 border-amber-200",
};

export function AdminDashboard({ orders, users, products, onNavigate, onSyncStocks, onViewOrder }) {
  const revenue = orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + Number(o.total || 0), 0);
  const recent = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
  const outOfStockCount = products.filter((p) => p.stockStatus === "outofstock").length;
  const unlinkedCount = products.filter((p) => !p.dolibarr_id).length;

  return (
    <div className="p-6 lg:p-8 space-y-8">

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatPrice(revenue)}
          sub="Excluding cancelled"
          color="red"
          onClick={() => onNavigate("orders")}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <StatCard
          title="Orders"
          value={orders.length}
          sub={`${orders.filter((o) => o.status === "Processing").length} processing`}
          color="blue"
          onClick={() => onNavigate("orders")}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 2h16v20l-3-2-2.5 2-2.5-2-2.5 2L7 20l-3 2V2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/></svg>}
        />
        <StatCard
          title="Customers"
          value={users.length}
          sub="Registered accounts"
          color="green"
          onClick={() => onNavigate("users")}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard
          title="Products"
          value={products.length}
          sub="Total in catalog"
          color="amber"
          onClick={() => onNavigate("products")}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>}
          warnings={[
            outOfStockCount > 0 ? {
              label: `${outOfStockCount} out of stock`,
              onClick: () => onNavigate("stocks"),
            } : null,
            unlinkedCount > 0 ? {
              label: `${unlinkedCount} not linked to Dolibarr`,
              onClick: () => onNavigate("product_mapping"),
            } : null,
          ].filter(Boolean)}
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onNavigate("products")}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Product
        </button>
        <button
          onClick={() => onSyncStocks?.()}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-md border border-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Synchronize Stocks
        </button>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent orders */}
        <div
          onClick={() => onNavigate("orders")}
          style={{ cursor: "pointer" }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-xl transition-shadow overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Recent Orders</h2>
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate("orders"); }}
              className="text-xs text-brand-600 font-semibold hover:text-brand-700"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recent.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">No orders yet.</p>
            ) : recent.map((o) => (
              <div
                key={o.id}
                onClick={(e) => { e.stopPropagation(); onViewOrder?.(o.id); }}
                style={{ cursor: "pointer" }}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/60 transition-colors"
              >
                {!o.seen && <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" title="Not yet viewed" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{o.customer_name || o.email || "—"}</p>
                  <p className="text-[11px] text-slate-400">{o.order_id} · {new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-sm font-bold text-slate-700 flex-shrink-0">{formatPrice(o.total)}</p>
                <span className={`flex-shrink-0 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${STATUS_STYLES[o.status] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stock alerts */}
        <div
          onClick={() => onNavigate("stocks")}
          style={{ cursor: "pointer" }}
          className="bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-xl transition-shadow overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Stock Alerts</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-50 text-brand-600 rounded-full border border-brand-200">
              {products.filter((p) => p.stockStatus === "outofstock").length} out
            </span>
          </div>
          <div className="divide-y divide-slate-50 overflow-y-auto max-h-72 scrollbar-thin">
            {products.filter((p) => p.stockStatus !== "instock").length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-8">
                <svg width="28" height="28" fill="none" stroke="#86efac" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <p className="text-sm text-slate-400">All products in stock</p>
              </div>
            ) : products.filter((p) => p.stockStatus !== "instock").map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                {(p.img || p.image) ? (
                  <img src={p.img || p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-slate-100" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-300 text-lg">?</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{p.name}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${p.stockStatus === "outofstock" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>
                    {p.stockStatus === "outofstock" ? "Out of stock" : "Backorder"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
