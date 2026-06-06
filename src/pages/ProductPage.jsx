import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { formatPrice } from "../lib/format";
import { getProductCategories, isOutOfStock, sortByPriority } from "../lib/storefront";

const CATEGORY_PAGES = {
  cardio: { label: "Gym Equipment", url: "gym-equipment.html" },
  treadmills: { label: "Gym Equipment", url: "gym-equipment.html#cardio" },
  bikes: { label: "Gym Equipment", url: "gym-equipment.html#cardio" },
  ellipticals: { label: "Gym Equipment", url: "gym-equipment.html#cardio" },
  rowers: { label: "Gym Equipment", url: "gym-equipment.html#cardio" },
  stairs: { label: "Gym Equipment", url: "gym-equipment.html#cardio" },
  strength: { label: "Gym Equipment", url: "gym-equipment.html#strength" },
  selectorized: { label: "Gym Equipment", url: "gym-equipment.html#strength" },
  "plate-loaded": { label: "Gym Equipment", url: "gym-equipment.html#strength" },
  "cable-motion": { label: "Gym Equipment", url: "gym-equipment.html#strength" },
  "power-rack": { label: "Gym Equipment", url: "gym-equipment.html#strength" },
  "multi-stations": { label: "Gym Equipment", url: "gym-equipment.html#strength" },
  "racks-benches": { label: "Gym Equipment", url: "gym-equipment.html#racks-benches" },
  racks: { label: "Gym Equipment", url: "gym-equipment.html#racks" },
  benches: { label: "Gym Equipment", url: "gym-equipment.html#benches" },
  "bars-weights": { label: "Gym Equipment", url: "gym-equipment.html#bars-weights" },
  bars: { label: "Gym Equipment", url: "gym-equipment.html#bars" },
  weights: { label: "Gym Equipment", url: "gym-equipment.html#weights" },
  accessories: { label: "Gym Equipment", url: "gym-equipment.html#accessories" },
  boxing: { label: "Gym Equipment", url: "gym-equipment.html#boxing" },
  sportswear: { label: "Sportswear", url: "sportswear.html" },
  mens: { label: "Sportswear", url: "sportswear.html#mens" },
  ladies: { label: "Sportswear", url: "sportswear.html#ladies" },
  kids: { label: "Sportswear", url: "sportswear.html#kids" },
  footwear: { label: "Footwear", url: "footwear.html" },
  running: { label: "Footwear", url: "footwear.html" },
  football: { label: "Sports Tools", url: "sports-tools.html#football" },
  basketball: { label: "Sports Tools", url: "sports-tools.html#basketball" },
  volleyball: { label: "Sports Tools", url: "sports-tools.html#volleyball" },
  training: { label: "Sports Tools", url: "sports-tools.html#training" },
  indoor: { label: "Sports Tools", url: "sports-tools.html#indoor" },
  other: { label: "Sports Tools", url: "sports-tools.html#other" },
  "sports-tools": { label: "Sports Tools", url: "sports-tools.html" },
  supplements: { label: "Supplements", url: "supplements.html" },
  protein: { label: "Supplements", url: "supplements.html#protein" },
  creatine: { label: "Supplements", url: "supplements.html#creatine" },
  preworkout: { label: "Supplements", url: "supplements.html#preworkout" },
  vitamins: { label: "Supplements", url: "supplements.html#vitamins" },
  minerals: { label: "Supplements", url: "supplements.html#minerals" },
  fatburner: { label: "Supplements", url: "supplements.html#fatburner" },
  flooring: { label: "Flooring", url: "flooring.html" },
  "gym-mats": { label: "Flooring", url: "flooring.html#gym-mats" },
  "sports-flooring": { label: "Flooring", url: "flooring.html#sports-flooring" },
};

function resolveParentPage(categories) {
  return categories.map((category) => CATEGORY_PAGES[category]).find(Boolean) || { label: "Products", url: "index.html" };
}

