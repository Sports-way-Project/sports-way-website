import { SectionHeader } from "./SectionHeader";
import { formatPrice } from "../lib/format";

export function FeaturedSection({
  activeFilter,
  filters,
  filteredProducts,
  setActiveFilter,
  setVisibleCount,
  toggleWishlist,
  visibleCount,
  visibleProducts,
  wishlist,
  addToCart,
}) {
  return (
    <section className="featured" id="featured">
      <div className="container">
        <SectionHeader
          tag="Best Sellers"
          title="Featured Products"
          subtitle="Hand-picked by our fitness experts for quality and performance"
        />
        <div className="filter-tabs">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`filter-btn ${activeFilter === filter ? "active" : ""}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === "all" ? "All" : filter.replace("-", " ")}
            </button>
          ))}
        </div>

        <div className="products-grid">
          {visibleProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-img">
                {product.badge ? <span className="product-badge">{product.badge}</span> : null}
                <button
                  className="product-wishlist"
                  aria-label="Wishlist"
                  onClick={() => toggleWishlist(product.id)}
                >
                  {wishlist.includes(product.id) ? "\u2665" : "\u2661"}
                </button>
                <img src={product.image} alt={product.name} className="p-img-main" loading="lazy" />
              </div>
              <div className="product-info">
                <div className="product-category-tag">{product.category}</div>
                <a href={`product.html?id=${product.id}`} className="product-name">
                  {product.name}
                </a>
                <div className="product-category-details">{product.category.replace("-", " ")}</div>
                <div className="product-price-row">
                  <div>
                    <span className="product-price">{formatPrice(product.price)}</span>
                    <span className="product-old-price">{formatPrice(product.oldPrice)}</span>
                  </div>
                  <button className="add-to-cart" title="Add to cart" onClick={() => addToCart(product)}>
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {visibleCount < filteredProducts.length ? (
          <div className="load-more-wrap">
            <button className="btn btn-outline" onClick={() => setVisibleCount((count) => count + 8)}>
              Load More Products
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
