import { useState } from "react";
import { showAlert } from "../../lib/dialog.jsx";
import { friendlyApiError } from "../../lib/apiError";

const STEPS = [
  { id: 1, label: "Website Info", desc: "Name, SEO & Images" },
  { id: 2, label: "Categories", desc: "Catalog placement" },
  { id: 3, label: "Dolibarr Link", desc: "ERP reference" },
  { id: 4, label: "Stock", desc: "Availability" },
  { id: 5, label: "Price & Variations", desc: "Pricing & options" },
];

const BADGE_OPTIONS = ["", "new", "hot", "sale", "limited", "trending"];

const CATEGORY_TREE = [
  {
    label: "Gym Equipment", value: "gym-equipment",
    sub: ["cardio","treadmills","bikes","ellipticals","rowers","stairs","strength","selectorized","plate-loaded","cable-motion","multi-stations","racks","benches","bars","weights","accessories"],
  },
  {
    label: "Sports Tools", value: "sports-tools",
    sub: ["football","basketball","volleyball","indoor","training","sports-accessories","gloves","protector","socks","bags","caps","rackets","bottles"],
  },
  {
    label: "Sportswear", value: "sportswear",
    sub: ["mens","ladies","kids","tracksuit","sports-set","t-shirt","polo-shirt","pants","shorts"],
  },
  {
    label: "Footwear", value: "footwear",
    sub: ["running","futsal"],
  },
  {
    label: "Supplements", value: "supplements",
    sub: ["protein","creatine","preworkout","vitamins","minerals","fatburner"],
  },
  {
    label: "Flooring", value: "flooring",
    sub: ["gym-mats","sports-flooring","rubber","grass","vinyl","wood","indoor-flooring","outdoor-flooring"],
  },
];

function toLabel(val) {
  return val.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function StepIndicator({ currentStep, onStep }) {
  return (
    <div className="pw-steps">
      {STEPS.map((s, idx) => (
        <div key={s.id} className={`pw-step ${currentStep === s.id ? "active" : ""} ${currentStep > s.id ? "done" : ""}`}>
          <button type="button" className="pw-step-circle" onClick={() => currentStep > s.id && onStep(s.id)}>
            {currentStep > s.id ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            ) : s.id}
          </button>
          <div className="pw-step-info">
            <div className="pw-step-label">{s.label}</div>
            <div className="pw-step-desc">{s.desc}</div>
          </div>
          {idx < STEPS.length - 1 && <div className="pw-step-line" />}
        </div>
      ))}
    </div>
  );
}

const NON_PRODUCT_WIZ = new Set(["clients","partners","blog","wholesale","about","contact","clients_partners"]);

