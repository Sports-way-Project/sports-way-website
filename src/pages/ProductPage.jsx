import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { SEO } from "../components/SEO";
import { formatPrice } from "../lib/format";
import { useLiveStock } from "../hooks/useLiveStock";
import { getProductCategories, isOutOfStock, sortByPriority } from "../lib/storefront";

const CATEGORY_PAGES = {
  cardio: { label: "Gym Equipment", url: "/categories/gym-equipment" },
  treadmills: { label: "Gym Equipment", url: "/categories/gym-equipment#cardio" },
  bikes: { label: "Gym Equipment", url: "/categories/gym-equipment#cardio" },
  ellipticals: { label: "Gym Equipment", url: "/categories/gym-equipment#cardio" },
  rowers: { label: "Gym Equipment", url: "/categories/gym-equipment#cardio" },
  stairs: { label: "Gym Equipment", url: "/categories/gym-equipment#cardio" },
  strength: { label: "Gym Equipment", url: "/categories/gym-equipment#strength" },
  selectorized: { label: "Gym Equipment", url: "/categories/gym-equipment#strength" },
  "plate-loaded": { label: "Gym Equipment", url: "/categories/gym-equipment#strength" },
  "cable-motion": { label: "Gym Equipment", url: "/categories/gym-equipment#strength" },
  "multi-stations": { label: "Gym Equipment", url: "/categories/gym-equipment#strength" },
  "racks-benches": { label: "Gym Equipment", url: "/categories/gym-equipment#racks-benches" },
  racks: { label: "Gym Equipment", url: "/categories/gym-equipment#racks" },
  benches: { label: "Gym Equipment", url: "/categories/gym-equipment#benches" },
  "bars-weights": { label: "Gym Equipment", url: "/categories/gym-equipment#bars-weights" },
  bars: { label: "Gym Equipment", url: "/categories/gym-equipment#bars" },
  weights: { label: "Gym Equipment", url: "/categories/gym-equipment#weights" },
  accessories: { label: "Gym Equipment", url: "/categories/gym-equipment#accessories" },
  boxing: { label: "Gym Equipment", url: "/categories/gym-equipment#boxing" },
  sportswear: { label: "Sportswear", url: "/categories/sportswear" },
  mens: { label: "Sportswear", url: "/categories/sportswear#mens" },
  ladies: { label: "Sportswear", url: "/categories/sportswear#ladies" },
  kids: { label: "Sportswear", url: "/categories/sportswear#kids" },
  footwear: { label: "Footwear", url: "/categories/footwear" },
  running: { label: "Footwear", url: "/categories/footwear" },
  football: { label: "Sports Tools", url: "/categories/sports-tools#football" },
  basketball: { label: "Sports Tools", url: "/categories/sports-tools#basketball" },
  volleyball: { label: "Sports Tools", url: "/categories/sports-tools#volleyball" },
  training: { label: "Sports Tools", url: "/categories/sports-tools#training" },
  indoor: { label: "Sports Tools", url: "/categories/sports-tools#indoor" },
  other: { label: "Sports Tools", url: "/categories/sports-tools#other" },
  "sports-tools": { label: "Sports Tools", url: "/categories/sports-tools" },
  supplements: { label: "Supplements", url: "/categories/supplements" },
  protein: { label: "Supplements", url: "/categories/supplements#protein" },
  creatine: { label: "Supplements", url: "/categories/supplements#creatine" },
  preworkout: { label: "Supplements", url: "/categories/supplements#preworkout" },
  vitamins: { label: "Supplements", url: "/categories/supplements#vitamins" },
  minerals: { label: "Supplements", url: "/categories/supplements#minerals" },
  fatburner: { label: "Supplements", url: "/categories/supplements#fatburner" },
  flooring: { label: "Flooring", url: "/categories/flooring" },
  "gym-mats": { label: "Flooring", url: "/categories/flooring#gym-mats" },
  "sports-flooring": { label: "Flooring", url: "/categories/flooring#sports-flooring" },
};

function resolveParentPage(categories) {
  return categories.map((category) => CATEGORY_PAGES[category]).find(Boolean) || { label: "Products", url: "/" };
}

