import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatPrice } from "../../lib/format";
import { listOrderDocuments, openOrderDocument } from "../../lib/fastapiClient";
import { showAlert } from "../../lib/dialog.jsx";

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

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META["Processing"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border ${m.bg} ${m.text} ${m.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.dot}`} />
      {status}
    </span>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-slate-700 mt-0.5">{value || <span className="italic text-slate-300">—</span>}</p>
    </div>
  );
}

export function AdminOrderModal({ order, onClose, onStatusChange, getAccessToken }) {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [openingDoc, setOpeningDoc] = useState(null);

  useEffect(() => {
    if (!order) return;
    let active = true;
    setLoadingDocs(true);
    (async () => {
      try {
        const token = await getAccessToken();
        const { documents: docs } = await listOrderDocuments(order.order_id, token);
        if (active) setDocuments(docs || []);
      } catch (error) {
        console.error("Failed to load order documents:", error);
      } finally {
        if (active) setLoadingDocs(false);
      }
    })();
    return () => { active = false; };
  }, [order?.order_id]);

  if (!order) return null;

  async function handleOpenDoc(kind) {
    setOpeningDoc(kind);
    try {
      const token = await getAccessToken();
      await openOrderDocument(order.order_id, kind, token);
    } catch (error) {
      showAlert(error.message || "Unable to open that document.");
    } finally {
      setOpeningDoc(null);
    }
  }

  const items = order.items || [];

  // Portaled straight to <body>: rendered from inside AdminOrders.jsx, which
  // sits under AdminShell's page-transition wrapper — that wrapper animates
  // `transform`, which creates a new containing block per the CSS spec and
  // breaks `position: fixed` on anything nested inside it (same bug BrandLoader
  // had). Without the portal the overlay only covered its scrolled ancestor,
  // not the real viewport — hence the header staying visible above it.
  return createPortal(
    <div
      className="fixed inset-0 z-[900] bg-slate-950/75 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
      style={{ animation: "admin-hero-in var(--admin-motion-duration) var(--admin-motion-easing) both" }}
    >
      <div
        className="admin-modal-scroll bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 25px 80px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-black text-slate-900 font-mono">{order.order_id}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={order.status || "Processing"}
              onChange={(e) => onStatusChange(order.id, e.target.value)}
              style={{ cursor: "pointer" }}
              className="h-9 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-brand-400 transition-colors"
            >
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={onClose}
              style={{ cursor: "pointer" }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer — billing_details is the exact, full-fidelity copy of
              everything typed at checkout (guest or logged-in); falls back
              to the flat fields for older orders placed before that column
              existed. */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Customer</h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
              <Field label="Name" value={order.customer_name} />
              <Field label="Company" value={order.billing_details?.company || order.company} />
              <Field label="Email" value={order.billing_details?.email || order.email} />
              <Field label="Phone" value={order.billing_details?.phone || order.phone} />
              {order.billing_details ? (
                <>
                  <Field label="Address Line 1" value={order.billing_details.address1} />
                  <Field label="Address Line 2" value={order.billing_details.address2} />
                  <Field label="City" value={order.billing_details.city} />
                  <Field label="Zone / State" value={order.billing_details.zone} />
                  <Field label="ZIP" value={order.billing_details.zip} />
                  <Field label="Country" value={order.billing_details.country} />
                </>
              ) : (
                <div className="col-span-2">
                  <Field label="Address" value={order.address} />
                </div>
              )}
            </div>
          </section>

          {/* Products */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Products</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Qty</th>
                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-6 text-center text-slate-400 italic">No items</td></tr>
                  ) : items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 font-medium text-slate-700">
                        {item.name}
                        {item.dolibarrRef && <span className="ml-2 text-[10px] text-slate-400 font-mono">({item.dolibarrRef})</span>}
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate-500">{item.qty || 1}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500">{formatPrice(Number(item.price || 0))}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-800">{formatPrice(Number(item.price || 0) * Number(item.qty || 1))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Summary + Payment */}
          <div className="grid grid-cols-2 gap-4">
            <section>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Summary</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold">{formatPrice(order.subtotal || 0)}</span></div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon discount {order.coupon_code && `(${order.coupon_code})`}</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span>{order.shipping > 0 ? formatPrice(order.shipping) : "Free"}</span></div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 font-black text-slate-900 text-base"><span>Total</span><span>{formatPrice(order.total || 0)}</span></div>
              </div>
            </section>
            <section>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Payment</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-sm">
                <Field label="Method" value={order.payment_method} />
                {order.payment_reference && <Field label="Reference" value={order.payment_reference} />}
              </div>
            </section>
          </div>

          {order.notes && (
            <section>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Notes</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">{order.notes}</div>
            </section>
          )}

          {/* Dolibarr */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Dolibarr</h3>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              {!order.dolibarr_order_id ? (
                <p className="text-sm text-slate-400 italic">Not yet created in Dolibarr.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    {order.dolibarr_order_id && <span className="text-slate-500">Order #<span className="font-mono text-slate-700">{order.dolibarr_order_id}</span></span>}
                    {order.dolibarr_invoice_id && <span className="text-slate-500">Invoice #<span className="font-mono text-slate-700">{order.dolibarr_invoice_id}</span></span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {loadingDocs ? (
                      <p className="text-xs text-slate-400">Checking available documents…</p>
                    ) : documents.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No PDFs generated in Dolibarr yet.</p>
                    ) : documents.map((doc) => (
                      <button
                        key={doc.kind}
                        onClick={() => handleOpenDoc(doc.kind)}
                        disabled={openingDoc === doc.kind}
                        style={{ cursor: openingDoc === doc.kind ? "wait" : "pointer" }}
                        className="flex items-center gap-2 h-8 px-3 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        {openingDoc === doc.kind ? "Opening…" : doc.label} PDF
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
