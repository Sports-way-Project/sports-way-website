import { useEffect, useRef } from "react";

/**
 * useAdminModal — returns { modal, showAlert, showConfirm }
 *
 * showAlert(message)              → resolves when user clicks OK
 * showConfirm(message, opts?)     → resolves true/false
 *
 * Usage:
 *   const { modal, showAlert, showConfirm } = useAdminModal();
 *   // JSX: <>{modal}</>
 *   // handler: const ok = await showConfirm("Delete this item?");
 */
export function useAdminModal() {
  const resolveRef = useRef(null);
  const containerRef = useRef(null);

  // Lazy-create a portal div once
  if (!containerRef.current && typeof document !== "undefined") {
    containerRef.current = document.createElement("div");
    containerRef.current.id = "admin-modal-portal";
    document.body.appendChild(containerRef.current);
  }

  function show(config) {
    return new Promise(resolve => {
      resolveRef.current = resolve;
      const el = containerRef.current;
      if (!el) return;

      // Render via direct DOM — avoids React portal complexity
      el.innerHTML = "";
      const root = document.createElement("div");
      root.style.cssText = "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,0.45);backdrop-filter:blur(3px);animation:amFadeIn 0.15s ease";
      root.innerHTML = `
        <div style="background:#fff;border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,0.2);width:100%;max-width:420px;overflow:hidden;animation:amSlideUp 0.18s cubic-bezier(0.32,0.72,0,1)">
          <div style="padding:24px 24px 0">
            <div style="display:flex;align-items:flex-start;gap:14px">
              <div style="width:40px;height:40px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;${config.type === "error" ? "background:#fef2f2" : config.type === "warning" ? "background:#fffbeb" : "background:#eff6ff"}">
                ${config.type === "error" ? '<svg width="20" height="20" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
                  : config.type === "warning" ? '<svg width="20" height="20" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
                  : '<svg width="20" height="20" fill="none" stroke="#3b82f6" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'}
              </div>
              <div style="flex:1;min-width:0">
                ${config.title ? `<p style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 6px">${config.title}</p>` : ""}
                <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0">${config.message}</p>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:10px;padding:20px 24px;justify-content:flex-end">
            ${config.showCancel ? `<button id="am-cancel" style="height:38px;padding:0 18px;background:#fff;color:#64748b;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">${config.cancelLabel || "Cancel"}</button>` : ""}
            <button id="am-ok" style="height:38px;padding:0 20px;background:${config.type === "error" || config.type === "warning" ? "#e63946" : "#0f172a"};color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">${config.okLabel || "OK"}</button>
          </div>
        </div>
        <style>@keyframes amFadeIn{from{opacity:0}to{opacity:1}}@keyframes amSlideUp{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}</style>
      `;

      function cleanup(result) {
        root.style.opacity = "0";
        root.style.transition = "opacity 0.15s";
        setTimeout(() => { if (el.contains(root)) el.removeChild(root); }, 150);
        if (resolveRef.current) { resolveRef.current(result); resolveRef.current = null; }
      }

      root.querySelector("#am-ok").addEventListener("click", () => cleanup(true));
      const cancelBtn = root.querySelector("#am-cancel");
      if (cancelBtn) cancelBtn.addEventListener("click", () => cleanup(false));
      root.addEventListener("click", e => { if (e.target === root) cleanup(false); });
      document.addEventListener("keydown", function handler(e) {
        if (e.key === "Escape") { cleanup(false); document.removeEventListener("keydown", handler); }
        if (e.key === "Enter")  { cleanup(true);  document.removeEventListener("keydown", handler); }
      });

      el.appendChild(root);
      root.querySelector("#am-ok").focus();
    });
  }

  function showAlert(message, opts = {}) {
    return show({ type: opts.type || "info", title: opts.title, message, okLabel: opts.okLabel || "OK", showCancel: false });
  }

  function showConfirm(message, opts = {}) {
    return show({ type: opts.type || "warning", title: opts.title, message, okLabel: opts.okLabel || "Confirm", cancelLabel: opts.cancelLabel || "Cancel", showCancel: true });
  }

  // No JSX needed — modal lives in the portal div
  return { showAlert, showConfirm, modal: null };
}
