import { useEffect, useMemo } from "react";
import { STORAGE_KEYS } from "../lib/storefront";

export function OrderSuccessPage() {
  const order = useMemo(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.latestOrder);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    document.title = "Order Success - Sports Way";
  }, []);

  const fallbackOrder = order || {
    id: "SW-000000",
    created_at: new Date().toISOString(),
    payment_method: "Processed securely",
  };

  return (
    <div className="success-page">
      <div className="container">
        <div className="success-icon">OK</div>
        <h1 className="success-title">Thank you for your order!</h1>
        <p className="success-msg">Your order has been received and is currently being processed. You will receive confirmation shortly.</p>

        <div className="order-details-box">
          <div className="od-row">
            <span className="od-label">Order Number</span>
            <span className="od-value">{fallbackOrder.id}</span>
          </div>
          <div className="od-row">
            <span className="od-label">Date</span>
            <span className="od-value">{new Date(fallbackOrder.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <div className="od-row">
            <span className="od-label">Payment Method</span>
            <span className="od-value">{fallbackOrder.payment_method}</span>
          </div>
        </div>

        <a href="index.html" className="btn btn-primary" style={{ padding: "16px 40px", fontSize: 16 }}>Continue Shopping</a>
      </div>
    </div>
  );
}
