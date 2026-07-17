import { useEffect, useRef, useState } from "react";
import { searchDolibarrProducts, FASTAPI_URL } from "../../lib/fastapiClient";
import { linkProductToDolibarr } from "../../lib/storefrontApi";
import { showAlert } from "../../lib/dialog.jsx";
import { friendlyApiError } from "../../lib/apiError";
import { effectiveMetaTitle, effectiveMetaDescription } from "../../lib/format";

const CATEGORY_TREE = [
  { label:"Gym Equipment",  value:"gym-equipment",  sub:["Cardio","Treadmills","Bikes","Ellipticals","Rowers","Stairs","Strength","Selectorized","Plate Loaded","Cable Motion","Multi Stations","Racks","Benches","Bars","Weights","Accessories"] },
  { label:"Sports Tools",   value:"sports-tools",   sub:["Football","Basketball","Volleyball","Indoor Sports","Training","Sports Accessories","Gloves","Protectors","Socks","Bags","Caps","Rackets","Bottles"] },
  { label:"Sportswear",     value:"sportswear",     sub:["Men's","Ladies","Kids","Tracksuit","Sports Set","T-Shirt","Polo Shirt","Pants","Shorts"] },
  { label:"Footwear",       value:"footwear",       sub:["Running","Futsal"] },
  { label:"Supplements",    value:"supplements",    sub:["Protein","Creatine","Pre-Workout","Vitamins","Minerals","Fat Burner"] },
  { label:"Flooring",       value:"flooring",       sub:["Gym Mats","Sports Flooring","Rubber","Grass","Vinyl","Wood","Indoor","Outdoor"] },
];
const BADGE_OPTIONS = ["","new","hot","sale","limited","trending"];
const STEP_ICONS = {
  1: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  2: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  3: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>,
  4: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/></svg>,
  5: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
};
const STEPS = [
  { id:1, label:"Website Info"       },
  { id:2, label:"Categories"         },
  { id:3, label:"Dolibarr Link"      },
  { id:4, label:"Stock"              },
  { id:5, label:"Price & Variations" },
];

function toLabel(v) { return v.replace(/-/g," ").replace(/\b\w/g, c => c.toUpperCase()); }

const NON_PRODUCT = new Set(["clients","partners","blog","wholesale","about","contact","clients_partners"]);

function DolibarrThumb({ dolibarrId, size = 40 }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div style={{ width:size, height:size, borderRadius:8, border:"1px solid #e2e8f0", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", padding:size * 0.18, flexShrink:0 }}>
        <img src="/dolibarr-icon.png" alt="No photo in Dolibarr" style={{ width:"100%", height:"100%", objectFit:"contain", opacity:0.6 }} />
      </div>
    );
  }
  return (
    <img
      src={`${FASTAPI_URL}/products/${dolibarrId}/photo`}
      alt=""
      onError={() => setBroken(true)}
      style={{ width:size, height:size, borderRadius:8, objectFit:"cover", border:"1px solid #e2e8f0", flexShrink:0, background:"#fff" }}
    />
  );
}

function SkipDolibarrLinkToggle({ isSkipped, onToggle }) {
  return (
    <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer", paddingTop:6 }}>
      <input
        type="checkbox"
        checked={isSkipped}
        onChange={(e) => onToggle(e.target.checked)}
        style={{ width:16, height:16, marginTop:2, accentColor:"#e63946", cursor:"pointer" }}
      />
      <div>
        <p style={{ fontSize:13, fontWeight:700, color:"#1e293b", margin:0 }}>Skip for now</p>
        <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>You can link this product to Dolibarr later</p>
      </div>
    </label>
  );
}

