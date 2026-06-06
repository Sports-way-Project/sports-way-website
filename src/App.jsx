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
import { HomePage } from "./pages/HomePage";
import { AboutPage, BlogPage, ContactPage, WholesalePage } from "./pages/InfoPages";
import { CatalogPage } from "./pages/CatalogPage";
import { ProductPage } from "./pages/ProductPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AccountPage } from "./pages/AccountPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { AdminPage } from "./pages/AdminPage";

function getCurrentPath() {
  const path = window.location.pathname.split("/").pop();
  return path || "index.html";
}

function pageToCategoryKey(path) {
  const map = {
    "gym-equipment.html": "gym-equipment",
    "sports-tools.html": "sports-tools",
    "sportswear.html": "sportswear",
    "footwear.html": "footwear",
    "supplements.html": "supplements",
    "flooring.html": "flooring",
  };
  return map[path] || "";
}

function renderRoute(path, props) {
  switch (path) {
    case "index.html":
      return <HomePage addToCart={props.addToCart} toggleWishlist={props.toggleWishlist} wishlist={props.wishlist} />;
    case "about.html":
      return <AboutPage />;
    case "blog.html":
      return <BlogPage />;
    case "contact.html":
      return <ContactPage />;
    case "wholesale.html":
      return <WholesalePage />;
    case "gym-equipment.html":
    case "sports-tools.html":
    case "sportswear.html":
    case "footwear.html":
    case "supplements.html":
    case "flooring.html":
      return (
        <CatalogPage
          addToCart={props.addToCart}
          currentPath={path}
          hiddenSubcategories={props.hiddenSubcategories}
          products={props.products}
          toggleWishlist={props.toggleWishlist}
          wishlist={props.wishlist}
        />
      );
    case "product.html":
      return (
        <ProductPage
          addToCart={props.addToCart}
          products={props.products}
          toggleWishlist={props.toggleWishlist}
          wishlist={props.wishlist}
        />
      );
    case "cart.html":
      return <CartPage cart={props.cart} changeQty={props.changeQty} />;
    case "checkout.html":
      return (
        <CheckoutPage
          cart={props.cart}
          changeQty={props.changeQty}
          currentUser={props.currentUser}
          setCart={props.setCart}
          setCurrentUser={props.setCurrentUser}
        />
      );
    case "my-account.html":
      return (
        <AccountPage
          currentUser={props.currentUser}
          products={props.products}
          removeWishlistItem={props.removeWishlistItem}
          setCurrentUser={props.setCurrentUser}
        />
      );
    case "order-success.html":
      return <OrderSuccessPage />;
    case "admin.html":
      return (
        <AdminPage
          products={props.products}
          setProducts={props.setProducts}
        />
      );
    default:
      return <HomePage addToCart={props.addToCart} toggleWishlist={props.toggleWishlist} wishlist={props.wishlist} />;
  }
}

function App() {
  const currentPath = getCurrentPath();
  const isAdminRoute = currentPath === "admin.html";
  const { scrolled, showBackToTop } = useScrollFlags();
  const {
    mobileMenuOpen,
    openMobileDropdown,
    setMobileMenuOpen,
    setOpenMobileDropdown,
  } = useMobileNav();
  const { currentUser, setCurrentUser } = useAccount();
  const { products, setProducts } = useMasterProducts();
  const { wishlist, toggleWishlist, removeWishlistItem } = useWishlist(currentUser);
  const { hiddenCategories, hiddenSubcategories } = useVisibilitySettings();
  const {
    addToCart,
    cart,
    cartCount,
    cartOpen,
    cartTotal,
    changeQty,
    setCart,
    setCartOpen,
  } = useCart();
  const {
    searchOpen,
    searchQuery,
    searchSuggestions,
    setSearchOpen,
    setSearchQuery,
  } = useSearch(
    products,
    pageLinks.filter((page) => !hiddenCategories.includes(pageToCategoryKey(page.href))),
  );

  const visibleNavItems = navItems.filter((item) => !hiddenCategories.includes(pageToCategoryKey(item.href || "")));
  const visibleFooterSocials = footerSocials;
  const hiddenCategoryForRoute = hiddenCategories.includes(pageToCategoryKey(currentPath));

  if (isAdminRoute) {
    return renderRoute(currentPath, {
      products,
      setProducts,
    });
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
      {hiddenCategoryForRoute ? renderRoute("index.html", {
        addToCart,
        cart,
        changeQty,
        currentUser,
        hiddenSubcategories,
        products,
        removeWishlistItem,
        setCart,
        setProducts,
        setCurrentUser,
        toggleWishlist,
        wishlist,
      }) : renderRoute(currentPath, {
        addToCart,
        cart,
        changeQty,
        currentUser,
        hiddenSubcategories,
        products,
        removeWishlistItem,
        setCart,
        setProducts,
        setCurrentUser,
        toggleWishlist,
        wishlist,
      })}
    </SiteShell>
  );
}

export default App;
