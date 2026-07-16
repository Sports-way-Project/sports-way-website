import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../lib/format";
import { getLiveStock, sendOrderNotification } from "../lib/fastapiClient";
import { createOrder, fetchCouponByCode, getNextOrderNumber, hasCustomerOrderedBefore, recordCouponUsage, syncProductStock } from "../lib/storefrontApi";
import { showAlert } from "../lib/dialog.jsx";
import { BrandLoader } from "../components/BrandLoader";

// Order-placed notifications (email + WhatsApp) now run entirely server-side
// via FastAPI — see backend/app/routers/notifications.py. This used to fetch
// FormSubmit/Infobip directly from the browser with an Infobip API key
// hardcoded in this file, which shipped that key to every visitor.
async function sendOrderNotifications(order) {
  try {
    await sendOrderNotification(order);
  } catch (error) {
    console.error("[ORDER NOTIFICATION] Failed to notify backend.", error);
    // Silent – never block the order completion screen
  }
}

// SWWO-YYMM##### — e.g. SWWO-260700001. The sequence itself comes from an
// atomic Postgres function (see migration 005) so two simultaneous checkouts
// in the same month can't land on the same number.
async function generateOrderId() {
  const now = new Date();
  const yearMonth = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const sequence = await getNextOrderNumber(yearMonth);
  return `SWWO-${yearMonth}${String(sequence).padStart(5, "0")}`;
}

// Re-checks live Dolibarr stock for every linked cart item right before the
// order is placed (same fetch-and-compare pattern the admin Stocks page
// uses), refreshes Supabase's cached stock if it drifted, and reports any
// item that can no longer cover the requested quantity so checkout can be
// blocked instead of silently overselling.
async function verifyAndSyncCartStock(cart) {
  const problems = [];
  const staleUpdates = [];

  await Promise.all(
    cart.filter((item) => item.dolibarrId).map(async (item) => {
      try {
        const live = await getLiveStock(item.productId, item.dolibarrId);
        const available = live.stock_status === "instock" ? Number(live.stock_count ?? 0) : 0;
        if (available < item.qty) {
          problems.push({ name: item.name, requested: item.qty, available });
        }
        staleUpdates.push({ id: item.productId, stockStatus: live.stock_status, stockCount: live.stock_count });
      } catch (error) {
        console.error("Live stock check failed for", item.name, error);
        // Fail open on the network check itself — don't block checkout over
        // a flaky FastAPI/Dolibarr call, only over confirmed insufficient stock.
      }
    })
  );

  if (staleUpdates.length) {
    syncProductStock(staleUpdates).catch((error) => console.error("Failed to sync stock cache:", error));
  }

  return problems;
}

