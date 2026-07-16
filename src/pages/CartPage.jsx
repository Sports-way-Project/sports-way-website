import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SEO } from "../components/SEO";
import { formatPrice } from "../lib/format";

export function CartPage({ cart, changeQty }) {
  const [pendingIds, setPendingIds] = useState(() => new Set());

  useEffect(() => {
    document.title = "Shopping Cart - Sports Way";
  }, []);

  async function handleChangeQty(cartId, delta) {
    setPendingIds((prev) => new Set(prev).add(cartId));
    try {
      await changeQty(cartId, delta);
    } finally {
      setPendingIds((prev) => { const next = new Set(prev); next.delete(cartId); return next; });
    }
  }

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.qty, 0),
    [cart],
  );
  const shipping = subtotal >= 300 || subtotal === 0 ? 0 : 30;
  const total = subtotal + shipping;

  return (
    <div className="cart-page">
      <SEO title="Shopping Cart | Sports Way" description="Review your cart and proceed to checkout. Sports Way Qatar sports equipment." url="https://www.sports-way.com/cart" />
      <div className="container">
        <h1 className="section-title" style={{ marginBottom: 40, textAlign: "center" }}>Shopping Cart</h1>
        {cart.length === 0 ? (
          <div className="empty-cart-msg">
            <p>Your shopping cart is currently empty.</p>
            <Link to="/" className="btn btn-primary">Continue Shopping</Link>
          </div>
        ) : (
          <div className="cart-grid">
            <div className="cart-items-list">
              {cart.map((item) => {
                const isPending = pendingIds.has(item.cartId);
                return (
                <div key={item.cartId} className="cart-item-row" style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.15s" }}>
                  <div className="cart-item-img">
                    <img src={item.image || item.img} alt={item.name} />
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-title">{item.name}</div>
                    <div className="cart-item-price">{formatPrice(item.price)}</div>
                    <div className="cart-item-qty">
                      <button disabled={isPending} onClick={() => handleChangeQty(item.cartId, -1)}>-</button>
                      <span>{item.qty}</span>
                      <button disabled={isPending} onClick={() => handleChangeQty(item.cartId, 1)}>+</button>
                    </div>
                  </div>
                  <button className="cart-item-remove" title="Remove item" disabled={isPending} onClick={() => handleChangeQty(item.cartId, -item.qty)}>
                    x
                  </button>
                </div>
                );
              })}
            </div>
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              {subtotal < 300 ? (
                <div className="free-shipping-notice-small">Add {formatPrice(300 - subtotal)} more for free shipping.</div>
              ) : null}
              <div className="summary-total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Link to="/checkout" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 16, padding: 16 }}>
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
