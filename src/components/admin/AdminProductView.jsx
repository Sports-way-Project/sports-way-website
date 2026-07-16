import { useState } from "react";
import { formatPrice } from "../../lib/format";
import { useAdminModal } from "./AdminModal";

const STOCK = {
  instock:     { label: "In Stock",     dot: "#22c55e", bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  outofstock:  { label: "Out of Stock", dot: "#ef4444", bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  onbackorder: { label: "Backorder",    dot: "#f59e0b", bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
};

function StockBadge({ status }) {
  const s = STOCK[status] || STOCK.instock;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:700, background:s.bg, color:s.text, border:`1px solid ${s.border}` }}>
      <span style={{ width:7, height:7, borderRadius:"50%", background:s.dot, flexShrink:0 }} />
      {s.label}
    </span>
  );
}

export function AdminProductView({ product, onBack, onEdit, onDelete }) {
  const { showConfirm } = useAdminModal();
  const [activeImg, setActiveImg] = useState(0);

  if (!product) {
    return (
      <div style={{ padding:60, textAlign:"center" }}>
        <p style={{ color:"#94a3b8", fontSize:14 }}>Product not found.</p>
        <button onClick={onBack} style={btnStyle.ghost}>← Back to Products</button>
      </div>
    );
  }

  const images = [product.cover, product.image, product.img, product.imgHover, ...(product.gallery || [])].filter(Boolean);
  const uniqueImages = [...new Set(images)];
  const discount = product.oldPrice && product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : null;

  return (
    <div style={{ padding:"28px 32px", maxWidth:1100, margin:"0 auto" }}>

      {/* ── Top bar ─── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={onBack} style={btnStyle.ghost}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
            Back
          </button>
          <span style={{ color:"#cbd5e1" }}>›</span>
          <span style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>Products</span>
          <span style={{ color:"#cbd5e1" }}>›</span>
          <span style={{ fontSize:13, fontWeight:600, color:"#64748b", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{product.name}</span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => onEdit(product)} style={btnStyle.primary}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            Edit Product
          </button>
          <button onClick={async () => {
            const ok = await showConfirm(`Delete "${product.name}"? This cannot be undone.`, { title: "Delete product", okLabel: "Delete", type: "error" });
            if (ok) { onDelete(product.id); onBack(); }
          }} style={btnStyle.danger}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4h4v2"/></svg>
            Delete
          </button>
        </div>
      </div>

      {/* ── Main grid ─── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:28 }}>

        {/* ── LEFT: Images ─── */}
        <div>
          {/* Main image */}
          <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:20, overflow:"hidden", aspectRatio:"4/3", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
            {uniqueImages[activeImg] ? (
              <img src={uniqueImages[activeImg]} alt={product.name}
                style={{ width:"100%", height:"100%", objectFit:"contain", padding:20 }} />
            ) : (
              <svg width="72" height="72" fill="none" stroke="#e2e8f0" strokeWidth="1.2" viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>
            )}
            {product.badge && (
              <span style={{ position:"absolute", top:14, left:14, padding:"4px 10px", background:"#e63946", color:"#fff", fontSize:10, fontWeight:800, borderRadius:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                {product.badge}
              </span>
            )}
            {product.featured && (
              <span style={{ position:"absolute", top:14, right:14 }}><svg width="20" height="20" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>
            )}
          </div>

          {/* Thumbnail strip */}
          {uniqueImages.length > 1 && (
            <div style={{ display:"flex", gap:10, marginTop:12, overflowX:"auto", paddingBottom:4 }}>
              {uniqueImages.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  style={{ flexShrink:0, width:70, height:70, borderRadius:14, overflow:"hidden", cursor:"pointer", border: i === activeImg ? "2.5px solid #e63946" : "2px solid #e2e8f0", transition:"border-color 0.15s", boxShadow: i === activeImg ? "0 4px 12px rgba(230,57,70,0.2)" : "none" }}>
                  <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                </button>
              ))}
            </div>
          )}

          {/* Variations */}
          {(product.variations || []).length > 0 && (
            <div style={{ marginTop:24 }}>
              <h3 style={{ fontSize:12, fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Variations ({product.variations.length})</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {product.variations.map((v, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:14 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      {v.img && <img src={v.img} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:"cover" }} />}
                      <span style={{ fontSize:13, fontWeight:600, color:"#334155" }}>{v.label || `Variation ${i + 1}`}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      {v.price && <span style={{ fontSize:13, fontWeight:800, color:"#1e293b" }}>{formatPrice(v.price)}</span>}
                      <StockBadge status={v.stockStatus || "instock"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Info ─── */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Title + status */}
          <div>
            <h1 style={{ fontSize:24, fontWeight:900, color:"#0f172a", lineHeight:1.2, margin:0 }}>{product.name}</h1>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, fontFamily:"monospace", color:"#94a3b8", background:"#f1f5f9", border:"1px solid #e2e8f0", padding:"3px 8px", borderRadius:6 }}>#{product.id}</span>
              {product.slug && <span style={{ fontSize:11, fontFamily:"monospace", color:"#94a3b8", background:"#f1f5f9", border:"1px solid #e2e8f0", padding:"3px 8px", borderRadius:6 }}>/{product.slug}</span>}
              <StockBadge status={product.stockStatus} />
            </div>
          </div>

          {/* Pricing card */}
          <div style={{ background:"linear-gradient(135deg,#fafafa,#f1f5f9)", border:"1px solid #e2e8f0", borderRadius:18, padding:"20px 22px" }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Pricing</p>
            <div style={{ display:"flex", alignItems:"baseline", gap:12 }}>
              <span style={{ fontSize:34, fontWeight:900, color:"#0f172a" }}>{formatPrice(product.price || 0)}</span>
              {product.oldPrice && <span style={{ fontSize:18, fontWeight:600, color:"#94a3b8", textDecoration:"line-through" }}>{formatPrice(product.oldPrice)}</span>}
              {discount && (
                <span style={{ fontSize:12, fontWeight:800, color:"#15803d", background:"#dcfce7", border:"1px solid #bbf7d0", padding:"3px 10px", borderRadius:20 }}>
                  -{discount}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            {[
              { label:"Stock Count", value: product.stockCount != null ? `${product.stockCount} units` : "—" },
              { label:"Brand",       value: product.brand || "—" },
              { label:"Rating",      value: product.rating ? `${product.rating} / 5` : "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:14, padding:"14px 16px" }}>
                <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{label}</p>
                <p style={{ fontSize:13, fontWeight:700, color:"#1e293b", margin:0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Dolibarr */}
          <div style={{ background: product.dolibarr_ref ? "#eff6ff" : "#f8fafc", border:`1px solid ${product.dolibarr_ref ? "#bfdbfe" : "#e2e8f0"}`, borderRadius:14, padding:"16px 18px" }}>
            <p style={{ fontSize:10, fontWeight:800, color: product.dolibarr_ref ? "#1d4ed8" : "#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Dolibarr ERP</p>
            {product.dolibarr_ref ? (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#3b82f6" }} />
                <span style={{ fontSize:14, fontWeight:700, color:"#1d4ed8", fontFamily:"monospace" }}>{product.dolibarr_ref}</span>
              </div>
            ) : (
              <p style={{ fontSize:13, color:"#94a3b8", fontStyle:"italic", margin:0 }}>Not linked to Dolibarr yet — link in Edit</p>
            )}
          </div>

          {/* Categories */}
          {(product.categories || []).length > 0 && (
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Categories</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {product.categories.map(c => (
                  <span key={c} style={{ padding:"5px 12px", background:"#f1f5f9", border:"1px solid #e2e8f0", color:"#475569", fontSize:12, fontWeight:600, borderRadius:20 }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Descriptions */}
          {product.shortDesc && (
            <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:14, padding:"16px 18px" }}>
              <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Short Description</p>
              <p style={{ fontSize:13, color:"#475569", lineHeight:1.7, margin:0 }}>{product.shortDesc}</p>
            </div>
          )}

          {product.description && (
            <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:14, padding:"16px 18px" }}>
              <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Full Description</p>
              <p style={{ fontSize:13, color:"#475569", lineHeight:1.7, margin:0, whiteSpace:"pre-line" }}>{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shared button styles ─── */
const btnStyle = {
  primary: {
    display:"flex", alignItems:"center", gap:7, height:36, padding:"0 16px",
    background:"#e63946", color:"#fff", border:"none", borderRadius:10,
    fontSize:13, fontWeight:700, cursor:"pointer", transition:"background 0.15s",
  },
  danger: {
    display:"flex", alignItems:"center", gap:7, height:36, padding:"0 14px",
    background:"#fff", color:"#ef4444", border:"1px solid #fca5a5", borderRadius:10,
    fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.15s",
  },
  ghost: {
    display:"flex", alignItems:"center", gap:6, height:32, padding:"0 12px",
    background:"transparent", color:"#64748b", border:"1px solid #e2e8f0", borderRadius:8,
    fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.15s",
  },
};
