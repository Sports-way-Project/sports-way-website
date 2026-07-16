import { useState } from "react";
import { formatPrice } from "../../lib/format";
import { useAdminModal } from "./AdminModal";
import { AdminHero } from "./AdminHero";

const INIT = { code:"", discountType:"percentage", discount:"", limitPerCoupon:"", limitPerItems:"", limitPerUser:"1", specificProducts:"" };

export function AdminCoupons({ coupons, onSave, onDelete }) {
  const { showConfirm } = useAdminModal();
  const [form, setForm]   = useState(INIT);
  const [saving, setSaving] = useState(false);

  function f(key) { return e => setForm(prev => ({ ...prev, [key]: e.target.value })); }

  async function handleSave() {
    if (!form.code.trim() || !form.discount) return;
    setSaving(true);
    await onSave({
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discount: Number(form.discount),
      limitPerCoupon: form.limitPerCoupon === "" ? null : Number(form.limitPerCoupon),
      limitPerItems:  form.limitPerItems  === "" ? null : Number(form.limitPerItems),
      limitPerUser:   form.limitPerUser   === "" ? null : Number(form.limitPerUser),
      specificProducts: form.specificProducts ? form.specificProducts.split(",").map(s=>s.trim()).filter(Boolean) : [],
    });
    setForm(INIT);
    setSaving(false);
  }

  async function handleDelete(code) {
    const ok = await showConfirm(`Delete coupon "${code}"?`, { title:"Delete coupon", okLabel:"Delete", type:"error" });
    if (ok) onDelete(code);
  }

  const inp = "w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 focus:bg-white transition-all";
  const lbl = "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.59 13.41L11 3.83A2 2 0 0 0 9.59 3.17H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .66 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.52-4.52a2 2 0 0 0 0-2.83z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>}
        title="Coupons"
        subtitle={`${coupons.length} active coupon${coupons.length !== 1 ? "s" : ""}`}
      />

      {/* Add form */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <h2 className="text-sm font-bold text-slate-800">Create New Coupon</h2>
        </div>
        <div className="p-6 grid grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1">
            <label className={lbl}>Coupon Code *</label>
            <input value={form.code} onChange={f("code")} placeholder="e.g. SUMMER20" className={inp}
              onInput={e => e.target.value = e.target.value.toUpperCase()} />
          </div>
          <div>
            <label className={lbl}>Discount Type</label>
            <select value={form.discountType} onChange={f("discountType")} style={{ cursor:"pointer" }} className={inp}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed_cart">Fixed Cart (QAR)</option>
              <option value="fixed_product">Fixed Product (QAR)</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Amount / % *</label>
            <input type="number" min="0" value={form.discount} onChange={f("discount")}
              placeholder={form.discountType === "percentage" ? "e.g. 20" : "e.g. 50"} className={inp} />
          </div>
          <div>
            <label className={lbl}>Global usage limit</label>
            <input type="number" min="0" value={form.limitPerCoupon} onChange={f("limitPerCoupon")} placeholder="Unlimited" className={inp} />
          </div>
          <div>
            <label className={lbl}>Per user limit</label>
            <input type="number" min="0" value={form.limitPerUser} onChange={f("limitPerUser")} placeholder="1" className={inp} />
          </div>
          <div>
            <label className={lbl}>Max discounted items</label>
            <input type="number" min="0" value={form.limitPerItems} onChange={f("limitPerItems")} placeholder="Unlimited" className={inp} />
          </div>
          <div className="col-span-2 lg:col-span-3">
            <label className={lbl}>Specific products (comma-separated partial names)</label>
            <input value={form.specificProducts} onChange={f("specificProducts")} placeholder="Leave blank for all products, or type: Treadmill, Dumbbell..." className={inp} />
          </div>
          <div className="col-span-2 lg:col-span-3 flex justify-end">
            <button onClick={handleSave} disabled={saving || !form.code.trim() || !form.discount} style={{ cursor: saving ? "wait":"pointer" }}
              className="h-10 px-8 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
              {saving ? "Saving..." : "Create Coupon"}
            </button>
          </div>
        </div>
      </div>

      {/* Coupons list */}
      {coupons.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-14 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" fill="none" stroke="#94a3b8" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M20.59 13.41L11 3.83A2 2 0 0 0 9.59 3.17H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .66 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.52-4.52a2 2 0 0 0 0-2.83z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>
          </div>
          <p className="text-sm font-semibold text-slate-500">No coupons yet</p>
          <p className="text-xs text-slate-400 mt-1">Create your first coupon above</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50/70">
                  {["Code","Type","Discount","Used","Limit","Per User","Products",""].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {coupons.map(c => (
                  <tr key={c.code} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">{c.code}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 capitalize">{c.discountType.replace("_", " ")}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-brand-600">
                        {c.discountType === "percentage" ? `${c.discount}%` : formatPrice(Number(c.discount || 0))}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-400 rounded-full transition-all"
                            style={{ width: c.limitPerCoupon ? `${Math.min(100,(c.usedCount||0)/c.limitPerCoupon*100)}%` : "0%" }} />
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{c.usedCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{c.limitPerCoupon ?? <span className="text-slate-300 italic">Unlimited</span>}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{c.limitPerUser ?? <span className="text-slate-300 italic">Unlimited</span>}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 max-w-[140px] truncate">
                      {(c.specificProducts || []).length ? c.specificProducts.join(", ") : <span className="italic">All products</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => handleDelete(c.code)} style={{ cursor:"pointer" }}
                        className="opacity-0 group-hover:opacity-100 h-7 px-3 flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4h4v2"/></svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
