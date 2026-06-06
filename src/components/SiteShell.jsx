import { BackToTopButton } from "./BackToTopButton";
import { CartSidebar } from "./CartSidebar";
import { Footer } from "./Footer";
import { NavBar } from "./NavBar";

export function SiteShell({
  cart,
  cartCount,
  cartOpen,
  cartTotal,
  changeQty,
  children,
  currentPath,
  footerSocials,
  hiddenCategories,
  hiddenSubcategories,
  mobileMenuOpen,
  navItems,
  openMobileDropdown,
  scrolled,
  searchOpen,
  searchQuery,
  searchSuggestions,
  setCartOpen,
  setMobileMenuOpen,
  setOpenMobileDropdown,
  setSearchOpen,
  setSearchQuery,
  showBackToTop,
}) {
  return (
    <div className="app-shell">
      <NavBar
        cartCount={cartCount}
        currentPath={currentPath}
        hiddenSubcategories={hiddenSubcategories}
        mobileMenuOpen={mobileMenuOpen}
        navItems={navItems}
        openMobileDropdown={openMobileDropdown}
        scrolled={scrolled}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        searchSuggestions={searchSuggestions}
        setCartOpen={setCartOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setOpenMobileDropdown={setOpenMobileDropdown}
        setSearchOpen={setSearchOpen}
        setSearchQuery={setSearchQuery}
      />

      <a href="https://wa.me/97439963997" className="whatsapp-float" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
        <span className="whatsapp-icon">WA</span>
        <span>Chat with Us</span>
      </a>

      {children}

      <Footer footerSocials={footerSocials} hiddenCategories={hiddenCategories} />

      <CartSidebar
        cart={cart}
        cartOpen={cartOpen}
        cartTotal={cartTotal}
        changeQty={changeQty}
        setCartOpen={setCartOpen}
      />

      <BackToTopButton show={showBackToTop} />
    </div>
  );
}
