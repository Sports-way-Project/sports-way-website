import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SEO } from "../components/SEO";
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

const EMPTY_CONFIG = { sidebarFilters: [], title: "", description: "", heroImage: "", baseToken: "" };

export function CatalogPage({ currentPath, hiddenSubcategories = [], showBrandsFilter = true, brands = [], products, addToCart, toggleWishlist, wishlist }) {
  const config = catalogPageConfigs[currentPath];
  const location = useLocation();
  const navigate = useNavigate();

  // Every hook below must run unconditionally regardless of whether `config`
  // resolves — this route pattern ("/categories/:slug") keeps the same
  // component instance mounted across param changes, so an early return
  // before these hooks (moving from a valid to an invalid slug on the same
  // instance) used to throw a "change in the order of Hooks" error. Falling
  // back to EMPTY_CONFIG keeps the hook count constant; the actual
  // "not found" UI is rendered further down, after all hooks have run.
  const safeConfig = config || EMPTY_CONFIG;
  const visibleSidebarFilters = useMemo(() => safeConfig.sidebarFilters.map((filter) => ({
    ...filter,
    children: filter.children?.filter((child) => !hiddenSubcategories.includes(child.id)),
  })), [safeConfig.sidebarFilters, hiddenSubcategories]);
  const filterMap = useMemo(() => getFilterMap({ ...safeConfig, sidebarFilters: visibleSidebarFilters }), [safeConfig, visibleSidebarFilters]);
  const [activeFilterId, setActiveFilterId] = useState("all");
  const [sortValue, setSortValue] = useState("featured");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (config) document.title = `${safeConfig.title} - Sports Way Trading Qatar`;
  }, [config, safeConfig.title]);

  useEffect(() => {
    const fromHash = location.hash.replace("#", "");
    setActiveFilterId(fromHash && filterMap[fromHash] ? fromHash : "all");
  }, [filterMap]);

  useEffect(() => {
    setPage(1);
    setSelectedBrands([]); // Reset brands when filter changes
    const url = activeFilterId === "all"
      ? location.pathname
      : `${location.pathname}#${activeFilterId}`;
    navigate(url, { replace: true });
  }, [activeFilterId]);

  const baseProducts = useMemo(
    () => sortByPriority(products.filter((product) => getProductCategories(product).includes(safeConfig.baseToken))),
    [safeConfig.baseToken, products],
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

  const categoryProducts = useMemo(() => {
    const activeFilter = filterMap[activeFilterId];
    return activeFilter && activeFilter.id !== "all"
      ? baseProducts.filter((product) => matchProduct(product, activeFilter))
      : [...baseProducts];
  }, [activeFilterId, baseProducts, filterMap]);

  const brandCounts = useMemo(() => {
    const mappedBrandNames = (brands || [])
      .filter((b) => b && typeof b === 'object' && b.category === safeConfig.baseToken)
      .map((b) => b.name);

    const bCounts = {};
    const brandDisplayNames = {};

    for (const name of mappedBrandNames) {
      const lower = name.toLowerCase();
      bCounts[lower] = 0;
      brandDisplayNames[lower] = name;
    }

    for (const p of categoryProducts) {
      if (p.brand) {
        const lowerBrand = p.brand.toLowerCase();
        if (bCounts[lowerBrand] !== undefined) {
          bCounts[lowerBrand] += 1;
        }
      }
    }

    return Object.entries(bCounts)
      .map(([lowerBrand, count]) => ({ brand: brandDisplayNames[lowerBrand], count }))
      .sort((a, b) => b.count - a.count);
  }, [categoryProducts, brands, safeConfig.baseToken]);

  const filteredProducts = useMemo(() => {
    let next = [...categoryProducts];

    if (selectedBrands.length > 0) {
      const lowerSelectedBrands = selectedBrands.map(b => b.toLowerCase());
      next = next.filter((product) => product.brand && lowerSelectedBrands.includes(product.brand.toLowerCase()));
    }

    const min = Number(priceMin) || 0;
    const max = Number(priceMax) || Number.POSITIVE_INFINITY;
    next = next.filter((product) => product.price >= min && product.price <= max);

    if (sortValue === "price-asc") {
      next.sort((left, right) => left.price - right.price);
    } else if (sortValue === "price-desc") {
      next.sort((left, right) => right.price - left.price);
    }

    return next;
  }, [categoryProducts, priceMax, priceMin, selectedBrands, sortValue]);

  const pageSize = 18;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);
  const activeFilter = filterMap[activeFilterId];
  const activeHub = safeConfig.hubs?.[activeFilter?.parent || activeFilterId]?.filter((card) => !hiddenSubcategories.includes(card.filterId));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (!config) {
    return (
      <div className="container simple-page">
        <h1 className="section-title">Category not found</h1>
      </div>
    );
  }

  return (
        <>
      <SEO 
        title={`${config.title} | Buy in Qatar | Sports Way`}
        description={config.description}
        image={config.heroImage}
        url={`https://www.sports-way.com${currentPath}`}
      />
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
                        onClick={() => setActiveFilterId(activeFilterId === filter.id ? "all" : filter.id)}
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
                              onClick={() => setActiveFilterId(activeFilterId === child.id ? filter.id : child.id)}
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

            {showBrandsFilter && brandCounts.length > 0 ? (
              <div className="sidebar-card">
                <div className="sidebar-title" style={{ textTransform: "uppercase" }}>Brands</div>
                <div className="filter-list" style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "5px" }}>
                  {brandCounts.map(({ brand, count }) => (
                    <label key={brand} className="filter-item checkbox-label" style={{ display: "flex", justifyContent: "space-between", cursor: "pointer", alignItems: "center", padding: "4px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBrands([...selectedBrands, brand]);
                            } else {
                              setSelectedBrands(selectedBrands.filter((b) => b !== brand));
                            }
                          }}
                        />
                        <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{brand}</span>
                      </div>
                      <span className="filter-count" style={{ fontSize: "14px", color: "#666" }}>{count}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}


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

            <div key={`${activeFilterId}-${page}`} className="page-products-grid admin-page-transition">
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

          </main>
        </div>
      </div>
    </>
  );
}

