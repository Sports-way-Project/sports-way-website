import { formatPrice } from "../lib/format";

export function CartSidebar({ cart, cartOpen, cartTotal, changeQty, setCartOpen }) {
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
            cart.map((item) => (
              <div key={item.cartId || item.id} className="cart-item">
                <div className="cart-item-icon">
                  <img src={item.image || item.img} alt={item.name} />
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{formatPrice(item.price)}</div>
                  <div className="cart-qty">
                    <button onClick={() => changeQty(item.cartId || item.id, -1)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => changeQty(item.cartId || item.id, 1)}>+</button>
                  </div>
                </div>
                <button className="cart-item-remove" onClick={() => changeQty(item.cartId || item.id, -item.qty)}>
                  x
                </button>
              </div>
            ))
          )}
        </div>
        {cart.length ? (
          <div className="cart-footer">
            <div className="cart-total">
              Total: <strong>{formatPrice(cartTotal)}</strong>
            </div>
            <a className="btn btn-primary checkout-btn" href="checkout.html">Checkout</a>
          </div>
        ) : null}
      </aside>
    </>
  );
}
