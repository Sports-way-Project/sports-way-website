import { useEffect, useRef, useState } from "react";
import { readCssMs } from "../lib/adminMotion";

// Drives the admin panel's page-transition overlay. Used from exactly one
// place (AdminPage.jsx) so the sidebar (AdminShell) and any other trigger
// (dashboard stat cards, the "Synchronize Stocks" quick action) share the
// exact same overlay state instead of each managing their own timers.
//
// - navigate(id): click-driven nav. Overlay fades in fast, the actual
//   section swap happens ~--admin-nav-cover-delay later (hidden behind the
//   now-opaque overlay, so the new page never flashes into view first),
//   and the overlay holds for at least --admin-page-transition-min from
//   the click before revealing the destination page.
// - runWithTransition(task, targetId): for actions that do real work before
//   navigating (e.g. syncing stock from Dolibarr) — shows the overlay
//   immediately, awaits `task()`, then waits out whatever's left of
//   --admin-page-transition-min (so a fast sync doesn't just flash), then
//   swaps to `targetId` and hides the overlay.
export function useAdminPageTransition(setSection, { onBadgeClear } = {}) {
  const [pageTransitioning, setPageTransitioning] = useState(false);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  function navigate(id, currentSection) {
    if (id === currentSection || pageTransitioning) return;

    const coverDelay = readCssMs("--admin-nav-cover-delay", 250);
    const minTotal = readCssMs("--admin-page-transition-min", 1000);

    setPageTransitioning(true);
    timers.current.forEach(window.clearTimeout);
    timers.current = [
      window.setTimeout(() => {
        setSection(id);
        onBadgeClear?.(id);
      }, coverDelay),
      window.setTimeout(() => setPageTransitioning(false), Math.max(minTotal, coverDelay)),
    ];
  }

  async function runWithTransition(task, targetId) {
    if (pageTransitioning) return;
    const minTotal = readCssMs("--admin-page-transition-min", 1000);
    const start = Date.now();
    setPageTransitioning(true);
    try {
      await task();
    } finally {
      const remaining = Math.max(0, minTotal - (Date.now() - start));
      await new Promise((resolve) => window.setTimeout(resolve, remaining));
      if (targetId) setSection(targetId);
      setPageTransitioning(false);
    }
  }

  return { pageTransitioning, navigate, runWithTransition };
}
