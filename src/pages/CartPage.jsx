import { useEffect, useMemo } from "react";
import { formatPrice } from "../lib/format";

export function CartPage({ cart, changeQty }) {
  useEffect(() => {
    document.title = "Shopping Cart - Sports Way";
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.qty, 0),
    [cart],
  );
  const shipping = subtotal >= 300 || subtotal === 0 ? 0 : 30;
  const total = subtotal + shipping;

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="section-title" style={{ marginBottom: 40, textAlign: "center" }}>Shopping Cart</h1>
        {cart.length === 0 ? (
          <div className="empty-cart-msg">
            <p>Your shopping cart is currently empty.</p>
            <a href="index.html" className="btn btn-primary">Continue Shopping</a>
          </div>
        ) : (
          <div className="cart-grid">
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.cartId} className="cart-item-row">
                  <div className="cart-item-img">
                    <img src={item.image || item.img} alt={item.name} />
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-title">{item.name}</div>
                    <div className="cart-item-price">{formatPrice(item.price)}</div>
                    <div className="cart-item-qty">
                      <button onClick={() => changeQty(item.cartId, -1)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => changeQty(item.cartId, 1)}>+</button>
                    </div>
                  </div>
                  <button className="cart-item-remove" title="Remove item" onClick={() => changeQty(item.cartId, -item.qty)}>
                    x
                  </button>
                </div>
              ))}
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
              <a className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 16, padding: 16 }} href="checkout.html">
                Proceed to Checkout
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
