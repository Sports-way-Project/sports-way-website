import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "../lib/format";
import { createOrder, fetchCouponByCode, recordCouponUsage } from "../lib/storefrontApi";

export function CheckoutPage({ cart, changeQty, currentUser, requestPasswordReset, sessionUser, setCart, signIn, signUp }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [billing, setBilling] = useState({
    firstName: "",
    lastName: "",
    company: "",
    country: "Qatar",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    notes: "",
  });
  const [loginState, setLoginState] = useState({ identity: "", password: "" });

  useEffect(() => {
    document.title = "Checkout - Sports Way";
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const nameParts = String(currentUser.name || "").split(" ");
    setBilling((current) => ({
      ...current,
      firstName: current.firstName || nameParts[0] || "",
      lastName: current.lastName || nameParts.slice(1).join(" ") || "",
      address1: current.address1 || currentUser.billing_address || "",
      phone: current.phone || currentUser.phone || "",
      email: current.email || currentUser.email || "",
    }));
  }, [currentUser]);

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.qty, 0),
    [cart],
  );
  const shipping = subtotal >= 300 || subtotal === 0 ? 0 : 30;
  const discount = useMemo(() => {
    if (!appliedCoupon) {
      return 0;
    }

    if (appliedCoupon.discountType === "fixed_cart") {
      return Math.min(appliedCoupon.discount, subtotal);
    }

    return Math.round(subtotal * ((appliedCoupon.discount || 0) / 100));
  }, [appliedCoupon, subtotal]);
  const total = Math.max(0, subtotal - discount) + shipping;

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      return;
    }

    const coupon = await fetchCouponByCode(code);
    if (!coupon) {
      window.alert("Invalid coupon code.");
      return;
    }

    if (coupon.limitPerCoupon !== null && Number(coupon.usedCount || 0) >= coupon.limitPerCoupon) {
      window.alert("This coupon code has reached its usage limit.");
      return;
    }

    const userIdentifier = (currentUser?.email || billing.email || "").trim().toLowerCase();
    if (coupon.limitPerUser !== null && userIdentifier) {
      const userUseCount = Number(coupon.userUses?.[userIdentifier] || 0);
      if (userUseCount >= coupon.limitPerUser) {
        window.alert("You have already reached the usage limit for this coupon.");
        return;
      }
    }

    if (coupon.specificProducts?.length) {
      const hasEligible = cart.some((item) => {
        const itemName = String(item.name || "").toLowerCase();
        return coupon.specificProducts.some((specific) => itemName.includes(String(specific).toLowerCase()));
      });

      if (!hasEligible) {
        window.alert("This coupon is not valid for any items in your cart.");
        return;
      }
    }

    setAppliedCoupon(coupon);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      await signIn({
        email: loginState.identity.trim(),
        password: loginState.password,
        guestCart: cart,
      });
      setShowLogin(false);
    } catch (error) {
      window.alert(error.message || "Incorrect login details.");
    }
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (!cart.length) {
      window.alert("Your cart is empty.");
      return;
    }

    if (!billing.firstName || !billing.lastName || !billing.address1 || !billing.city || !billing.state || !billing.zip || !billing.phone || !billing.email) {
      window.alert("Please complete all required billing fields.");
      return;
    }

    let nextUser = currentUser;
    if (createAccount && !currentUser) {
      try {
        nextUser = await signUp({
          email: billing.email.trim(),
          password: billing.password,
          name: `${billing.firstName} ${billing.lastName}`.trim(),
          phone: billing.phone.trim(),
          billing_address: billing.address1,
          shipping_address: billing.address1,
          guestCart: cart,
        });
      } catch (error) {
        window.alert(error.message || "Unable to create the account.");
        return;
      }
    }

    const order = {
      id: `SW-${Math.floor(100000 + Math.random() * 900000)}`,
      created_at: new Date().toISOString(),
      customer_name: `${billing.firstName} ${billing.lastName}`.trim(),
      email: billing.email,
      phone: billing.phone,
      total,
      subtotal,
      shipping,
      discount,
      coupon_code: appliedCoupon?.code || null,
      payment_method: paymentMethod === "cod" ? "Cash on delivery" : paymentMethod === "bank" ? "Direct Bank Transfer" : "Credit / Debit Card",
      status: paymentMethod === "bank" ? "Pending Payment" : "Processing",
      items: cart,
      notes: billing.notes,
      user_id: nextUser?.id || sessionUser?.id || null,
    };

    try {
      await createOrder(order);
      if (appliedCoupon) {
        const userIdentifier = (nextUser?.email || billing.email || "").trim().toLowerCase();
        await recordCouponUsage(appliedCoupon, userIdentifier);
      }
      await setCart([]);
      window.location.href = `order-success.html?order=${encodeURIComponent(order.id)}`;
    } catch (error) {
      window.alert(error.message || "Unable to place the order.");
    }
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-toggles">
          <div className="checkout-banner">
            Returning customer? <button type="button" className="inline-link" onClick={() => setShowLogin((value) => !value)}>Click here to login</button>
          </div>
          {showLogin ? (
            <form className="checkout-dropdown" onSubmit={handleLogin}>
              <p>If you have shopped with us before, enter your details below.</p>
              <div className="form-group">
                <label>Email address</label>
                <input type="email" value={loginState.identity} onChange={(event) => setLoginState((current) => ({ ...current, identity: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={loginState.password} onChange={(event) => setLoginState((current) => ({ ...current, password: event.target.value }))} />
              </div>
              <button className="btn btn-primary" type="submit">Log In</button>
              <button
                className="link-button"
                type="button"
                onClick={async () => {
                  try {
                    await requestPasswordReset(loginState.identity.trim());
                    window.alert("Password reset email sent.");
                  } catch (error) {
                    window.alert(error.message || "Unable to send the reset email.");
                  }
                }}
              >
                Lost your password?
              </button>
            </form>
          ) : null}

          <div className="checkout-banner">
            Have a coupon? <button type="button" className="inline-link" onClick={() => setShowCoupon((value) => !value)}>Click here to enter your code</button>
          </div>
          {showCoupon ? (
            <div className="checkout-dropdown">
              <p>If you have a coupon code, apply it below.</p>
              <div className="coupon-row">
                <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Coupon code" />
                <button className="btn btn-primary" type="button" onClick={applyCoupon}>Apply Coupon</button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="checkout-grid">
          <div className="billing-section">
            <h2 className="checkout-section-title">Billing Details</h2>
            <form className="billing-form" onSubmit={handlePlaceOrder}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>First name <span className="req">*</span></label>
                  <input value={billing.firstName} onChange={(event) => setBilling((current) => ({ ...current, firstName: event.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Last name <span className="req">*</span></label>
                  <input value={billing.lastName} onChange={(event) => setBilling((current) => ({ ...current, lastName: event.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Company name (optional)</label>
                <input value={billing.company} onChange={(event) => setBilling((current) => ({ ...current, company: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Country / Region</label>
                <select value={billing.country} onChange={(event) => setBilling((current) => ({ ...current, country: event.target.value }))}>
                  <option value="Qatar">Qatar</option>
                </select>
              </div>
              <div className="form-group">
                <label>Street address <span className="req">*</span></label>
                <input value={billing.address1} onChange={(event) => setBilling((current) => ({ ...current, address1: event.target.value }))} placeholder="House number and street name" required />
                <input value={billing.address2} onChange={(event) => setBilling((current) => ({ ...current, address2: event.target.value }))} placeholder="Apartment, suite, unit, etc. (optional)" />
              </div>
              <div className="form-group">
                <label>Town / City <span className="req">*</span></label>
                <input value={billing.city} onChange={(event) => setBilling((current) => ({ ...current, city: event.target.value }))} required />
              </div>
              <div className="form-group">
                <label>State / County <span className="req">*</span></label>
                <input value={billing.state} onChange={(event) => setBilling((current) => ({ ...current, state: event.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Postcode / ZIP <span className="req">*</span></label>
                <input value={billing.zip} onChange={(event) => setBilling((current) => ({ ...current, zip: event.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Phone <span className="req">*</span></label>
                <input value={billing.phone} onChange={(event) => setBilling((current) => ({ ...current, phone: event.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Email address <span className="req">*</span></label>
                <input type="email" value={billing.email} onChange={(event) => setBilling((current) => ({ ...current, email: event.target.value }))} required />
              </div>
              {!currentUser ? (
                <>
                  <div className="form-check">
                    <input id="create-account" type="checkbox" checked={createAccount} onChange={(event) => setCreateAccount(event.target.checked)} />
                    <label htmlFor="create-account">Create an account?</label>
                  </div>
                  {createAccount ? (
                    <div className="create-account-fields">
                      <div className="form-group">
                        <label>Account username</label>
                        <input value={billing.username} onChange={(event) => setBilling((current) => ({ ...current, username: event.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label>Create account password</label>
                        <input type="password" value={billing.password} onChange={(event) => setBilling((current) => ({ ...current, password: event.target.value }))} required={createAccount} />
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
              <div className="form-group">
                <label>Order notes (optional)</label>
                <textarea rows="4" value={billing.notes} onChange={(event) => setBilling((current) => ({ ...current, notes: event.target.value }))} />
              </div>
            </form>
          </div>

          <div className="order-summary-box">
            <h2 className="checkout-section-title">Your Order</h2>
            <table className="os-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cart.length ? cart.map((item) => (
                  <tr key={item.cartId} className="os-item-row">
                    <td className="os-item-cell">
                      <button type="button" className="remove-inline" onClick={() => changeQty(item.cartId, -item.qty)}>x</button>
                      <div className="os-item-img"><img src={item.image || item.img} alt={item.name} /></div>
                      <div className="os-item-name">{item.name}</div>
                      <div className="qty-badge">{item.qty}</div>
                    </td>
                    <td className="os-item-total">{formatPrice(item.price * item.qty)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="2" style={{ textAlign: "center", padding: 20 }}>Your cart is empty.</td></tr>
                )}
              </tbody>
            </table>
            <div className="os-summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="os-summary-row discount-row">
                <span>Discount ({appliedCoupon.code})</span>
                <span>- {formatPrice(discount)}</span>
              </div>
            ) : null}
            <div className="os-summary-row">
              <span>Shipment</span>
              <span>{shipping === 0 ? "Free shipping" : formatPrice(shipping)}</span>
            </div>
            <div className="os-summary-total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <div className="payment-methods">
              {[
                { id: "cod", label: "Cash on delivery" },
                { id: "bank", label: "Direct Bank Transfer" },
                { id: "card", label: "Credit / Debit Card" },
              ].map((option) => (
                <label key={option.id} className="pm-option">
                  <input type="radio" name="payment_method" value={option.id} checked={paymentMethod === option.id} onChange={() => setPaymentMethod(option.id)} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            <button className="pay-btn" onClick={handlePlaceOrder}>Place Order</button>
          </div>
        </div>
      </div>
    </div>
  );
}