export function ProductPage({ products, addToCart, toggleWishlist, wishlist }) {
  const { slug } = useParams();
  const baseProduct = useMemo(() => {
    if (!slug) return null;
    return products.find((item) => String(item.slug || item.id) === String(slug));
  }, [slug, products]);
  const product = useLiveStock(baseProduct);

  const navigate = useNavigate();
  const [mainImage, setMainImage] = useState("");
  const [qty, setQty] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [addingToCart, setAddingToCart] = useState(false);
  const liveVariation = useLiveStock(selectedVariation);

  function buyNow() {
    addToCart(product, qty, selectedVariation, false);
    navigate("/checkout");
  }

  useEffect(() => {
    const initialImage = product?.img || product?.image || product?.cover || "";
    setMainImage(initialImage);
    setSelectedVariation(null);
    setSelectedOptions({});
    setQty(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Deliberately keyed on the product's identity, not the whole object —
    // useLiveStock swaps in a new merged object once the stock check resolves,
    // and that shouldn't reset the gallery/variation the visitor already picked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const categories = product ? getProductCategories(product) : [];
  const parentPage = resolveParentPage(categories);
  const activeStockStatus = selectedVariation ? liveVariation?.stockStatus : product?.stockStatus;
  const activeStockCount = selectedVariation ? liveVariation?.stockCount : product?.stockCount;
  const outOfStock = product ? isOutOfStock({ ...product, stockStatus: activeStockStatus }) : false;
  const images = useMemo(() => {
    if (!product) {
      return [];
    }

    return [...new Set([
      product.img,
      product.image,
      product.cover,
      product.imgHover,
      ...(product.gallery || []),
      ...(product.variations || []).map((variation) => variation.img),
    ].filter(Boolean))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, product?.img, product?.image, product?.cover, product?.imgHover, product?.gallery, product?.variations]);

  const variationAttributes = useMemo(() => {
    const first = product?.variations?.find((variation) => variation.options);
    return first ? Object.keys(first.options) : [];
  }, [product]);

  useEffect(() => {
    if (!variationAttributes.length || !product?.variations?.length) {
      return;
    }

    const allSelected = variationAttributes.every((attribute) => selectedOptions[attribute]);
    if (!allSelected) {
      setSelectedVariation(null);
      return;
    }

    const match = product.variations.find((variation) =>
      variationAttributes.every((attribute) => String(variation.options?.[attribute] || "") === selectedOptions[attribute]),
    );
    setSelectedVariation(match || null);
    if (match?.img) {
      setMainImage(match.img);
    }
  }, [product, selectedOptions, variationAttributes]);

  const relatedProducts = useMemo(() => {
    if (!product) {
      return [];
    }

    const productCategories = getProductCategories(product);
    const nameWords = product.name.toLowerCase().split(" ").filter((word) => word.length > 3);
    return sortByPriority(
      products
        .filter((item) => item.id !== product.id)
        .filter((item) => {
          const itemCategories = getProductCategories(item);
          return productCategories.some((category) => itemCategories.includes(category))
            || nameWords.some((word) => item.name.toLowerCase().includes(word));
        }),
    ).slice(0, 8);
  }, [product, products]);

  if (!product) {
    return (
      <div className="container simple-page">
        <h1 className="section-title">Product not found</h1>
      </div>
    );
  }

  const displayedPrice = selectedVariation?.price
    ? formatPrice(selectedVariation.price)
    : product.variations?.length
      ? `${formatPrice(Math.min(...product.variations.map((item) => item.price)))} - ${formatPrice(Math.max(...product.variations.map((item) => item.price)))}`
      : formatPrice(product.price);
      
  const productUrl = `https://www.sports-way.com/products/${product.slug || product.id}`;

  return (
    <div className="product-page">
      <SEO 
        title={`${product.name} | Buy in Qatar | Sports Way`}
        description={product.description || `${product.name} in ${categories.join(", ")}. Shop premium sports equipment at Sports Way Qatar. Best prices, fast delivery.`}
        image={mainImage || "https://www.sports-way.com/logo.png"}
        url={productUrl}
        product={product}
      />
      <div className="container">
        <div className="product-details-grid">
          <div className="gallery-area">
            <div className="gallery-container">
              <div className="thumbnails">
                {images.map((image, index) => (
                  <button key={image} className={`thumb ${mainImage === image ? "active" : ""}`} onClick={() => setMainImage(image)}>
                    <img src={image} alt={`${product.name} - Gym Equipment & Sports Tools Qatar view ${index + 1}`} loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
              <div className="main-image">
                <img src={mainImage || undefined} alt={`${product.name} - Best Fitness Equipment Supplier in Qatar`} id="current-main-img" loading="eager" fetchPriority="high" />
              </div>
            </div>
          </div>

          <div className="product-info-wrap">
            <div className="breadcrumb product-breadcrumb">
              <Link to="/">Home</Link>
              <span>/</span>
              <Link to={parentPage.url}>{parentPage.label}</Link>
              <span>/</span>
              <span>{product.name}</span>
            </div>
            <h1 className="product-title">{product.name}</h1>
            <div className="product-price-big">
              {displayedPrice}
              {product.oldPrice && !selectedVariation ? <span className="product-old-price-big">{formatPrice(product.oldPrice)}</span> : null}
            </div>
            <p className="product-description-summary">
              {(product.shortDesc || "Premium sports equipment designed for durability and performance.").split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </p>
            
            <div className="product-free-shipping-banner">
              🚚 Add 300,00 ر.ق. to cart and get free shipping!
            </div>

            {variationAttributes.length ? (
              <div className="variation-selector-wrap">
                <span className="variation-label">Choose Options</span>
                <div className="variation-select-grid">
                  {variationAttributes.map((attribute) => {
                    const options = [...new Set(product.variations.map((variation) => variation.options?.[attribute]).filter(Boolean))];
                    return (
                      <label key={attribute} className="variation-select-field">
                        <span>{attribute}</span>
                        <select
                          value={selectedOptions[attribute] || ""}
                          onChange={(event) => setSelectedOptions((current) => ({ ...current, [attribute]: event.target.value }))}
                        >
                          <option value="">Choose an option</option>
                          {options.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : product.variations?.length ? (
              <div className="variation-selector-wrap">
                <span className="variation-label">Available Sizes</span>
                <div className="variation-chips">
                  {product.variations.map((variation) => (
                    <button
                      key={variation.label}
                      className={`variation-chip ${selectedVariation?.label === variation.label ? "active" : ""} ${variation.stockStatus === "outofstock" ? "outofstock" : ""}`}
                      onClick={() => variation.stockStatus !== "outofstock" && setSelectedVariation(variation)}
                    >
                      {variation.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {activeStockCount != null && !outOfStock && (
              <div className="product-stock-indicator">
                <span className="stock-check">✓</span> {activeStockCount} in stock
              </div>
            )}

            <div className="action-row">
              <div className="qty-input">
                <button onClick={() => setQty((current) => Math.max(1, current - 1))}>-</button>
                <input readOnly value={qty} />
                <button onClick={() => setQty((current) => current + 1)}>+</button>
              </div>
              <button
                className="btn btn-primary add-btn-large"
                disabled={outOfStock || (product.variations?.length && !selectedVariation) || addingToCart}
                style={{ opacity: addingToCart ? 0.6 : 1 }}
                onClick={async () => {
                  setAddingToCart(true);
                  try {
                    await addToCart(product, qty, selectedVariation);
                  } finally {
                    setAddingToCart(false);
                  }
                }}
              >
                {outOfStock ? "Out of Stock" : addingToCart ? "Adding…" : "Add to Cart"}
              </button>
              {!outOfStock && (
                <button
                  className="btn btn-buy-now"
                  disabled={product.variations?.length && !selectedVariation}
                  onClick={buyNow}
                >
                  Buy Now
                </button>
              )}
            </div>

            <div className="specs-list">
              <div className="spec-item"><b>Category:</b><span>{categories.join(", ")}</span></div>
              <div className="spec-item"><b>Delivery:</b><span>Delivery and installation support available across Qatar.</span></div>
            </div>
          </div>
        </div>

        <div className="product-tabs">
          <div className="tab-headers">
            <div className="tab-header active">More Details</div>
          </div>
          <div className="tab-content active">
            <div className="seo-content">
              <h2>Why Choose the {product.name}?</h2>
              <div className="product-description-body">
                {(product.description || "Premium sports equipment designed for durability and performance. Experience dependable training gear in Qatar with Sports Way.").split(/\n{2,}|\n/).map((para, i) => para.trim() ? <p key={i}>{para.trim()}</p> : null)}
                <p className="seo-footer-note">At Sports Way Trading, we focus on equipment that stands up to repeated use, clearer product guidance, and local support when clients need follow-through after the sale.</p>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length ? (
          <div className="related-section">
            <h3 className="related-title" style={{ fontSize: "28px", fontWeight: "800", marginBottom: "24px" }}>You May Also Like</h3>
            <div className="related-slider-wrap">
              <div className="related-grid-scroll">
                {relatedProducts.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    addToCart={addToCart}
                    toggleWishlist={toggleWishlist}
                    wishlist={wishlist}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Hidden SEO Keywords Block */}
        <div className="seo-hidden-keywords" aria-hidden="true">
          Buy {product.name} in Qatar. Best gym equipment, premium fitness tools, wholesale sports gear, {product.brand} supplier, {product.category} in Doha Qatar. Sports Way Trading offers top tier {product.name} with delivery and installation. Shop commercial gym setup, fitness machines, health club equipment, strength and cardio, sports tools, and premium fitness accessories.
        </div>
      </div>
    </div>
  );
}

