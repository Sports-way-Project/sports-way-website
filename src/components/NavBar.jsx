import { CartIcon, SearchIcon, UserIcon } from "./Icons";

export function NavBar({
  cartCount,
  currentPath,
  hiddenSubcategories = [],
  mobileMenuOpen,
  navItems,
  openMobileDropdown,
  scrolled,
  searchOpen,
  searchQuery,
  searchSuggestions,
  setMobileMenuOpen,
  setOpenMobileDropdown,
  setSearchOpen,
  setSearchQuery,
  setCartOpen,
}) {
  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`} id="home">
      <div className="nav-container">
        <a href="index.html" className="logo">
          <img src="/logo.png" alt="Sports Way Trading" className="nav-logo-img" />
        </a>

        <ul className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
          {navItems.map((item) => (
            <li
              key={item.label}
              className={`${item.items ? `has-dropdown ${openMobileDropdown === item.label ? "open" : ""}` : ""} ${currentPath === item.href ? "active" : ""}`.trim()}
            >
              <a
                href={item.href}
                onClick={(event) => {
                  if (!item.items || window.innerWidth > 768) {
                    return;
                  }

                  event.preventDefault();
                  setOpenMobileDropdown((current) => (current === item.label ? "" : item.label));
                }}
              >
                {item.label}
              </a>
              {item.items ? (
                <div className="dropdown mega-menu">
                  {item.items
                    .filter((subItem) => {
                      const hash = (subItem.href || "").split("#")[1];
                      return !hash || !hiddenSubcategories.includes(decodeURIComponent(hash).toLowerCase());
                    })
                    .map((subItem) => (
                    <a key={subItem.title} href={subItem.href || item.href} className="mega-item">
                      <div className="mega-img-wrap">
                        <img src={subItem.image} alt={subItem.title} loading="lazy" />
                      </div>
                      <span className="mega-title">{subItem.title}</span>
                      <span className="mega-subtitle">{subItem.subtitle}</span>
                    </a>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
          <li>
            <a href="wholesale.html" className="nav-wholesale-btn">
              Wholesale
            </a>
          </li>
        </ul>

        <div className="nav-actions">
          <button className="nav-search-btn" aria-label="Search" onClick={() => setSearchOpen((value) => !value)}>
            <SearchIcon />
          </button>
          <a className="nav-search-btn" aria-label="My account" title="My account" href="my-account.html">
            <UserIcon />
          </a>
          <button className="cart-btn" aria-label="Cart" onClick={() => setCartOpen(true)}>
            <CartIcon />
            <span className="cart-count">{cartCount}</span>
          </button>
          <button
            className={`hamburger ${mobileMenuOpen ? "active" : ""}`}
            aria-label="Menu"
            onClick={() => setMobileMenuOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`search-bar ${searchOpen ? "open" : ""}`}>
        <div className="search-inner">
          <SearchIcon />
          <input
            type="text"
            value={searchQuery}
            placeholder="Search products, categories..."
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <button id="search-close" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
            x
          </button>
        </div>
        <div className={`search-suggestions ${searchSuggestions.length ? "open" : ""}`}>
          {searchSuggestions.map((item) => (
            <a key={`${item.type}-${item.label}`} href={item.href} className="search-suggestion-item">
              {item.image ? (
                <div className="search-suggestion-img">
                  <img src={item.image} alt={item.label} loading="lazy" />
                </div>
              ) : (
                <div className="search-suggestion-page-icon">
                  <SearchIcon />
                </div>
              )}
              <div className="search-suggestion-info">
                <div className="search-suggestion-name">{item.label}</div>
                <div className="search-suggestion-meta">
                  <span className="search-suggestion-cat">{item.sublabel}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
