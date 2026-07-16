// Reads a duration CSS custom property (e.g. "1s", "250ms") from :root and
// returns it in milliseconds. Shared by AdminShell.jsx (sidebar nav) and
// AdminPage.jsx (dashboard quick actions / sync-then-redirect flows) so
// both drive the exact same page-transition timing defined once in
// admin.css, instead of duplicating the parsing logic.
export function readCssMs(varName, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName);
  const value = parseFloat(raw) * 1000;
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
