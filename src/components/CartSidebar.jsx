import { useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../lib/format";

export function CartSidebar({ cart, cartOpen, cartTotal, changeQty, setCartOpen }) {
  const [pendingIds, setPendingIds] = useState(() => new Set());

  async function handleChangeQty(cartId, delta) {
    setPendingIds((prev) => new Set(prev).add(cartId));
    try {
      await changeQty(cartId, delta);
    } finally {
      setPendingIds((prev) => { const next = new Set(prev); next.delete(cartId); return next; });
    }
  }

  return (
    <>
      <div className={`cart-overlay ${cartOpen ? "open" : ""}`} onClick={() => setCartOpen(false)} />
      <aside className={`cart-sidebar ${cartOpen ? "open" : ""}`}>
        <div className="cart-header">
          <h3>Your Cart</h3>
          <button id="cart-close" aria-label="Close cart" onClick={() => setCartOpen(false)}>
            x
          </button>
        </div>
        <div className="cart-items">
          {cart.length === 0 ? (
            <p className="cart-empty">Your cart is empty.</p>
          ) : (
            cart.map((item) => {
              const cartId = item.cartId || item.id;
              const isPending = pendingIds.has(cartId);
              return (
              <div key={cartId} className="cart-item" style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.15s" }}>
                <div className="cart-item-icon">
                  <img src={item.image || item.img} alt={item.name} />
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{formatPrice(item.price)}</div>
                  <div className="cart-qty">
                    <button disabled={isPending} onClick={() => handleChangeQty(cartId, -1)}>-</button>
                    <span>{item.qty}</span>
                    <button disabled={isPending} onClick={() => handleChangeQty(cartId, 1)}>+</button>
                  </div>
                </div>
                <button className="cart-item-remove" disabled={isPending} onClick={() => handleChangeQty(cartId, -item.qty)}>
                  x
                </button>
              </div>
              );
            })
          )}
        </div>
        {cart.length ? (
          <div className="cart-footer">
            <div className="cart-total">
              Total: <strong>{formatPrice(cartTotal)}</strong>
            </div>
            <Link className="btn btn-primary checkout-btn" to="/checkout" onClick={() => setCartOpen(false)}>Checkout</Link>
          </div>
        ) : null}
      </aside>
    </>
  );
}
