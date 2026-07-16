import { useState } from "react";
import { AdminHero } from "./AdminHero";

/* ─── Clients & Partners tab ─────────────────── */
function LogoGrid({ title, description, icon, items, onAdd, onRemove, nameRef, fileRef, nameState, setName, submitting }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">{icon}</div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          <p className="text-[11px] text-slate-400">{description}</p>
        </div>
        <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{items.length}</span>
      </div>

      {/* Add form */}
      <form onSubmit={onAdd} className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center bg-slate-50/50">
        <input value={nameState} onChange={e => setName(e.target.value)} placeholder="Name (optional)" ref={nameRef}
          className="flex-1 min-w-[160px] h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-400 transition-colors" />
        <label className="flex items-center gap-2 h-9 px-4 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload Logo
          <input type="file" accept="image/*" ref={fileRef} hidden />
        </label>
        <button type="submit" disabled={submitting} style={{ cursor: submitting ? "wait":"pointer" }}
          className="h-9 px-5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50">
          {submitting ? "Adding..." : "Add"}
        </button>
      </form>

      {/* Grid */}
      <div className="p-5">
        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No {title.toLowerCase()} added yet</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {items.map((item, i) => (
              <div key={i} className="group bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-slate-300 hover:shadow-sm transition-all">
                <img src={item.image} alt={item.name || "logo"} className="h-12 w-full object-contain" />
                {item.name && <p className="text-[11px] font-semibold text-slate-500 text-center truncate w-full">{item.name}</p>}
                <button onClick={() => onRemove(i)} style={{ cursor:"pointer" }}
                  className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-red-400 hover:text-red-600 transition-all">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main export ────────────────────────────── */
export function AdminContent({
  clients, onAddClient, onRemoveClient,
  partners, onAddPartner, onRemovePartner,
}) {
  const [tab, setTab] = useState("clients");
  const [clientName, setClientName]   = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [clientAdding, setClientAdding]   = useState(false);
  const [partnerAdding, setPartnerAdding] = useState(false);
  const [clientFile, setClientFile]   = useState(null);
  const [partnerFile, setPartnerFile] = useState(null);

  const clientFileRef  = { current: null };
  const partnerFileRef = { current: null };

  async function handleAddClient(e) {
    e.preventDefault();
    if (!clientFile) return;
    setClientAdding(true);
    try {
      await onAddClient(clientName, clientFile);
      setClientName("");
      setClientFile(null);
      if (document.getElementById("client-file-input")) document.getElementById("client-file-input").value = "";
    } finally {
      setClientAdding(false);
    }
  }

  async function handleAddPartner(e) {
    e.preventDefault();
    if (!partnerFile) return;
    setPartnerAdding(true);
    try {
      await onAddPartner(partnerName, partnerFile);
      setPartnerName("");
      setPartnerFile(null);
      if (document.getElementById("partner-file-input")) document.getElementById("partner-file-input").value = "";
    } finally {
      setPartnerAdding(false);
    }
  }

  const TABS = [
    { id: "clients",  label: "Clients",  count: clients.length  },
    { id: "partners", label: "Partners", count: partners.length },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/></svg>}
        title="Clients & Partners"
        subtitle="Manage client logos and partner logos shown on the storefront"
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} style={{ cursor:"pointer" }} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl transition-all ${
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {t.label}
            <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md ${tab === t.id ? "bg-slate-100 text-slate-600" : "bg-slate-200/60 text-slate-400"}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "clients" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Client Logos</h2>
              <p className="text-[11px] text-slate-400">Shown on the /clients page</p>
            </div>
            <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{clients.length}</span>
          </div>
          <form onSubmit={handleAddClient} className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center bg-slate-50/50">
            <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client name (optional)"
              className="flex-1 min-w-[160px] h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-400 transition-colors" />
            <label className="flex items-center gap-2 h-9 px-4 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {clientFile ? clientFile.name.slice(0, 22) + (clientFile.name.length > 22 ? "…" : "") : "Upload Logo *"}
              <input id="client-file-input" type="file" accept="image/*" hidden onChange={e => setClientFile(e.target.files[0] || null)} />
            </label>
            <button type="submit" disabled={clientAdding} style={{ cursor: clientAdding?"wait":"pointer" }}
              className="h-9 px-5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50">
              {clientAdding ? "Adding..." : "Add Client"}
            </button>
          </form>
          <div className="p-5">
            {clients.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No clients added yet</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {clients.map((c, i) => (
                  <div key={i} title={c.name || undefined} style={{ cursor: "pointer" }}
                    className="group bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-slate-300 hover:shadow-sm transition-all">
                    <img src={c.image} alt={c.name} className="h-10 w-full object-contain" />
                    {c.name && <p className="text-[10px] font-semibold text-slate-500 text-center truncate w-full">{c.name}</p>}
                    <button onClick={() => onRemoveClient(i)} style={{ cursor:"pointer" }}
                      className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-red-400 hover:text-red-600 transition-all">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "partners" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 12l5-5 4 4 3-3 4 4"/></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Partner Logos</h2>
              <p className="text-[11px] text-slate-400">Shown on the /partners page</p>
            </div>
            <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{partners.length}</span>
          </div>
          <form onSubmit={handleAddPartner} className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center bg-slate-50/50">
            <input value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="Partner name (optional)"
              className="flex-1 min-w-[160px] h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-400 transition-colors" />
            <label className="flex items-center gap-2 h-9 px-4 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {partnerFile ? partnerFile.name.slice(0, 22) + (partnerFile.name.length > 22 ? "…" : "") : "Upload Logo *"}
              <input id="partner-file-input" type="file" accept="image/*" hidden onChange={e => setPartnerFile(e.target.files[0] || null)} />
            </label>
            <button type="submit" disabled={partnerAdding} style={{ cursor: partnerAdding?"wait":"pointer" }}
              className="h-9 px-5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50">
              {partnerAdding ? "Adding..." : "Add Partner"}
            </button>
          </form>
          <div className="p-5">
            {partners.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No partners added yet</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {partners.map((p, i) => (
                  <div key={i} title={p.name || undefined} style={{ cursor: "pointer" }}
                    className="group bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-slate-300 hover:shadow-sm transition-all">
                    <img src={p.image} alt={p.name} className="h-10 w-full object-contain" />
                    {p.name && <p className="text-[10px] font-semibold text-slate-500 text-center truncate w-full">{p.name}</p>}
                    <button onClick={() => onRemovePartner(i)} style={{ cursor:"pointer" }}
                      className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-red-400 hover:text-red-600 transition-all">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