export function ProductPage({ products, addToCart, toggleWishlist, wishlist }) {
  const productId = useMemo(() => Number(new URLSearchParams(window.location.search).get("id")), []);
  const product = useMemo(() => products.find((item) => item.id === productId), [productId, products]);
  const [mainImage, setMainImage] = useState("");
  const [qty, setQty] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    document.title = product ? `${product.name} - Sports Way Trading Qatar` : "Product Details - Sports Way Trading Qatar";
  }, [product]);

  useEffect(() => {
    const initialImage = product?.img || product?.image || product?.cover || "";
    setMainImage(initialImage);
    setSelectedVariation(null);
    setSelectedOptions({});
    setQty(1);
  }, [product]);

  const categories = product ? getProductCategories(product) : [];
  const parentPage = resolveParentPage(categories);
  const outOfStock = product ? isOutOfStock(product) : false;
  const images = useMemo(() => {
    if (!product) {
      return [];
    }

    return [...new Set([
      product.img,
      product.image,
      product.cover,
      product.imgHover,
      ...(product.variations || []).map((variation) => variation.img),
    ].filter(Boolean))];
  }, [product]);

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

  return (
    <div className="product-page">
      <div className="container">
        <div className="product-details-grid">
          <div className="gallery-area">
            <div className="gallery-container">
              <div className="thumbnails">
                {images.map((image) => (
                  <button key={image} className={`thumb ${mainImage === image ? "active" : ""}`} onClick={() => setMainImage(image)}>
                    <img src={image} alt={product.name} />
                  </button>
                ))}
              </div>
              <div className="main-image">
                <img src={mainImage} alt={product.name} id="current-main-img" />
              </div>
            </div>
          </div>

          <div className="product-info-wrap">
            <div className="breadcrumb product-breadcrumb">
              <a href="index.html">Home</a>
              <span>/</span>
              <a href={parentPage.url}>{parentPage.label}</a>
              <span>/</span>
              <span>{product.name}</span>
            </div>
            <h1 className="product-title">{product.name}</h1>
            <div className="product-price-big">
              {displayedPrice}
              {product.oldPrice && !selectedVariation ? <span className="product-old-price-big">{formatPrice(product.oldPrice)}</span> : null}
            </div>
            <p className="product-description-summary">
              {product.shortDesc || "Premium sports equipment designed for durability and performance."}
            </p>

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

            <div className="action-row">
              <div className="qty-input">
                <button onClick={() => setQty((current) => Math.max(1, current - 1))}>-</button>
                <input readOnly value={qty} />
                <button onClick={() => setQty((current) => current + 1)}>+</button>
              </div>
              <button
                className="btn btn-primary add-btn-large"
                disabled={outOfStock || (product.variations?.length && !selectedVariation)}
                onClick={() => addToCart(product, qty, selectedVariation)}
              >
                {outOfStock ? "Out of Stock" : "Add to Shopping Cart"}
              </button>
            </div>

            <div className="specs-list">
              <div className="spec-item"><b>Category:</b><span>{categories.join(", ")}</span></div>
              <div className="spec-item"><b>Availability:</b><span>{outOfStock ? "Out of Stock" : "Currently In Stock"}</span></div>
              <div className="spec-item"><b>Wishlist:</b><span>{wishlist.includes(product.id) ? "Saved to wishlist" : "Not saved"}</span></div>
              <div className="spec-item"><b>Delivery:</b><span>Delivery and installation support available across Qatar.</span></div>
            </div>
          </div>
        </div>

        <div className="product-tabs">
          <div className="tab-headers">
            <div className="tab-header active">Detailed Description</div>
          </div>
          <div className="tab-content active">
            <div className="seo-content">
              <h3>Why Choose the {product.name}?</h3>
              <p>{product.description || "Premium sports equipment designed for durability and performance. Experience dependable training gear in Qatar with Sports Way."}</p>
              <p>At Sports Way Trading, we focus on equipment that stands up to repeated use, clearer product guidance, and local support when clients need follow-through after the sale.</p>
            </div>
          </div>
        </div>

        {relatedProducts.length ? (
          <div className="related-section">
            <h2 className="related-title">Related Products</h2>
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
      </div>
    </div>
  );
}
