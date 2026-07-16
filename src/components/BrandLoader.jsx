import { createPortal } from "react-dom";

// The branded loader, shared across: AdminShell's page-transition overlay,
// the admin login submit state, App.jsx's initial-auth-check screen, and
// every storefront action (login/register/checkout/coupon/etc). Styles/
// keyframes live in admin.css (imported globally in main.jsx) under the
// --admin-loader-*/--admin-motion-* variables — edit those to change every
// usage at once instead of duplicating markup per screen.
//
// A thin brand-color bar sweeps across the very top of the screen
// (GitHub/YouTube/Notion-style), with a big logo and five bouncing
// gradient dots centered below it.
//
// Rendered via a portal straight into document.body: any ancestor with an
// active CSS `transform` (e.g. the page-transition fade in SiteShell.jsx)
// creates a new containing block, which breaks `position: fixed` on
// anything nested inside it — the loader would then scroll with the page
// instead of staying pinned to the viewport. Portaling out to <body>
// sidesteps that regardless of where <BrandLoader /> is written in the tree.
export function BrandLoader({ fullScreen = true, visible = true, zIndex = 500 }) {
  const loader = (
    <div className="admin-loader">
      <div className="admin-topbar">
        <div className="admin-topbar-fill" />
      </div>
      <img src="/logo.png" alt="" className="admin-loader-logo-static" />
      <div className="admin-loader-dots-wave">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="admin-loader-wave-dot" />
        ))}
      </div>
    </div>
  );

  if (!fullScreen) {
    return loader;
  }

  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, zIndex,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(1px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity var(--admin-overlay-fade-duration) ease",
      }}
    >
      {loader}
    </div>,
    document.body,
  );
}
