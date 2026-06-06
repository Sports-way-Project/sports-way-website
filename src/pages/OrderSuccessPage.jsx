import { useEffect, useMemo, useState } from "react";
import { fetchOrderByOrderId } from "../lib/storefrontApi";

function getOrderIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("order");
}

export function OrderSuccessPage() {
  const [order, setOrder] = useState(null);
  const orderId = useMemo(() => getOrderIdFromUrl(), []);

  useEffect(() => {
    document.title = "Order Success - Sports Way";
  }, []);

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      if (!orderId) {
        return;
      }

      const nextOrder = await fetchOrderByOrderId(orderId);
      if (active) {
        setOrder(nextOrder);
      }
    };

    loadOrder();
    return () => {
      active = false;
    };
  }, [orderId]);

  const fallbackOrder = order || {
    id: orderId || "SW-000000",
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
