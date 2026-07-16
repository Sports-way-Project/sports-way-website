import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatPrice } from "../lib/format";
import { isOutOfStock } from "../lib/storefront";
import { useLiveStock } from "../hooks/useLiveStock";

export function ProductCard({ product: baseProduct, addToCart, toggleWishlist, wishlist }) {
  const navigate = useNavigate();
  const product = useLiveStock(baseProduct);
  const outOfStock = isOutOfStock(product);
  const [adding, setAdding] = useState(false);
  const [wishing, setWishing] = useState(false);
  const priceLabel = product.variations?.length
    ? `${formatPrice(Math.min(...product.variations.map((item) => item.price)))} - ${formatPrice(Math.max(...product.variations.map((item) => item.price)))}`
    : formatPrice(product.price);
  
  const productUrl = `/products/${product.slug || product.id}`;

  return (
    <div className="pcard">
      <div className="pcard-img" onClick={() => navigate(productUrl)}>
        {product.badge ? (
          <span className={`pcard-badge ${outOfStock ? "sold-out" : ""}`}>
            {outOfStock ? "out of stock" : product.badge}
          </span>
        ) : null}
        <button
          className="pcard-wish"
          aria-label="Wishlist"
          disabled={wishing}
          style={{ opacity: wishing ? 0.5 : 1, cursor: wishing ? "wait" : "pointer" }}
          onClick={async (event) => {
            event.stopPropagation();
            setWishing(true);
            try {
              await toggleWishlist(product.id);
            } finally {
              setWishing(false);
            }
          }}
        >
          {wishlist.includes(product.id) ? "\u2665" : "\u2661"}
        </button>
        <img src={product.img || product.image || undefined} alt={`${product.name} - Premium Gym & Sports Equipment in Qatar`} className="img-main" loading="lazy" decoding="async" />
        {product.imgHover ? <img src={product.imgHover} alt={`${product.name} - Best Fitness Gear in Qatar`} className="img-hover" loading="lazy" decoding="async" /> : null}
      </div>
      <div className="pcard-body">
        <Link to={productUrl} className="pcard-cat">
          {product.category.replace("-", " ")}
        </Link>
        <Link to={productUrl} className="pcard-name">
          {product.name}
        </Link>

        <div className="pcard-footer">
          <div>
            <span className="pcard-price">{priceLabel}</span>
            {product.oldPrice && !product.variations?.length ? (
              <span className="pcard-old">{formatPrice(product.oldPrice)}</span>
            ) : null}
          </div>
          <button
            className="pcard-add"
            onClick={async () => {
              setAdding(true);
              try {
                await addToCart(product);
              } finally {
                setAdding(false);
              }
            }}
            disabled={outOfStock || adding}
            style={{ opacity: adding ? 0.6 : 1, cursor: adding ? "wait" : undefined }}
            title={outOfStock ? "Out of stock" : "Add to cart"}
          >
            {adding ? "…" : "+"}
          </button>
        </div>
      </div>
    </div>
  );
}