export function CheckoutPage({ cart, changeQty, currentUser, saveProfile, setCart, signIn, sessionUser }) {
  const [showLogin, setShowLogin] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [bankReference, setBankReference] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null); // null = not yet placed
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
    notes: "",
  });
  const [loginState, setLoginState] = useState({ identity: "", password: "" });

  useEffect(() => {
    document.title = "Checkout - Sports Way";
    // Auto-apply 10% first-order discount if flag is set
    const hasDiscount = localStorage.getItem("firstOrderDiscount") === "true";
    if (hasDiscount && !appliedCoupon) {
      setAppliedCoupon({
        code: "WELCOME10",
        discount: 10,
        discountType: "percent",
        isFirstOrder: true,
      });
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const nameParts = String(currentUser.name || "").split(" ");

    // billing_address is stored as a JSON blob (see AccountPage's Addresses
    // tab / the auto-save in handlePlaceOrder below), not a plain string —
    // parse it the same way AccountPage does instead of dumping raw JSON
    // into the street-address field.
    let saved = {};
    try {
      if (currentUser.billing_address && currentUser.billing_address.startsWith("{")) {
        saved = JSON.parse(currentUser.billing_address);
      }
    } catch {
      // Ignore malformed saved address — falls back to blank fields below.
    }

    setBilling((c) => ({
      ...c,
      firstName: c.firstName || saved.first_name || nameParts[0] || "",
      lastName: c.lastName || saved.last_name || nameParts.slice(1).join(" ") || "",
      company: c.company || saved.company || "",
      address1: c.address1 || saved.address || "",
      city: c.city || saved.city || "",
      state: c.state || saved.zone || "",
      zip: c.zip || saved.zip || "",
      country: c.country || saved.country || "Qatar",
      phone: c.phone || saved.phone || currentUser.phone || "",
      email: c.email || currentUser.email || "",
    }));
  }, [currentUser]);

  const subtotal = useMemo(() => cart.reduce((t, i) => t + i.price * i.qty, 0), [cart]);
  const shipping = subtotal >= 300 || subtotal === 0 ? 0 : 30;
  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === "fixed_cart")
      return Math.min(appliedCoupon.discount, subtotal);
    return Math.round(subtotal * ((appliedCoupon.discount || 0) / 100));
  }, [appliedCoupon, subtotal]);
  const total = Math.max(0, subtotal - discount) + shipping;

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setApplyingCoupon(true);
    try {
      const coupon = await fetchCouponByCode(code);
      if (!coupon) { showAlert("Invalid coupon code."); return; }
      if (coupon.limitPerCoupon !== null && Number(coupon.usedCount || 0) >= coupon.limitPerCoupon) {
        showAlert("This coupon code has reached its usage limit."); return;
      }
      const uid = (currentUser?.email || billing.email || "").trim().toLowerCase();
      if (coupon.limitPerUser !== null && uid) {
        const uuc = Number(coupon.userUses?.[uid] || 0);
        if (uuc >= coupon.limitPerUser) { showAlert("You have already reached the usage limit for this coupon."); return; }
      }
      if (coupon.specificProducts?.length) {
        const ok = cart.some((item) =>
          coupon.specificProducts.some((sp) => String(item.name || "").toLowerCase().includes(String(sp).toLowerCase()))
        );
        if (!ok) { showAlert("This coupon is not valid for any items in your cart."); return; }
      }
      setAppliedCoupon(coupon);
    } catch (error) {
      showAlert(error.message || "Unable to check that coupon right now. Please try again.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginSubmitting(true);
    try {
      await signIn({ email: loginState.identity.trim(), password: loginState.password, guestCart: cart });
      setShowLogin(false);
    } catch (err) {
      showAlert(err.message || "Incorrect login details.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cart.length) { showAlert("Your cart is empty."); return; }
    if (!billing.firstName || !billing.lastName || !billing.address1 || !billing.city || !billing.phone || !billing.email) {
      showAlert("Please complete all required billing fields."); return;
    }
    if (paymentMethod === "card") {
      showAlert("Card payments via Sadad are coming soon. Please choose Cash on Delivery or Direct Bank Transfer for now.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Re-check live Dolibarr stock for every linked item and block if
      // any of them can no longer cover the requested quantity — the old
      // flow never checked stock at all at order time.
      const stockProblems = await verifyAndSyncCartStock(cart);
      if (stockProblems.length) {
        const lines = stockProblems
          .map((p) => `- ${p.name}: requested ${p.requested}, only ${p.available} available`)
          .join("\n");
        showAlert(
          `Some items in your cart are no longer available in the requested quantity:\n\n${lines}\n\nPlease update your cart and try again.`
        );
        return;
      }

      // 2. Re-validate the first-order discount against real order history —
      // the old check was a localStorage flag alone, trivially spoofable.
      let effectiveCoupon = appliedCoupon;
      if (effectiveCoupon?.isFirstOrder && (await hasCustomerOrderedBefore(billing.email))) {
        effectiveCoupon = null;
        showAlert("The first-order discount only applies to your first order and can't be applied here.");
      }

      // 3. Atomically consume the coupon's usage before finalizing totals —
      // if a concurrent checkout already hit the limit, drop it instead of
      // blocking this order entirely.
      let effectiveDiscount = 0;
      if (effectiveCoupon) {
        effectiveDiscount = effectiveCoupon.discountType === "fixed_cart"
          ? Math.min(effectiveCoupon.discount, subtotal)
          : Math.round(subtotal * ((effectiveCoupon.discount || 0) / 100));

        if (!effectiveCoupon.isFirstOrder) {
          const uid = (currentUser?.email || billing.email || "").trim().toLowerCase();
          const usageResult = await recordCouponUsage(effectiveCoupon, uid);
          if (!usageResult) {
            effectiveCoupon = null;
            effectiveDiscount = 0;
            showAlert("This coupon just reached its usage limit and could not be applied. Placing your order without it.");
          }
        }
      }

      const effectiveTotal = Math.max(0, subtotal - effectiveDiscount) + shipping;

      // 4. Create the order, retrying with a freshly generated ID on the
      // rare order_id collision instead of failing the whole checkout.
      let order = null;
      let lastError = null;
      for (let attempt = 0; attempt < 5 && !order; attempt++) {
        const candidate = {
          id: await generateOrderId(),
          created_at: new Date().toISOString(),
          customer_name: `${billing.firstName} ${billing.lastName}`.trim(),
          company: billing.company || "",
          email: billing.email,
          phone: billing.phone,
          total: effectiveTotal,
          subtotal,
          shipping,
          discount: effectiveDiscount,
          coupon_code: effectiveCoupon?.isFirstOrder ? null : (effectiveCoupon?.code || null),
          payment_method: paymentMethod === "cod" ? "Cash on Delivery" : "Direct Bank Transfer",
          payment_reference: paymentMethod === "bank" ? bankReference.trim() : "",
          status: paymentMethod === "bank" ? "Pending Payment" : "Processing",
          items: cart,
          notes: billing.notes,
          // Full-fidelity copy of everything typed in the billing form —
          // `address` below is just a quick-display string built from a
          // subset of this and used to silently drop the zone/zip (and
          // hardcode "Qatar" instead of the actual country). Applies to
          // guests and logged-in customers alike, since a logged-in
          // customer's profile address can change after the order was
          // placed — the order should freeze what was true at checkout time.
          billing_details: {
            first_name: billing.firstName,
            last_name: billing.lastName,
            company: billing.company,
            phone: billing.phone,
            email: billing.email,
            address1: billing.address1,
            address2: billing.address2,
            city: billing.city,
            zone: billing.state,
            zip: billing.zip,
            country: billing.country,
            notes: billing.notes,
          },
          address: [
            billing.address1,
            billing.address2,
            billing.city,
            billing.state,
            billing.zip,
            billing.country,
          ].filter(Boolean).join(", "),
          user_id: currentUser?.id || sessionUser?.id || null,
        };
        try {
          await createOrder(candidate);
          order = candidate;
        } catch (err) {
          lastError = err;
          if (err?.code !== "23505") throw err; // only retry on duplicate order_id
        }
      }
      if (!order) throw lastError || new Error("Unable to place the order. Please try again.");

      // First time this account has an address on file, save what they just
      // typed so future checkouts (and the account's Addresses tab) are
      // pre-filled automatically. Never overwrites an address they already
      // saved on purpose via the account page.
      if (currentUser?.id && saveProfile && !currentUser.billing_address) {
        const addrJson = JSON.stringify({
          first_name: billing.firstName,
          last_name: billing.lastName,
          company: billing.company,
          phone: billing.phone,
          address: `${billing.address1}${billing.address2 ? ", " + billing.address2 : ""}`,
          city: billing.city,
          zone: billing.state,
          buildingNo: "",
          country: billing.country,
          zip: billing.zip,
        });
        saveProfile({ profilePatch: { billing_address: addrJson, shipping_address: addrJson } }).catch((err) =>
          console.error("Failed to save address for future orders:", err)
        );
      }

      // Silently send email + WhatsApp notifications
      sendOrderNotifications(order).catch(() => {});

      // Clear cart (localStorage for guests too)
      localStorage.removeItem("guest_cart");
      // Clear first-order discount flag after use
      localStorage.removeItem("firstOrderDiscount");
      localStorage.removeItem("ctaEmail");
      await setCart([]);

      setPlacedOrder(order);
    } catch (err) {
      showAlert(err.message || "Unable to place the order. Please try again.");
    } finally {
      setSubmitting(false);
      // The visitor is usually scrolled down from filling in billing details;
      // without this the success screen renders off-screen at the old scroll
      // position. Delayed slightly so it happens after the loader's fade-out
      // (--admin-overlay-fade-duration) instead of scrolling underneath it.
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 200);
    }
  };

  // ── ORDER SUCCESS SCREEN ────────────────────────────────────────────────
  if (placedOrder) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="order-success-wrap">
            <div className="order-success-icon">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <h1 className="order-success-title">Order Placed!</h1>
            <p className="order-success-sub">
              Thank you, <strong>{placedOrder.customer_name}</strong>. Your order has been received.
            </p>
            <div className="order-success-id">
              Order ID: <strong>{placedOrder.id}</strong>
            </div>
            <div className="order-success-details">
              <div className="osd-row"><span>Payment</span><span>{placedOrder.payment_method}</span></div>
              <div className="osd-row"><span>Total</span><span>{formatPrice(placedOrder.total)}</span></div>
              <div className="osd-row"><span>Status</span><span className="osd-status">{placedOrder.status}</span></div>
              {placedOrder.items.map((item) => (
                <div key={item.cartId} className="osd-row osd-item">
                  <span>{item.name} × {item.qty}</span>
                  <span>{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <p className="order-success-note">
              Our team has been notified and will contact you shortly to confirm your delivery details.
            </p>
            <div className="order-success-actions">
              <Link to="/" className="btn btn-primary">Continue Shopping</Link>
              {(currentUser || sessionUser) && (
                <Link to="/account" className="btn btn-outline">Track Order</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CHECKOUT FORM ────────────────────────────────────────────────────────
  return (
    <div className="checkout-page">
      <BrandLoader visible={submitting || loginSubmitting} />
      <div className="container">
        <div className="checkout-toggles">
          <div className="checkout-banner">
            Have a coupon?{" "}
            <button type="button" className="inline-link" onClick={() => setShowCoupon((v) => !v)}>
              Click here to enter your code
            </button>
          </div>
          {showCoupon && (
            <div className="checkout-dropdown">
              <p>If you have a coupon code, apply it below.</p>
              <div className="coupon-row">
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" />
                <button className="btn btn-primary" type="button" disabled={applyingCoupon} style={{ opacity: applyingCoupon ? 0.6 : 1 }} onClick={applyCoupon}>
                  {applyingCoupon ? "Checking…" : "Apply Coupon"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="checkout-grid">
          {/* ── BILLING ── */}
          <div className="billing-section">
            <h2 className="checkout-section-title">Billing Details</h2>
            <form className="billing-form" id="checkout-form" onSubmit={handlePlaceOrder}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>First name <span className="req">*</span></label>
                  <input value={billing.firstName} onChange={(e) => setBilling((c) => ({ ...c, firstName: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Last name <span className="req">*</span></label>
                  <input value={billing.lastName} onChange={(e) => setBilling((c) => ({ ...c, lastName: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Company name (optional)</label>
                <input value={billing.company} onChange={(e) => setBilling((c) => ({ ...c, company: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Street address <span className="req">*</span></label>
                <input value={billing.address1} onChange={(e) => setBilling((c) => ({ ...c, address1: e.target.value }))} placeholder="House number and street name" required />
                <input value={billing.address2} onChange={(e) => setBilling((c) => ({ ...c, address2: e.target.value }))} placeholder="Apartment, suite, unit, etc. (optional)" style={{ marginTop: 8 }} />
              </div>
              <div className="form-group">
                <label>Town / City <span className="req">*</span></label>
                <input value={billing.city} onChange={(e) => setBilling((c) => ({ ...c, city: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>State / County</label>
                <input value={billing.state} onChange={(e) => setBilling((c) => ({ ...c, state: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Postcode / ZIP</label>
                <input value={billing.zip} onChange={(e) => setBilling((c) => ({ ...c, zip: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Phone <span className="req">*</span></label>
                <input value={billing.phone} onChange={(e) => setBilling((c) => ({ ...c, phone: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Email address <span className="req">*</span></label>
                <input type="email" value={billing.email} onChange={(e) => setBilling((c) => ({ ...c, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Order notes (optional)</label>
                <textarea rows="4" value={billing.notes} onChange={(e) => setBilling((c) => ({ ...c, notes: e.target.value }))} />
              </div>
            </form>
          </div>

          {/* ── ORDER SUMMARY ── */}
          <div className="order-summary-box">
            <h2 className="checkout-section-title">Your Order</h2>
            <table className="os-table">
              <thead>
                <tr><th>Product</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                {cart.length ? cart.map((item) => (
                  <tr key={item.cartId} className="os-item-row">
                    <td className="os-item-cell">
                      <button type="button" className="remove-inline" onClick={() => changeQty(item.cartId, -item.qty)}>×</button>
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

            <div className="os-summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            {discount > 0 && (
              <div className="os-summary-row discount-row">
                <span>
                  {appliedCoupon?.isFirstOrder ? "🎉 First Order 10% Off" : `Discount (${appliedCoupon?.code})`}
                </span>
                <span>- {formatPrice(discount)}</span>
              </div>
            )}
            <div className="os-summary-row"><span>Shipment</span><span>{shipping === 0 ? "Free shipping" : formatPrice(shipping)}</span></div>
            <div className="os-summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>

            {appliedCoupon?.isFirstOrder && (
              <div className="checkout-first-order-badge">
                <span className="cfob-tag">🎉 WELCOME10</span>
                <span>Your 10% first order discount has been applied automatically!</span>
              </div>
            )}

            <div className="payment-methods">
              {[
                { id: "cod", label: "Cash on Delivery" },
                { id: "bank", label: "Direct Bank Transfer" },
                { id: "card", label: "Credit / Debit Card (via Sadad) — coming soon", disabled: true },
              ].map((opt) => (
                <label key={opt.id} className={`pm-option${opt.disabled ? " pm-option-disabled" : ""}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value={opt.id}
                    checked={paymentMethod === opt.id}
                    disabled={opt.disabled}
                    onChange={() => setPaymentMethod(opt.id)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {paymentMethod === "cod" && (
              <p className="cod-info">Pay with cash upon delivery. Our team will contact you to confirm the delivery schedule.</p>
            )}
            {paymentMethod === "bank" && (
              <>
                <p className="cod-info">Make your payment directly into our bank account. Please use your Order ID as the payment reference. Your order will be processed once payment is confirmed.</p>
                <div className="account-field" style={{ marginTop: 14, marginBottom: 20 }}>
                  <label>Transfer reference / receipt number (optional)</label>
                  <input
                    type="text"
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    placeholder="e.g. bank confirmation number"
                  />
                </div>
              </>
            )}

            <button
              className="pay-btn"
              form="checkout-form"
              type="submit"
              disabled={submitting || !cart.length}
            >
              {submitting ? "Placing Order…" : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
