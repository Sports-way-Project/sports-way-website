import { useMemo } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import {
  footerSocials,
  navItems,
  pageLinks,
} from "./data/siteData";
import { useAccount } from "./hooks/useAccount";
import { useCart } from "./hooks/useCart";
import { useMasterProducts } from "./hooks/useMasterProducts";
import { useMobileNav } from "./hooks/useMobileNav";
import { useScrollFlags } from "./hooks/useScrollFlags";
import { useSearch } from "./hooks/useSearch";
import { useVisibilitySettings } from "./hooks/useVisibilitySettings";
import { useWishlist } from "./hooks/useWishlist";
import { SiteShell } from "./components/SiteShell";
import { BrandLoader } from "./components/BrandLoader";
import { HomePage } from "./pages/HomePage";
import { AboutPage, BlogPage, ContactPage, WholesalePage } from "./pages/InfoPages";
import { CatalogPage } from "./pages/CatalogPage";
import { ProductPage } from "./pages/ProductPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AccountPage } from "./pages/AccountPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { AdminPage } from "./pages/AdminPage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsOfServicePage } from "./pages/TermsOfServicePage";
import ClientsPage from "./pages/ClientsPage";
import PartnersPage from "./pages/PartnersPage";
import BlogPostPage from "./pages/BlogPostPage";

function pageToCategoryKey(path) {
  const map = {
    "/categories/gym-equipment": "gym-equipment",
    "/categories/sports-tools": "sports-tools",
    "/categories/sportswear": "sportswear",
    "/categories/footwear": "footwear",
    "/categories/supplements": "supplements",
    "/categories/flooring": "flooring",
    "/gym-equipment": "gym-equipment",
    "/sports-tools": "sports-tools",
    "/sportswear": "sportswear",
    "/footwear": "footwear",
    "/supplements": "supplements",
    "/flooring": "flooring",
  };
  return map[path] || "";
}

function App() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isAdminRoute = currentPath === "/admin";
  const { scrolled, showBackToTop } = useScrollFlags();
  const {
    mobileMenuOpen,
    openMobileDropdown,
    setMobileMenuOpen,
    setOpenMobileDropdown,
  } = useMobileNav();
  const {
    authReady,
    currentUser,
    requestPasswordReset,
    saveProfile,
    sessionUser,
    signIn,
    signOut,
    signUp,
    isRecovery,
    clearRecovery,
  } = useAccount();
  const { products, setProducts, deleteProduct } = useMasterProducts();
  // Products never linked to a Dolibarr product can't be fulfilled, so the
  // public site shouldn't sell them — the admin still sees the full list
  // (that's the whole point of the Product Mapping page). This is a
  // render-layer filter only; it never touches fetchProducts/useMasterProducts.
  const publicProducts = useMemo(() => products.filter((p) => p.dolibarr_id != null), [products]);
  const { wishlist, toggleWishlist, removeWishlistItem } = useWishlist(sessionUser);
  const { hiddenCategories, hiddenSubcategories, showBrandsFilter, brands } = useVisibilitySettings();
  const {
    addToCart,
    cart,
    cartCount,
    cartOpen,
    cartTotal,
    changeQty,
    setCart,
    setCartOpen,
  } = useCart(sessionUser);
  const {
    searchOpen,
    searchQuery,
    searchSuggestions,
    setSearchOpen,
    setSearchQuery,
  } = useSearch(
    publicProducts,
    pageLinks.filter((page) => !hiddenCategories.includes(pageToCategoryKey(page.href))),
  );

  const visibleNavItems = navItems.filter((item) => !hiddenCategories.includes(pageToCategoryKey(item.href || "")));
  const visibleFooterSocials = footerSocials;
  const hiddenCategoryForRoute = hiddenCategories.includes(pageToCategoryKey(currentPath));

  if (!authReady) {
    // Shown on every hard reload/refresh while Supabase resolves the
    // session — used to be a blank white flash (`return null`).
    return (
      <div style={{ position: "fixed", inset: 0, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BrandLoader fullScreen={false} />
      </div>
    );
  }

  if (isAdminRoute) {
    return (
      <AdminPage
        currentUser={currentUser}
        products={products}
        requestPasswordReset={requestPasswordReset}
        saveProfile={saveProfile}
        sessionUser={sessionUser}
        signIn={signIn}
        signOut={signOut}
        signUp={signUp}
        setProducts={setProducts}
        deleteProduct={deleteProduct}
      />
    );
  }

  return (
    <SiteShell
      cart={cart}
      cartCount={cartCount}
      cartOpen={cartOpen}
      cartTotal={cartTotal}
      changeQty={changeQty}
      currentPath={currentPath}
      footerSocials={visibleFooterSocials}
      hiddenCategories={hiddenCategories}
      hiddenSubcategories={hiddenSubcategories}
      mobileMenuOpen={mobileMenuOpen}
      navItems={visibleNavItems}
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
      showBackToTop={showBackToTop}
    >
      {hiddenCategoryForRoute ? (
        <Navigate to="/" replace />
      ) : (
        <Routes>
          <Route path="/" element={<HomePage addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPostPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/wholesale" element={<WholesalePage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/categories/:slug" element={
            <CatalogPage
              addToCart={addToCart}
              currentPath={currentPath}
              hiddenSubcategories={hiddenSubcategories}
              showBrandsFilter={showBrandsFilter}
              brands={brands}
              products={publicProducts}
              toggleWishlist={toggleWishlist}
              wishlist={wishlist}
            />
          } />
          {/* Legacy routes for backwards compatibility and mapping mapping */}
          <Route path="/gym-equipment" element={<Navigate to="/categories/gym-equipment" replace />} />
          <Route path="/sports-tools" element={<Navigate to="/categories/sports-tools" replace />} />
          <Route path="/sportswear" element={<Navigate to="/categories/sportswear" replace />} />
          <Route path="/footwear" element={<Navigate to="/categories/footwear" replace />} />
          <Route path="/supplements" element={<Navigate to="/categories/supplements" replace />} />
          <Route path="/flooring" element={<Navigate to="/categories/flooring" replace />} />
          
          <Route path="/products/:slug" element={
            <ProductPage
              addToCart={addToCart}
              products={publicProducts}
              toggleWishlist={toggleWishlist}
              wishlist={wishlist}
            />
          } />
          <Route path="/cart" element={<CartPage cart={cart} changeQty={changeQty} />} />
          <Route path="/checkout" element={
            <CheckoutPage
              cart={cart}
              changeQty={changeQty}
              currentUser={currentUser}
              saveProfile={saveProfile}
              sessionUser={sessionUser}
              setCart={setCart}
              signIn={signIn}
            />
          } />
          <Route path="/my-account" element={
            <AccountPage
              cart={cart}
              clearRecovery={clearRecovery}
              currentUser={currentUser}
              isRecovery={isRecovery}
              products={publicProducts}
              requestPasswordReset={requestPasswordReset}
              removeWishlistItem={removeWishlistItem}
              saveProfile={saveProfile}
              sessionUser={sessionUser}
              signIn={signIn}
              signOut={signOut}
              signUp={signUp}
              wishlist={wishlist}
            />
          } />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/account" element={<Navigate to="/my-account" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </SiteShell>
  );
}

export default App;
