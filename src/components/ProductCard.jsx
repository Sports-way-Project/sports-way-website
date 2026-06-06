import { formatPrice } from "../lib/format";
import { isOutOfStock } from "../lib/storefront";

export function ProductCard({ product, addToCart, toggleWishlist, wishlist }) {
  const outOfStock = isOutOfStock(product);
  const priceLabel = product.variations?.length
    ? `${formatPrice(Math.min(...product.variations.map((item) => item.price)))} - ${formatPrice(Math.max(...product.variations.map((item) => item.price)))}`
    : formatPrice(product.price);

  return (
    <div className="pcard">
      <div className="pcard-img" onClick={() => { window.location.href = `product.html?id=${product.id}`; }}>
        {product.badge ? (
          <span className={`pcard-badge ${outOfStock ? "sold-out" : ""}`}>
            {outOfStock ? "out of stock" : product.badge}
          </span>
        ) : null}
        <button
          className="pcard-wish"
          aria-label="Wishlist"
          onClick={(event) => {
            event.stopPropagation();
            toggleWishlist(product.id);
          }}
        >
          {wishlist.includes(product.id) ? "\u2665" : "\u2661"}
        </button>
        <img src={product.img || product.image} alt={product.name} className="img-main" loading="lazy" />
        {product.imgHover ? <img src={product.imgHover} alt={product.name} className="img-hover" loading="lazy" /> : null}
      </div>
      <div className="pcard-body">
        <a href={`product.html?id=${product.id}`} className="pcard-cat">
          {product.category.replace("-", " ")}
        </a>
        <a href={`product.html?id=${product.id}`} className="pcard-name">
          {product.name}
        </a>
        <div className="pcard-category-details">
          {(product.categories || [product.category])
            .filter(Boolean)
            .map((item) => item.replace("-", " "))
            .join(", ")}
        </div>
        <div className="pcard-footer">
          <div>
            <span className="pcard-price">{priceLabel}</span>
            {product.oldPrice && !product.variations?.length ? (
              <span className="pcard-old">{formatPrice(product.oldPrice)}</span>
            ) : null}
          </div>
          <button
            className="pcard-add"
            onClick={() => addToCart(product)}
            disabled={outOfStock}
            title={outOfStock ? "Out of stock" : "Add to cart"}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
