import { useEffect, useState } from "react";

let listeners = [];
let current = null;

function notify() {
  listeners.forEach((l) => l(current));
}

export function showAlert(message, options = {}) {
  return new Promise((resolve) => {
    current = { type: "alert", message, title: options.title || "Notice", resolve };
    notify();
  });
}

export function showConfirm(message, options = {}) {
  return new Promise((resolve) => {
    current = {
      type: "confirm",
      message,
      title: options.title || "Please confirm",
      confirmText: options.confirmText || "Confirm",
      cancelText: options.cancelText || "Cancel",
      danger: options.danger || false,
      resolve,
    };
    notify();
  });
}

export function DialogHost() {
  const [dialog, setDialog] = useState(current);

  useEffect(() => {
    listeners.push(setDialog);
    return () => {
      listeners = listeners.filter((l) => l !== setDialog);
    };
  }, []);

  if (!dialog) return null;

  function close(result) {
    dialog.resolve(result);
    current = null;
    setDialog(null);
  }

  return (
    <div className="dialog-overlay" onClick={() => dialog.type === "alert" && close()}>
      <div className="dialog-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="dialog-title">{dialog.title}</div>
        <div className="dialog-message">{dialog.message}</div>
        <div className="dialog-actions">
          {dialog.type === "confirm" && (
            <button type="button" className="dialog-btn dialog-btn-cancel" onClick={() => close(false)}>
              {dialog.cancelText}
            </button>
          )}
          <button
            type="button"
            className={`dialog-btn dialog-btn-primary${dialog.type === "confirm" && dialog.danger ? " dialog-btn-danger" : ""}`}
            onClick={() => close(dialog.type === "confirm" ? true : undefined)}
          >
            {dialog.type === "confirm" ? dialog.confirmText : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