function VariationDolibarrLink({ variation, onLink }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setStatus(null);
      setResults([]);
      return;
    }
    setStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const found = await searchDolibarrProducts(trimmed);
        setStatus("found");
        setResults(found);
      } catch (e) {
        console.error("Variation Dolibarr search failed:", e);
        setStatus("error");
        setResults([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  if (variation.dolibarr_id) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:8, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"6px 10px" }}>
        <DolibarrThumb dolibarrId={variation.dolibarr_id} size={26} />
        <span style={{ fontSize:11, fontWeight:700, color:"#15803d", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {variation.dolibarr_ref}
        </span>
        <button onClick={() => onLink({ dolibarr_id: null, dolibarr_ref: null })}
          style={{ height:24, padding:"0 8px", background:"#fff", color:"#15803d", border:"1px solid #bbf7d0", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} style={{ position:"relative" }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Link to Dolibarr…"
        style={{ width:"100%", height:34, padding:"0 10px", background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:11, fontWeight:500, color:"#1e293b", outline:"none", boxSizing:"border-box" }}
      />
      {open && query.trim().length >= 2 && (
        <div style={{ position:"absolute", zIndex:30, top:"calc(100% + 4px)", left:0, right:0, background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, boxShadow:"0 10px 28px rgba(15,23,42,0.14)", maxHeight:220, overflowY:"auto", padding:4, minWidth:220 }}>
          {status === "loading" && results.length === 0 && (
            <div style={{ padding:"10px 12px", fontSize:11, color:"#94a3b8" }}>Searching…</div>
          )}
          {status === "error" && (
            <div style={{ padding:"10px 12px", fontSize:11, color:"#dc2626" }}>Search failed — check FastAPI.</div>
          )}
          {status === "found" && results.length === 0 && (
            <div style={{ padding:"10px 12px", fontSize:11, color:"#94a3b8" }}>No matches.</div>
          )}
          {results.map(r => (
            <button
              key={r.dolibarr_id}
              onClick={() => {
                onLink({
                  dolibarr_id: r.dolibarr_id,
                  dolibarr_ref: r.ref,
                  price: r.price,
                  stockStatus: r.stock_status,
                  stockCount: r.stock_count,
                });
                setOpen(false);
                setQuery("");
              }}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"6px 8px", background:"transparent", border:"none", borderRadius:8, textAlign:"left", cursor:"pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <DolibarrThumb dolibarrId={r.dolibarr_id} size={26} />
              <span style={{ fontSize:11, fontWeight:600, color:"#1e293b", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {r.label} <span style={{ color:"#94a3b8" }}>({r.ref})</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminProductEdit({ product, brands = [], customCategories = [], savedAttributes = [], onSave, onCancel, uploadImage }) {
  const productCustomCategories = customCategories.filter(c => !NON_PRODUCT.has(c.toLowerCase()));
  const isNew = !product?.id;
  const [step, setStep]   = useState(1);
  const [saving, setSaving] = useState(false);

  const [info, setInfo] = useState({
    name:        product?.name || "",
    slug:        product?.slug || "",
    shortDesc:   product?.shortDesc || "",
    description: product?.description || "",
    cover:       product?.cover || product?.image || "",
    hover:       product?.imgHover || "",
    gallery: product?.gallery || [],
    featured:    product?.featured ?? true,
    badge:       product?.badge || "",
    brand:       product?.brand || "",
  });
  const [categories, setCategories] = useState(product?.categories || []);
  const [dolibarr, setDolibarr]     = useState({
    query: "",
    skipped: false,
    status: null,
    results: [],
    linked: product?.dolibarr_id
      ? { dolibarr_id: product.dolibarr_id, ref: product.dolibarr_ref || "" }
      : null,
  });
  const [stock, setStock]           = useState({ status: product?.stockStatus || "instock", count: product?.stockCount ?? "" });
  const [pricing, setPricing]       = useState({ price: product?.price || "", oldPrice: product?.oldPrice || "" });
  const [variations, setVariations] = useState(product?.variations || []);
  const [selectedAttrValues, setSelectedAttrValues] = useState(() => {
    const initial = {};
    (product?.attributes || []).forEach(a => { initial[a.name] = [...(a.values || [])]; });
    return initial;
  });
  const [dolibarrDropdownOpen, setDolibarrDropdownOpen] = useState(false);
  const dolibarrSearchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dolibarrSearchRef.current && !dolibarrSearchRef.current.contains(e.target)) {
        setDolibarrDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleCat(v) { setCategories(c => c.includes(v) ? c.filter(x => x !== v) : [...c, v]); }

  async function handleSave() {
    if (!info.name.trim() || !pricing.price) return;
    setSaving(true);
    const id = product?.id || Date.now();
    // Auto-generated slugs get the id appended so two products with the
    // same name can't collide against the DB's unique constraint on slug —
    // a manually-typed slug (info.slug) is trusted as-is.
    const autoSlug = `${info.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${id}`;
    const payload = {
      ...(product || {}),
      name:         info.name.trim(),
      slug:         info.slug || autoSlug,
      shortDesc:    info.shortDesc,
      description:  info.description,
      image:        info.cover, img: info.cover, cover: info.cover,
      imgHover:     info.hover,
      gallery:      info.gallery || [],
      featured:     info.featured,
      badge:        info.badge,
      brand:        info.brand,
      categories,
      category:     categories[0] || "gym-equipment",
      dolibarr_ref: dolibarr.skipped ? "" : dolibarr.linked?.ref || "",
      dolibarr_id:  dolibarr.skipped ? null : dolibarr.linked?.dolibarr_id || null,
      stockStatus:  stock.status,
      stockCount:   stock.count === "" ? null : Number(stock.count),
      price:        Number(pricing.price || 0),
      oldPrice:     pricing.oldPrice === "" ? null : Number(pricing.oldPrice),
      variations,
      attributes: Object.entries(selectedAttrValues)
        .filter(([, values]) => values.length)
        .map(([name, values]) => ({ name, values })),
      id,
    };
    try { await onSave(payload); } finally { setSaving(false); }
  }

  async function handleImgField(field, file) {
    if (!uploadImage) return;
    try {
      const url = await uploadImage(file, field);
      if (!url) return; // upload failed — uploadImage already alerted the error
      if (field === "cover") setInfo(i => ({...i, cover: url}));
      else if (field === "hover") setInfo(i => ({...i, hover: url}));
    } catch (err) {
      showAlert("Failed to upload image: " + friendlyApiError(err));
    }
  }

  async function handleGalleryUpload(files) {
    try {
      const newUrls = [];
      for (const file of files) {
        if (uploadImage) {
          const url = await uploadImage(file, "gallery");
          if (url) newUrls.push(url); // skip failed uploads instead of storing null
        } else {
          // Fallback: use object URL for preview when no upload function
          newUrls.push(URL.createObjectURL(file));
        }
      }
      setInfo(i => ({ ...i, gallery: [...(i.gallery || []), ...newUrls] }));
    } catch (err) {
      showAlert("Failed to upload image: " + friendlyApiError(err));
    }
  }

  function removeGalleryImage(idx) {
    setInfo(i => ({ ...i, gallery: (i.gallery || []).filter((_, j) => j !== idx) }));
  }

  function toggleAttrValue(attrName, value) {
    setSelectedAttrValues(current => {
      const existing = current[attrName] || [];
      const next = existing.includes(value) ? existing.filter(v => v !== value) : [...existing, value];
      return { ...current, [attrName]: next };
    });
  }

  function generateVariationsFromAttributes() {
    const active = Object.entries(selectedAttrValues).filter(([, values]) => values.length);
    if (!active.length) return;

    let combos = [{}];
    for (const [attrName, values] of active) {
      const next = [];
      for (const combo of combos) {
        for (const value of values) {
          next.push({ ...combo, [attrName]: value });
        }
      }
      combos = next;
    }

    setVariations(current => {
      const existingKeys = new Set(current.map(v => JSON.stringify(v.options || {})));
      const additions = combos
        .filter(options => !existingKeys.has(JSON.stringify(options)))
        .map(options => ({
          label: Object.values(options).join(" / "),
          options,
          price: pricing.price || "",
          stockStatus: "instock",
          stockCount: "",
          img: "",
          dolibarr_id: null,
          dolibarr_ref: null,
        }));
      return [...current, ...additions];
    });
  }

  const searchSeq = useRef(0);

  // Live search: fires automatically as the admin types (debounced), instead
  // of requiring a manual search click.
  useEffect(() => {
    if (dolibarr.skipped) return;
    const query = dolibarr.query.trim();
    if (query.length < 2) {
      setDolibarr(d => ({...d, status:null, results:[]}));
      return;
    }

    const mySeq = ++searchSeq.current;
    setDolibarr(d => ({...d, status:"loading"}));
    const timer = setTimeout(async () => {
      try {
        const results = await searchDolibarrProducts(query);
        if (mySeq !== searchSeq.current) return; // stale response, a newer keystroke already fired
        setDolibarr(d => ({...d, status:"found", results}));
      } catch (e) {
        if (mySeq !== searchSeq.current) return;
        console.error("Dolibarr search failed:", e);
        setDolibarr(d => ({...d, status:"error", results:[]}));
      }
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dolibarr.query, dolibarr.skipped]);

  async function selectDolibarrProduct(result) {
    // The search result already carries everything we need (ref, id, live stock)
    // straight from Dolibarr, so there's no need to ask FastAPI again. If the
    // product is already saved, persist the link straight to Supabase from
    // here (same as every other admin edit) instead of routing it through
    // FastAPI — that's only needed for the parts that must talk to Dolibarr.
    setStock(s => ({...s, status: result.stock_status, count: result.stock_count}));
    setPricing(p => ({...p, price: result.price}));
    setDolibarr(d => ({...d, status:"linked", linked:{ dolibarr_id: result.dolibarr_id, ref: result.ref }}));

    if (product?.id) {
      try {
        await linkProductToDolibarr(product.id, result.dolibarr_id, result.ref);
      } catch (e) {
        console.error("Failed to save Dolibarr link to Supabase:", e);
        // The optimistic "linked" state above would otherwise lie to the
        // admin — revert it so the UI matches what's actually saved.
        setDolibarr(d => ({ ...d, status: "error" }));
        showAlert("Failed to save Dolibarr link: " + friendlyApiError(e));
      }
    }
  }

  /* ── shared styles ─── */
  const inputStyle = { width:"100%", height:42, padding:"0 14px", background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, fontSize:13, fontWeight:500, color:"#1e293b", outline:"none", boxSizing:"border-box", cursor:"text" };
  const textareaStyle = { ...inputStyle, height:"auto", padding:"12px 14px", resize:"vertical", lineHeight:1.6 };
  const labelStyle  = { display:"block", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 };
  const fieldStyle  = { display:"flex", flexDirection:"column", gap:4 };

  return (
    <div style={{ padding:"28px 32px", maxWidth:880, margin:"0 auto", fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ── Header ─── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={onCancel} style={{ display:"flex", alignItems:"center", gap:6, height:32, padding:"0 12px", background:"transparent", color:"#64748b", border:"1px solid #e2e8f0", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
            Back
          </button>
          <span style={{ color:"#cbd5e1" }}>›</span>
          <span style={{ fontSize:14, fontWeight:800, color:"#1e293b" }}>{isNew ? "Add New Product" : `Edit — ${product.name}`}</span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ height:36, padding:"0 16px", background:"#fff", color:"#64748b", border:"1px solid #e2e8f0", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !info.name.trim() || !pricing.price}
            style={{ height:36, padding:"0 20px", background: saving || !info.name.trim() || !pricing.price ? "#94a3b8" : "#e63946", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Saving…" : isNew ? "Create Product" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ── Step indicators ─── */}
      <div style={{ display:"flex", gap:0, marginBottom:28, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:16, padding:6, overflowX:"auto" }}>
        {STEPS.map((s,i) => (
          <button key={s.id} onClick={() => setStep(s.id)}
            style={{ flex:1, display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:12, border:"none", background: step === s.id ? "#fff" : "transparent", cursor:"pointer", boxShadow: step === s.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition:"all 0.15s", whiteSpace:"nowrap" }}>
            <span style={{ color: step === s.id ? "#e63946" : "#94a3b8" }}>{STEP_ICONS[s.id]?.()}</span>
            <span style={{ fontSize:12, fontWeight: step === s.id ? 700 : 500, color: step === s.id ? "#1e293b" : "#94a3b8" }}>{s.label}</span>
            {step > s.id && <span style={{ marginLeft:"auto", color:"#22c55e" }}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>}
          </button>
        ))}
      </div>

      {/* ── Step content ─── */}
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:20, padding:"28px 32px" }}>

        {/* STEP 1 — Website Info */}
        {step === 1 && (
          <div style={{ display:"grid", gap:20 }}>
            <h2 style={{ fontSize:16, fontWeight:800, color:"#1e293b", margin:0 }}>Website Information & SEO</h2>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div style={{ ...fieldStyle, gridColumn:"1/-1" }}>
                <label style={labelStyle}>Product Name *</label>
                <input style={inputStyle} value={info.name} onChange={e => setInfo(i=>({...i,name:e.target.value}))} placeholder="e.g. Commercial Treadmill Pro X9" required />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>URL Slug</label>
                <input style={inputStyle} value={info.slug} onChange={e => setInfo(i=>({...i,slug:e.target.value}))} placeholder="auto-generated-from-name" />
                <span style={{ fontSize:11, color:"#94a3b8" }}>Leave blank to auto-generate</span>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Badge</label>
                <select style={inputStyle} value={info.badge} onChange={e => setInfo(i=>({...i,badge:e.target.value}))}>
                  {BADGE_OPTIONS.map(b => <option key={b} value={b}>{b || "No badge"}</option>)}
                </select>
              </div>
              <div style={{ ...fieldStyle, gridColumn:"1/-1" }}>
                <label style={labelStyle}>Short Description</label>
                <textarea style={{...textareaStyle, height:70}} rows={2} value={info.shortDesc} onChange={e => setInfo(i=>({...i,shortDesc:e.target.value}))} placeholder="Brief summary shown in product cards" />
              </div>
              <div style={{ ...fieldStyle, gridColumn:"1/-1" }}>
                <label style={labelStyle}>Full Description</label>
                <textarea style={{...textareaStyle, height:110}} rows={5} value={info.description} onChange={e => setInfo(i=>({...i,description:e.target.value}))} placeholder="Detailed product description shown on product page" />
              </div>
              <div style={{ ...fieldStyle, gridColumn: "1/-1" }}>
                <label style={labelStyle}>SEO Preview</label>
                <div style={{ background: "#dbeafe", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", fontFamily: "arial, sans-serif" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <img src="/favicon-32x32.png" alt="" style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, marginTop: 1, objectFit: "cover" }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, color: "#202124", lineHeight: 1.3 }}>Sports Way</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#4d5156", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        sportsway.com › products › {info.slug || "auto-generated-from-name"}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: 20, lineHeight: 1.3, color: "#1a0dab", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                        {effectiveMetaTitle({ name: info.name }) || "Product name"} | Buy in Qatar | Sports Way
                      </p>
                      <p style={{ margin: "3px 0 0", fontSize: 14, color: "#4d5156", lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {effectiveMetaDescription({ shortDesc: info.shortDesc, description: info.description }) || "No short description or description yet — add one above to fill this in."}
                      </p>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Page title and search-result text are generated automatically from the name and short description (or full description) above — nothing else to fill in here.</span>
              </div>
            </div>

            <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:20 }}>
              <h3 style={{ fontSize:13, fontWeight:700, color:"#475569", marginBottom:16 }}>Images</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {[{key:"cover",label:"Cover Image"},{key:"hover",label:"Hover Image"}].map(({key,label}) => (
                  <div key={key} style={fieldStyle}>
                    <label style={labelStyle}>{label}</label>
                    {info[key] && <img src={info[key]} alt="" style={{ width:100, height:100, objectFit:"cover", borderRadius:12, border:"1px solid #e2e8f0", marginBottom:8 }} />}
                    <input style={inputStyle} value={info[key]} onChange={e => setInfo(i=>({...i,[key]:e.target.value}))} placeholder="Paste URL…" />
                    <label style={{ marginTop:6, display:"inline-flex", alignItems:"center", gap:6, height:32, padding:"0 12px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:8, fontSize:12, fontWeight:600, color:"#475569", cursor:"pointer" }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Upload image
                      <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleImgField(key, e.target.files[0])} />
                    </label>
                  </div>
                ))}
                {/* Gallery */}
                <div style={{ ...fieldStyle, gridColumn:"1/-1" }}>
                  <label style={labelStyle}>Gallery Images</label>

                  {/* Existing gallery thumbnails */}
                  {(info.gallery || []).length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:12 }}>
                      {info.gallery.map((url, idx) => (
                        <div key={idx} style={{ position:"relative", width:88, height:88, flexShrink:0 }}>
                          <img src={url} alt={`Gallery ${idx + 1}`}
                            style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12, border:"1px solid #e2e8f0", display:"block" }} />
                          <button type="button" onClick={() => removeGalleryImage(idx)}
                            style={{ position:"absolute", top:-8, right:-8, width:22, height:22, borderRadius:"50%", background:"#ef4444", color:"#fff", border:"2px solid #fff", fontSize:13, fontWeight:900, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1, boxShadow:"0 2px 6px rgba(0,0,0,0.15)" }}>
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload drop zone */}
                  <label style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:"24px 16px", border:"2px dashed #e2e8f0", borderRadius:16, cursor:"pointer", background:"#fafafa", transition:"all 0.15s" }}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#e63946"; e.currentTarget.style.background = "#fff1f2"; }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; }}
                    onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")); if (files.length) handleGalleryUpload(files); }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"#f1f5f9", border:"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <svg width="20" height="20" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#475569", margin:0 }}>Click to upload gallery images</p>
                      <p style={{ fontSize:11, color:"#94a3b8", marginTop:3 }}>or drag and drop — JPG, PNG, WebP — multiple allowed</p>
                    </div>
                    <input type="file" accept="image/*" multiple hidden
                      onChange={e => { if (e.target.files?.length) handleGalleryUpload(Array.from(e.target.files)); e.target.value = ""; }} />
                  </label>

                  {(info.gallery || []).length > 0 && (
                    <p style={{ fontSize:11, color:"#94a3b8", marginTop:8 }}>{info.gallery.length} image{info.gallery.length !== 1 ? "s" : ""} in gallery &middot; Click x to remove</p>
                  )}
                </div>
              </div>
            </div>

            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
              <input type="checkbox" checked={info.featured} onChange={e => setInfo(i=>({...i,featured:e.target.checked}))} style={{ width:16, height:16, accentColor:"#e63946", cursor:"pointer" }} />
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:"#1e293b", margin:0 }}>Featured Product</p>
                <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>Show on homepage featured section</p>
              </div>
            </label>
          </div>
        )}

        {/* STEP 2 — Categories */}
        {step === 2 && (
          <div style={{ display:"grid", gap:20 }}>
            <h2 style={{ fontSize:16, fontWeight:800, color:"#1e293b", margin:0 }}>Categories & Brand</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
              {CATEGORY_TREE.map(cat => (
                <div key={cat.value} style={{ background:"#f8fafc", border:`1.5px solid ${categories.includes(cat.value) ? "#e63946" : "#e2e8f0"}`, borderRadius:16, padding:14, transition:"border-color 0.15s" }}>
                  <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", marginBottom:10 }}>
                    <input type="checkbox" checked={categories.includes(cat.value)} onChange={() => toggleCat(cat.value)} style={{ width:16, height:16, accentColor:"#e63946", cursor:"pointer" }} />
                    <span style={{ fontSize:14, fontWeight:700, color:"#1e293b" }}>{cat.label}</span>
                  </label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {cat.sub.map(s => {
                      const v = s.toLowerCase().replace(/\s+/g,"-").replace(/'/g,"");
                      const sel = categories.includes(v) || categories.includes(s);
                      return (
                        <label key={s} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", background: sel ? "rgba(230,57,70,0.1)" : "#fff", border:`1px solid ${sel ? "#e63946" : "#e2e8f0"}`, color: sel ? "#e63946" : "#64748b", transition:"all 0.12s" }}>
                          <input type="checkbox" checked={sel} onChange={() => { const val = v; toggleCat(val); }} style={{ display:"none" }} />
                          {s}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              {productCustomCategories.length > 0 && (
                <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:16, padding:14 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:"#1e293b", marginBottom:10 }}>Custom</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {productCustomCategories.map(c => (
                      <label key={c} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", background: categories.includes(c) ? "rgba(230,57,70,0.1)" : "#fff", border:`1px solid ${categories.includes(c) ? "#e63946" : "#e2e8f0"}`, color: categories.includes(c) ? "#e63946" : "#64748b" }}>
                        <input type="checkbox" checked={categories.includes(c)} onChange={() => toggleCat(c)} style={{ display:"none" }} />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Brand</label>
              <select style={{...inputStyle, maxWidth:280}} value={info.brand} onChange={e => setInfo(i=>({...i,brand:e.target.value}))}>
                <option value="">No brand</option>
                {[...new Set(brands.map(b=>b.name||b))].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* STEP 3 — Dolibarr */}
        {step === 3 && (
          <div style={{ display:"grid", gap:20 }}>
            <h2 style={{ fontSize:16, fontWeight:800, color:"#1e293b", margin:0 }}>Dolibarr ERP Link</h2>
            <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:14, padding:"16px 18px", display:"flex", gap:14 }}>
              <svg style={{ flexShrink:0, color:"#1d4ed8" }} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <p style={{ fontWeight:700, color:"#1d4ed8", fontSize:13, margin:0 }}>Link to Dolibarr product</p>
                <p style={{ fontSize:12, color:"#3b82f6", margin:"4px 0 0" }}>Enter the Dolibarr reference to auto-sync stock and pricing.</p>
              </div>
            </div>
            {!dolibarr.skipped && dolibarr.linked && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:14, padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <DolibarrThumb dolibarrId={dolibarr.linked.dolibarr_id} size={44} />
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <svg width="14" height="14" fill="none" stroke="#15803d" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      <p style={{ fontSize:13, fontWeight:800, color:"#15803d", margin:0 }}>Linked to Dolibarr</p>
                    </div>
                    <p style={{ fontSize:12, color:"#166534", margin:"2px 0 0" }}>
                      Ref <strong>{dolibarr.linked.ref}</strong> · id #{dolibarr.linked.dolibarr_id}
                      {pricing.price !== "" && <> · {Number(pricing.price).toFixed(2)} QAR</>}
                    </p>
                  </div>
                </div>
                <button onClick={() => setDolibarr(d => ({...d, linked:null, query:"", status:null, results:[]}))}
                  style={{ height:32, padding:"0 12px", background:"#fff", color:"#15803d", border:"1px solid #bbf7d0", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                  Change link
                </button>
              </div>
            )}

            {!dolibarr.skipped && !dolibarr.linked && (
              <div ref={dolibarrSearchRef} style={{ position:"relative" }}>
                <label style={labelStyle}>Search Dolibarr by reference or name</label>
                <div style={{ position:"relative" }}>
                  <svg style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input
                    style={{ ...inputStyle, paddingLeft:38, paddingRight: dolibarr.status === "loading" ? 38 : 14 }}
                    value={dolibarr.query}
                    onChange={e => setDolibarr(d=>({...d,query:e.target.value}))}
                    onFocus={() => setDolibarrDropdownOpen(true)}
                    placeholder="Start typing e.g. PRD-00142 or Treadmill Pro X9"
                    autoComplete="off"
                  />
                  {dolibarr.status === "loading" && (
                    <svg style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", animation:"spin 0.7s linear infinite" }} width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                  )}
                </div>

                {dolibarrDropdownOpen && dolibarr.query.trim().length >= 2 && (
                  <div style={{ position:"absolute", zIndex:20, top:"calc(100% + 6px)", left:0, right:0, background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, boxShadow:"0 12px 32px rgba(15,23,42,0.12)", maxHeight:320, overflowY:"auto", padding:6 }}>
                    {dolibarr.status === "error" && (
                      <div style={{ padding:"14px 16px", fontSize:12, color:"#dc2626", display:"flex", alignItems:"center", gap:8 }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Could not reach Dolibarr. Check the FastAPI backend and try again.
                      </div>
                    )}

                    {dolibarr.status === "found" && dolibarr.results.length === 0 && (
                      <div style={{ padding:"14px 16px", fontSize:12, color:"#94a3b8" }}>
                        No matching Dolibarr products found.
                      </div>
                    )}

                    {dolibarr.status === "loading" && dolibarr.results.length === 0 && (
                      <div style={{ padding:"14px 16px", fontSize:12, color:"#94a3b8" }}>Searching Dolibarr…</div>
                    )}

                    {dolibarr.results.map(r => (
                      <button
                        key={r.dolibarr_id}
                        onClick={async () => { await selectDolibarrProduct(r); setDolibarrDropdownOpen(false); }}
                        disabled={dolibarr.status === "linking"}
                        style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"9px 10px", background:"transparent", border:"none", borderRadius:10, textAlign:"left", cursor: dolibarr.status === "linking" ? "wait" : "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <DolibarrThumb dolibarrId={r.dolibarr_id} size={38} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:"#1e293b", margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                            {r.label} <span style={{ color:"#94a3b8", fontWeight:600 }}>({r.ref})</span>
                          </p>
                          <p style={{ fontSize:11, margin:"2px 0 0", fontWeight:600 }}>
                            <span style={{ color: r.stock_status==="instock" ? "#15803d" : "#dc2626" }}>
                              {r.stock_status === "instock" ? `In stock — ${r.stock_count} units` : "Out of stock"}
                            </span>
                            <span style={{ color:"#94a3b8" }}> · {Number(r.price).toFixed(2)} QAR</span>
                          </p>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:"#1d4ed8", flexShrink:0 }}>Select →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <SkipDolibarrLinkToggle
              isSkipped={dolibarr.skipped}
              onToggle={(nextSkipped) => setDolibarr(d => ({
                ...d,
                skipped: nextSkipped,
                query: "",
                status: null,
                results: [],
                linked: null,
              }))}
            />
          </div>
        )}

        {/* STEP 4 — Stock */}
        {step === 4 && (
          <div style={{ display:"grid", gap:20 }}>
            <h2 style={{ fontSize:16, fontWeight:800, color:"#1e293b", margin:0 }}>Stock & Availability</h2>
            {stock.count !== "" && dolibarr.linked && (
              <div style={{ background:"#fefce8", border:"1px solid #fde68a", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#92400e" }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Values pre-filled from Dolibarr — you can override them manually.
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, maxWidth:480 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Stock Status</label>
                <select style={inputStyle} value={stock.status} onChange={e => setStock(s=>({...s,status:e.target.value}))}>
                  <option value="instock">In Stock</option>
                  <option value="outofstock">Out of Stock</option>
                  <option value="onbackorder">On Backorder</option>
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Stock Count</label>
                <input type="number" min="0" style={inputStyle} value={stock.count} onChange={e => setStock(s=>({...s,count:e.target.value}))} placeholder="Leave blank to hide" />
              </div>
            </div>
            {/* Stock preview badge */}
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <p style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>Preview on product page:</p>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:20, fontWeight:700, fontSize:13, background: stock.status==="instock" ? "#f0fdf4" : stock.status==="outofstock" ? "#fef2f2" : "#fffbeb", color: stock.status==="instock" ? "#15803d" : stock.status==="outofstock" ? "#dc2626" : "#b45309", border:`1px solid ${stock.status==="instock" ? "#bbf7d0" : stock.status==="outofstock" ? "#fecaca" : "#fde68a"}` }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background: stock.status==="instock" ? "#22c55e" : stock.status==="outofstock" ? "#ef4444" : "#f59e0b" }} />
                {stock.status === "instock" ? "In Stock" : stock.status === "outofstock" ? "Out of Stock" : "On Backorder"}
                {stock.count && ` — ${stock.count} units`}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5 — Pricing & Variations */}
        {step === 5 && (
          <div style={{ display:"grid", gap:24 }}>
            <h2 style={{ fontSize:16, fontWeight:800, color:"#1e293b", margin:0 }}>Price & Variations</h2>
            {dolibarr.linked && (
              <div style={{ background:"#fefce8", border:"1px solid #fde68a", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#92400e" }}>
                Price pre-filled from Dolibarr — you can override it below any time.
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, maxWidth:400 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Price (QAR) *</label>
                <input type="number" min="0" step="0.01" style={inputStyle} value={pricing.price} onChange={e => setPricing(p=>({...p,price:e.target.value}))} required />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Old Price (QAR)</label>
                <input type="number" min="0" step="0.01" style={inputStyle} value={pricing.oldPrice} onChange={e => setPricing(p=>({...p,oldPrice:e.target.value}))} placeholder="Shows crossed-out" />
              </div>
            </div>

            {/* Attributes → variation generator */}
            <div>
              <h3 style={{ fontSize:14, fontWeight:800, color:"#1e293b", margin:"0 0 4px" }}>Attributes</h3>
              <p style={{ fontSize:11, color:"#94a3b8", margin:"0 0 14px" }}>
                Pick values from your saved attributes to generate variation rows automatically. Manage the attribute list itself from Catalog → Attributes.
              </p>
              {savedAttributes.length === 0 ? (
                <div style={{ padding:"18px 16px", textAlign:"center", border:"2px dashed #e2e8f0", borderRadius:14 }}>
                  <p style={{ fontSize:12, color:"#94a3b8", margin:0 }}>No attributes saved yet — add some under Catalog → Attributes first.</p>
                </div>
              ) : (
                <div style={{ display:"grid", gap:12 }}>
                  {savedAttributes.map(attr => (
                    <div key={attr.name} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:12 }}>
                      <p style={{ fontSize:12, fontWeight:700, color:"#1e293b", margin:"0 0 8px" }}>{attr.name}</p>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {attr.values.map(value => {
                          const isSelected = (selectedAttrValues[attr.name] || []).includes(value);
                          return (
                            <label key={value} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", background: isSelected ? "rgba(230,57,70,0.1)" : "#fff", border:`1px solid ${isSelected ? "#e63946" : "#e2e8f0"}`, color: isSelected ? "#e63946" : "#64748b" }}>
                              <input type="checkbox" checked={isSelected} onChange={() => toggleAttrValue(attr.name, value)} style={{ display:"none" }} />
                              {value}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <button onClick={generateVariationsFromAttributes}
                    disabled={!Object.values(selectedAttrValues).some(v => v.length)}
                    style={{ height:36, padding:"0 16px", alignSelf:"flex-start", background: Object.values(selectedAttrValues).some(v => v.length) ? "#1d4ed8" : "#e2e8f0", color: Object.values(selectedAttrValues).some(v => v.length) ? "#fff" : "#94a3b8", border:"none", borderRadius:10, fontSize:12, fontWeight:700, cursor: Object.values(selectedAttrValues).some(v => v.length) ? "pointer" : "not-allowed" }}>
                    Generate Variations from Attributes →
                  </button>
                </div>
              )}
            </div>

            {/* Variations */}
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div>
                  <h3 style={{ fontSize:14, fontWeight:800, color:"#1e293b", margin:0 }}>Variations</h3>
                  <p style={{ fontSize:11, color:"#94a3b8", margin:"3px 0 0" }}>Each variation is its own sub-product — link it to Dolibarr for its own stock, just like the parent</p>
                </div>
                <button onClick={() => setVariations(v => [...v, { label:"", price:"", stockStatus:"instock", stockCount:"", img:"", dolibarr_id:null, dolibarr_ref:null }])}
                  style={{ height:34, padding:"0 14px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:10, fontSize:12, fontWeight:700, color:"#475569", cursor:"pointer" }}>
                  + Add Variation
                </button>
              </div>
              {variations.length === 0 ? (
                <div style={{ padding:"32px 0", textAlign:"center", border:"2px dashed #e2e8f0", borderRadius:16 }}>
                  <p style={{ fontSize:13, color:"#94a3b8", margin:0 }}>No variations — this product has a single option.</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {variations.map((v, i) => (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"1.3fr 0.8fr 0.9fr 1.3fr auto", gap:10, alignItems:"end", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:14, padding:14 }}>
                      <div style={fieldStyle}>
                        <label style={labelStyle}>Label</label>
                        <input style={inputStyle} value={v.label} onChange={e => setVariations(vars => vars.map((x,j) => j===i ? {...x,label:e.target.value} : x))} placeholder="e.g. Size L" />
                      </div>
                      <div style={fieldStyle}>
                        <label style={labelStyle}>Price</label>
                        <input type="number" style={inputStyle} value={v.price} onChange={e => setVariations(vars => vars.map((x,j) => j===i ? {...x,price:e.target.value} : x))} placeholder="Override" />
                      </div>
                      <div style={fieldStyle}>
                        <label style={labelStyle}>Stock</label>
                        <div style={{ display:"flex", gap:6 }}>
                          <select style={{...inputStyle, flex:1}} value={v.stockStatus} onChange={e => setVariations(vars => vars.map((x,j) => j===i ? {...x,stockStatus:e.target.value} : x))}>
                            <option value="instock">In Stock</option>
                            <option value="outofstock">Out of Stock</option>
                          </select>
                          <input type="number" min="0" style={{...inputStyle, width:64}} value={v.stockCount ?? ""} onChange={e => setVariations(vars => vars.map((x,j) => j===i ? {...x,stockCount:e.target.value} : x))} placeholder="Qty" />
                        </div>
                      </div>
                      <div style={fieldStyle}>
                        <label style={labelStyle}>Dolibarr Link</label>
                        <VariationDolibarrLink
                          variation={v}
                          onLink={(patch) => setVariations(vars => vars.map((x,j) => j===i ? {...x,...patch} : x))}
                        />
                      </div>
                      <button onClick={() => setVariations(vars => vars.filter((_,j) => j !== i))}
                        style={{ height:42, width:38, display:"flex", alignItems:"center", justifyContent:"center", background:"#fff", border:"1px solid #fca5a5", borderRadius:10, color:"#ef4444", cursor:"pointer", fontSize:18 }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Final save */}
            <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:20, display:"flex", justifyContent:"flex-end", gap:12 }}>
              <button onClick={onCancel} style={{ height:40, padding:"0 20px", background:"#fff", color:"#64748b", border:"1px solid #e2e8f0", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !info.name.trim() || !pricing.price}
                style={{ height:40, padding:"0 24px", background: !info.name.trim() || !pricing.price ? "#94a3b8" : "#e63946", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor: saving ? "wait" : "pointer" }}>
                {saving ? "Saving…" : isNew ? "Create Product" : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Step navigation footer ─── */}
      {step < 5 && (
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:20 }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s-1)}
              style={{ height:38, padding:"0 18px", background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, fontSize:13, fontWeight:600, color:"#475569", cursor:"pointer" }}>
              ← Back
            </button>
          ) : <div />}
          <button onClick={() => { if (step === 1 && !info.name.trim()) return; setStep(s => s+1); }}
            disabled={step === 1 && !info.name.trim()}
            style={{ height:38, padding:"0 20px", background: step===1 && !info.name.trim() ? "#94a3b8" : "#e63946", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}