export function ProductWizard({ initialData = null, brands = [], customCategories = [], onSave, onCancel, uploadImage }) {
  const productCustomCats = customCategories.filter(c => !NON_PRODUCT_WIZ.has(c.toLowerCase()));
  const editing = Boolean(initialData?.id);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [info, setInfo] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    shortDesc: initialData?.shortDesc || "",
    description: initialData?.description || "",
    cover: initialData?.cover || initialData?.image || "",
    hover: initialData?.imgHover || "",
    galleryText: (initialData?.gallery || []).join("\n"),
    featured: initialData?.featured ?? true,
    badge: initialData?.badge || "",
    brand: initialData?.brand || "",
  });

  const [categories, setCategories] = useState(initialData?.categories || []);

  const [dolibarr, setDolibarr] = useState({
    ref: initialData?.dolibarr_ref || "",
    skipped: !initialData?.dolibarr_ref,
    status: null,
    mockData: null,
  });

  const [stock, setStock] = useState({
    status: initialData?.stockStatus || "instock",
    count: initialData?.stockCount ?? "",
    useDolibarr: false,
  });

  const [pricing, setPricing] = useState({
    price: initialData?.price || "",
    oldPrice: initialData?.oldPrice || "",
    useDolibarr: false,
  });

  const [variations, setVariations] = useState(initialData?.variations || []);

  function toggleCategory(val) {
    setCategories((cur) => cur.includes(val) ? cur.filter((c) => c !== val) : [...cur, val]);
  }

  function mockLookupDolibarr() {
    if (!dolibarr.ref.trim()) return;
    setDolibarr((d) => ({ ...d, status: "loading" }));
    setTimeout(() => {
      setDolibarr((d) => ({
        ...d,
        status: "found",
        mockData: {
          ref: d.ref,
          label: "Sample Product from Dolibarr",
          price_ttc: "199.00",
          stock: 12,
          description: "Automatically fetched from Dolibarr ERP (prototype simulation)",
        },
      }));
    }, 900);
  }

  function applyDolibarrData() {
    if (!dolibarr.mockData) return;
    setStock((s) => ({ ...s, count: dolibarr.mockData.stock, useDolibarr: true }));
    setPricing((p) => ({ ...p, price: dolibarr.mockData.price_ttc, useDolibarr: true }));
  }

  function addVariation() {
    setVariations((v) => [...v, { label: "", price: "", stockStatus: "instock", image: "" }]);
  }

  function updateVariation(idx, field, val) {
    setVariations((v) => v.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }

  function removeVariation(idx) {
    setVariations((v) => v.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setSaving(true);
    const product = {
      ...(initialData || {}),
      name: info.name,
      slug: info.slug || info.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      shortDesc: info.shortDesc,
      description: info.description,
      image: info.cover,
      cover: info.cover,
      img: info.cover,
      imgHover: info.hover,
      gallery: info.galleryText.split("\n").map((u) => u.trim()).filter(Boolean),
      featured: info.featured,
      badge: info.badge,
      brand: info.brand,
      categories,
      category: categories[0] || "gym-equipment",
      dolibarr_ref: dolibarr.skipped ? "" : dolibarr.ref,
      stockStatus: stock.status,
      stockCount: stock.count === "" ? null : Number(stock.count),
      price: Number(pricing.price || 0),
      oldPrice: pricing.oldPrice === "" ? null : Number(pricing.oldPrice),
      variations,
      rating: initialData?.rating || 5,
      reviews: initialData?.reviews || 0,
      attributes: initialData?.attributes || [],
    };
    try {
      await onSave(product);
    } finally {
      setSaving(false);
    }
  }

  async function handleImageField(field, file) {
    if (!uploadImage) return;
    try {
      const url = await uploadImage(file, field);
      if (!url) return; // upload failed — uploadImage already alerted the error
      if (field === "cover") setInfo((i) => ({ ...i, cover: url }));
      if (field === "hover") setInfo((i) => ({ ...i, hover: url }));
    } catch (err) {
      showAlert("Failed to upload image: " + friendlyApiError(err));
    }
  }

  const canNext = step === 1 ? info.name.trim().length > 0 : true;

  return (
    <div className="pw-root">
      <div className="pw-header">
        <h2 className="pw-title">{editing ? `Edit Product — ${initialData.name}` : "Add New Product"}</h2>
        <button type="button" className="pw-cancel" onClick={onCancel}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Cancel
        </button>
      </div>

      <StepIndicator currentStep={step} onStep={setStep} />

      <div className="pw-body">
        {/* ── STEP 1 ── Website Info */}
        {step === 1 && (
          <div className="pw-section">
            <h3 className="pw-section-title">Website Information & SEO</h3>
            <div className="pw-grid-2">
              <label className="pw-field pw-span-2">
                <span>Product Name *</span>
                <input value={info.name} onChange={(e) => setInfo((i) => ({ ...i, name: e.target.value }))} placeholder="e.g. Commercial Treadmill Pro X9" required />
              </label>
              <label className="pw-field">
                <span>URL Slug</span>
                <input value={info.slug} onChange={(e) => setInfo((i) => ({ ...i, slug: e.target.value }))} placeholder="auto-generated-from-name" />
                <small>Leave blank to auto-generate</small>
              </label>
              <label className="pw-field">
                <span>Badge</span>
                <select value={info.badge} onChange={(e) => setInfo((i) => ({ ...i, badge: e.target.value }))}>
                  {BADGE_OPTIONS.map((b) => <option key={b} value={b}>{b || "No badge"}</option>)}
                </select>
              </label>
              <label className="pw-field pw-span-2">
                <span>Short Description</span>
                <textarea rows={2} value={info.shortDesc} onChange={(e) => setInfo((i) => ({ ...i, shortDesc: e.target.value }))} placeholder="Brief summary (shown in product cards)" />
              </label>
              <label className="pw-field pw-span-2">
                <span>Full Description</span>
                <textarea rows={5} value={info.description} onChange={(e) => setInfo((i) => ({ ...i, description: e.target.value }))} placeholder="Detailed product description (shown on product page)" />
              </label>
            </div>

            <h3 className="pw-section-title" style={{ marginTop: 28 }}>Images</h3>
            <div className="pw-grid-2">
              <div className="pw-field">
                <span>Cover Image</span>
                {info.cover && <img src={info.cover} alt="cover" className="pw-img-preview" />}
                <input value={info.cover} onChange={(e) => setInfo((i) => ({ ...i, cover: e.target.value }))} placeholder="Paste URL or upload below" />
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageField("cover", e.target.files[0])} />
              </div>
              <div className="pw-field">
                <span>Hover Image</span>
                {info.hover && <img src={info.hover} alt="hover" className="pw-img-preview" />}
                <input value={info.hover} onChange={(e) => setInfo((i) => ({ ...i, hover: e.target.value }))} placeholder="Paste URL or upload below" />
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageField("hover", e.target.files[0])} />
              </div>
              <div className="pw-field pw-span-2">
                <span>Gallery Images (one URL per line)</span>
                <textarea rows={3} value={info.galleryText} onChange={(e) => setInfo((i) => ({ ...i, galleryText: e.target.value }))} placeholder="https://..." />
              </div>
            </div>

            <div className="pw-row" style={{ marginTop: 20, gap: 24 }}>
              <label className="pw-toggle-row">
                <input type="checkbox" checked={info.featured} onChange={(e) => setInfo((i) => ({ ...i, featured: e.target.checked }))} />
                <div>
                  <div className="pw-toggle-label">Featured Product</div>
                  <div className="pw-toggle-sub">Show on homepage featured section</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── Categories */}
        {step === 2 && (
          <div className="pw-section">
            <h3 className="pw-section-title">Categories & Brand</h3>
            <div className="pw-cat-grid">
              {CATEGORY_TREE.map((cat) => (
                <div key={cat.value} className="pw-cat-card">
                  <label className="pw-cat-main">
                    <input type="checkbox" checked={categories.includes(cat.value)} onChange={() => toggleCategory(cat.value)} />
                    <strong>{cat.label}</strong>
                  </label>
                  <div className="pw-cat-subs">
                    {cat.sub.map((s) => (
                      <label key={s} className={`pw-sub-chip ${categories.includes(s) ? "sel" : ""}`}>
                        <input type="checkbox" checked={categories.includes(s)} onChange={() => toggleCategory(s)} />
                        {toLabel(s)}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {productCustomCats.length > 0 && (
                <div className="pw-cat-card">
                  <div className="pw-cat-main"><strong>Custom Categories</strong></div>
                  <div className="pw-cat-subs">
                    {productCustomCats.map((c) => (
                      <label key={c} className={`pw-sub-chip ${categories.includes(c) ? "sel" : ""}`}>
                        <input type="checkbox" checked={categories.includes(c)} onChange={() => toggleCategory(c)} />
                        {toLabel(c)}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 20 }}>
              <label className="pw-field" style={{ maxWidth: 300 }}>
                <span>Brand</span>
                <select value={info.brand} onChange={(e) => setInfo((i) => ({ ...i, brand: e.target.value }))}>
                  <option value="">No brand</option>
                  {[...new Set(brands.map((b) => b.name || b))].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── Dolibarr Link */}
        {step === 3 && (
          <div className="pw-section">
            <div className="pw-dolibarr-banner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
              <div>
                <div style={{ fontWeight: 700 }}>Link to Dolibarr ERP</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Enter the product reference from your Dolibarr catalog to sync stock and price automatically.</div>
              </div>
            </div>

            <div className="pw-dolibarr-form">
              <label className="pw-field" style={{ flex: 1 }}>
                <span>Dolibarr Product Reference</span>
                <input
                  value={dolibarr.ref}
                  onChange={(e) => setDolibarr((d) => ({ ...d, ref: e.target.value, status: null, mockData: null }))}
                  placeholder="e.g. PRD-00142 or TREADMILL-X9"
                  disabled={dolibarr.skipped}
                />
              </label>
              <button type="button" className="pw-btn-primary" onClick={mockLookupDolibarr} disabled={dolibarr.skipped || !dolibarr.ref.trim() || dolibarr.status === "loading"}>
                {dolibarr.status === "loading" ? "Searching..." : "Look up in Dolibarr"}
              </button>
            </div>

            {dolibarr.status === "found" && dolibarr.mockData && (
              <div className="pw-dolibarr-result">
                <div className="pw-dolibarr-result-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Product found in Dolibarr
                </div>
                <div className="pw-dolibarr-data-grid">
                  <div><span>Label</span><strong>{dolibarr.mockData.label}</strong></div>
                  <div><span>Price (TTC)</span><strong>{dolibarr.mockData.price_ttc} QAR</strong></div>
                  <div><span>Current Stock</span><strong>{dolibarr.mockData.stock} units</strong></div>
                  <div><span>Description</span><strong>{dolibarr.mockData.description}</strong></div>
                </div>
                <button type="button" className="pw-btn-secondary" onClick={applyDolibarrData}>Apply stock & price from Dolibarr →</button>
              </div>
            )}

            <label className="pw-toggle-row" style={{ marginTop: 28 }}>
              <input type="checkbox" checked={dolibarr.skipped} onChange={(e) => setDolibarr((d) => ({ ...d, skipped: e.target.checked, ref: "", status: null, mockData: null }))} />
              <div>
                <div className="pw-toggle-label">Skip for now</div>
                <div className="pw-toggle-sub">You can link this product to Dolibarr later by editing it</div>
              </div>
            </label>
          </div>
        )}

        {/* ── STEP 4 ── Stock */}
        {step === 4 && (
          <div className="pw-section">
            <h3 className="pw-section-title">Stock & Availability</h3>
            {stock.useDolibarr && (
              <div className="pw-info-banner">Data pre-filled from Dolibarr — you can still override manually.</div>
            )}
            <div className="pw-grid-2" style={{ maxWidth: 540 }}>
              <label className="pw-field">
                <span>Stock Status</span>
                <select value={stock.status} onChange={(e) => setStock((s) => ({ ...s, status: e.target.value }))}>
                  <option value="instock">In Stock</option>
                  <option value="outofstock">Out of Stock</option>
                  <option value="onbackorder">🕐 On Backorder</option>
                </select>
              </label>
              <label className="pw-field">
                <span>Stock Count</span>
                <input type="number" min="0" value={stock.count} onChange={(e) => setStock((s) => ({ ...s, count: e.target.value }))} placeholder="Leave blank to hide count" />
              </label>
            </div>
            <div className="pw-stock-visual">
              <div className={`pw-stock-badge ${stock.status}`}>
                {stock.status === "instock" ? "In Stock" : stock.status === "outofstock" ? "Out of Stock" : "On Backorder"}
                {stock.count !== "" && stock.count > 0 ? ` — ${stock.count} units` : ""}
              </div>
              <small>Preview of how stock appears on product page</small>
            </div>
          </div>
        )}

        {/* ── STEP 5 ── Price & Variations */}
        {step === 5 && (
          <div className="pw-section">
            <h3 className="pw-section-title">Pricing</h3>
            {pricing.useDolibarr && (
              <div className="pw-info-banner">Price pre-filled from Dolibarr — you can still override.</div>
            )}
            <div className="pw-grid-2" style={{ maxWidth: 400 }}>
              <label className="pw-field">
                <span>Price (QAR) *</span>
                <input type="number" min="0" step="0.01" value={pricing.price} onChange={(e) => setPricing((p) => ({ ...p, price: e.target.value }))} required />
              </label>
              <label className="pw-field">
                <span>Old Price (QAR) — optional</span>
                <input type="number" min="0" step="0.01" value={pricing.oldPrice} onChange={(e) => setPricing((p) => ({ ...p, oldPrice: e.target.value }))} placeholder="Shows crossed-out" />
              </label>
            </div>

            <div style={{ marginTop: 32 }}>
              <div className="pw-section-title-row">
                <h3 className="pw-section-title" style={{ margin: 0 }}>Variations</h3>
                <button type="button" className="pw-btn-secondary" onClick={addVariation}>+ Add Variation</button>
              </div>
              <p className="pw-hint">Each variation is a separate purchasable option (e.g. Size S, Size M). In a future update, each can link to a separate Dolibarr product reference.</p>
              {variations.length === 0 ? (
                <div className="pw-empty-state">No variations added. Click "Add Variation" to create size/color options.</div>
              ) : (
                <div className="pw-variations-list">
                  {variations.map((v, idx) => (
                    <div key={idx} className="pw-variation-row">
                      <label className="pw-field">
                        <span>Label</span>
                        <input value={v.label} onChange={(e) => updateVariation(idx, "label", e.target.value)} placeholder="e.g. Size L" />
                      </label>
                      <label className="pw-field">
                        <span>Price (QAR)</span>
                        <input type="number" value={v.price} onChange={(e) => updateVariation(idx, "price", e.target.value)} placeholder="Override price" />
                      </label>
                      <label className="pw-field">
                        <span>Stock Status</span>
                        <select value={v.stockStatus} onChange={(e) => updateVariation(idx, "stockStatus", e.target.value)}>
                          <option value="instock">In Stock</option>
                          <option value="outofstock">Out of Stock</option>
                        </select>
                      </label>
                      <div className="pw-field pw-dolibarr-chip">
                        <span>Dolibarr Ref (future)</span>
                        <div className="pw-disabled-field">Link per variation — coming soon</div>
                      </div>
                      <button type="button" className="pw-btn-danger-sm" onClick={() => removeVariation(idx)}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pw-footer">
        <div className="pw-footer-left">
          {step > 1 && (
            <button type="button" className="pw-btn-ghost" onClick={() => setStep((s) => s - 1)}>← Back</button>
          )}
        </div>
        <div className="pw-footer-right">
          <button type="button" className="pw-btn-ghost" onClick={onCancel}>Cancel</button>
          {step < STEPS.length ? (
            <button type="button" className="pw-btn-primary" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Continue →
            </button>
          ) : (
            <button type="button" className="pw-btn-primary" onClick={handleSave} disabled={saving || !pricing.price}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Product"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
