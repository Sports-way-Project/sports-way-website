import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { PageHero } from "../components/PageHero";
import { catalogPageConfigs } from "../data/storefrontPages";
import { getProductCategories, matchProduct, normalizeText, sortByPriority } from "../lib/storefront";

function flattenFilters(filters) {
  return filters.flatMap((filter) => [filter, ...(filter.children || [])]);
}

function getFilterMap(config) {
  const filters = [...flattenFilters(config.sidebarFilters), ...(config.extraFilters || [])];
  return Object.fromEntries(filters.map((filter) => [filter.id, filter]));
}

export function CatalogPage({ currentPath, hiddenSubcategories = [], products, addToCart, toggleWishlist, wishlist }) {
  const config = catalogPageConfigs[currentPath];
  const visibleSidebarFilters = useMemo(() => config.sidebarFilters.map((filter) => ({
    ...filter,
    children: filter.children?.filter((child) => !hiddenSubcategories.includes(child.id)),
  })), [config.sidebarFilters, hiddenSubcategories]);
  const filterMap = useMemo(() => getFilterMap({ ...config, sidebarFilters: visibleSidebarFilters }), [config, visibleSidebarFilters]);
  const [activeFilterId, setActiveFilterId] = useState("all");
  const [sortValue, setSortValue] = useState("featured");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    document.title = `${config.title} - Sports Way Trading Qatar`;
  }, [config.title]);

  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "");
    setActiveFilterId(fromHash && filterMap[fromHash] ? fromHash : "all");
  }, [filterMap]);

  useEffect(() => {
    setPage(1);
    const url = activeFilterId === "all"
      ? window.location.pathname
      : `${window.location.pathname}#${activeFilterId}`;
    window.history.replaceState({}, "", url);
  }, [activeFilterId]);

  const baseProducts = useMemo(
    () => sortByPriority(products.filter((product) => getProductCategories(product).includes(config.baseToken))),
    [config.baseToken, products],
  );

  const counts = useMemo(() => {
    const next = { all: baseProducts.length };
    Object.values(filterMap).forEach((filter) => {
      if (filter.id === "all") {
        return;
      }
      next[filter.id] = baseProducts.filter((product) => matchProduct(product, filter)).length;
    });
    return next;
  }, [baseProducts, filterMap]);

  const filteredProducts = useMemo(() => {
    const activeFilter = filterMap[activeFilterId];
    let next = activeFilter && activeFilter.id !== "all"
      ? baseProducts.filter((product) => matchProduct(product, activeFilter))
      : [...baseProducts];

    const min = Number(priceMin) || 0;
    const max = Number(priceMax) || Number.POSITIVE_INFINITY;
    next = next.filter((product) => product.price >= min && product.price <= max);

    if (sortValue === "price-asc") {
      next.sort((left, right) => left.price - right.price);
    } else if (sortValue === "price-desc") {
      next.sort((left, right) => right.price - left.price);
    }

    return next;
  }, [activeFilterId, baseProducts, filterMap, priceMax, priceMin, sortValue]);

  const pageSize = 18;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);
  const activeFilter = filterMap[activeFilterId];
  const activeHub = config.hubs?.[activeFilter?.parent || activeFilterId]?.filter((card) => !hiddenSubcategories.includes(card.filterId));
  const recommendations = baseProducts
    .filter((product) => !visibleProducts.some((item) => item.id === product.id))
    .slice(0, 8);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <>
      <PageHero title={config.title} description={config.description} image={config.heroImage} />
      <div className="container">
        <div className="page-layout">
          <aside className="sidebar">
            <div className="sidebar-card">
              <div className="sidebar-title">Categories</div>
              <div className="filter-list">
                {visibleSidebarFilters.map((filter) => {
                  const hasChildren = Boolean(filter.children?.length);
                  const groupOpen = activeFilterId === filter.id || filter.children?.some((item) => item.id === activeFilterId);
                  return (
                    <div key={filter.id}>
                      <button
                        className={`filter-item ${activeFilterId === filter.id ? "active" : ""}`}
                        onClick={() => setActiveFilterId(filter.id)}
                      >
                        <span>{filter.label}</span>
                        <span className="filter-count">{counts[filter.id] || 0}</span>
                      </button>
                      {hasChildren && groupOpen ? (
                        <div className="filter-sub-list">
                          {filter.children.map((child) => (
                            <button
                              key={child.id}
                              className={`filter-sub-item ${activeFilterId === child.id ? "active-sub" : ""}`}
                              onClick={() => setActiveFilterId(child.id)}
                            >
                              <span>{child.label}</span>
                              <span className="filter-count">{counts[child.id] || 0}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sidebar-card">
              <div className="sidebar-title">Price Range (QAR)</div>
              <div className="price-range">
                <div className="price-inputs">
                  <input type="number" placeholder="Min" value={priceMin} onChange={(event) => setPriceMin(event.target.value)} />
                  <input type="number" placeholder="Max" value={priceMax} onChange={(event) => setPriceMax(event.target.value)} />
                </div>
              </div>
            </div>

            {(config.sidebarExtras || []).map((section) => (
              <div key={section.title} className="sidebar-card">
                <div className="sidebar-title">{section.title}</div>
                <div className="filter-list">
                  {section.items.map((item) => (
                    <div key={item} className="filter-item passive">
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          <main className="product-main">
            {activeHub ? (
              <div className={`category-hub-grid ${activeFilterId === "sports-accessories" ? "accessories-hub" : ""}`}>
                {activeHub.map((card) => (
                  <button key={card.filterId} className="hub-card" onClick={() => setActiveFilterId(card.filterId)}>
                    <img src={card.image} alt={card.label} loading="lazy" />
                    <span>{card.label}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="product-toolbar">
              <p className="results-count">Showing <strong>{filteredProducts.length}</strong> products</p>
              <select className="sort-select" value={sortValue} onChange={(event) => setSortValue(event.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            <div className="page-products-grid">
              {visibleProducts.length ? visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                  toggleWishlist={toggleWishlist}
                  wishlist={wishlist}
                />
              )) : <p className="empty-listing">No products found for the current filter.</p>}
            </div>

            {totalPages > 1 ? (
              <div className="page-pagination">
                {page > 1 ? <button className="nav-btn" onClick={() => setPage(page - 1)}>&lt;</button> : null}
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
                  <button key={value} className={value === page ? "active" : ""} onClick={() => setPage(value)}>
                    {value}
                  </button>
                ))}
                {page < totalPages ? <button className="nav-btn" onClick={() => setPage(page + 1)}>&gt;</button> : null}
              </div>
            ) : null}

            {recommendations.length ? (
              <div className="related-section">
                <h2 className="related-title">You May Also Like</h2>
                <div className="related-slider-wrap">
                  <div className="related-grid-scroll">
                    {recommendations.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        addToCart={addToCart}
                        toggleWishlist={toggleWishlist}
                        wishlist={wishlist}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </>
  );
}
