import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formatPrice } from "../lib/format";
import { fetchOrdersForUser } from "../lib/storefrontApi";
import { supabase } from "../lib/supabase";
import { BrandLoader } from "../components/BrandLoader";

export function AccountPage({
  cart = [],
  clearRecovery,
  currentUser,
  isRecovery = false,
  products,
  removeWishlistItem,
  requestPasswordReset,
  saveProfile,
  signIn,
  signOut,
  signUp,
  wishlist = [],
}) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [messages, setMessages] = useState({});
  const [login, setLogin] = useState({ identity: "", password: "" });
  const [register, setRegister] = useState({ name: "", phone: "", email: "", password: "", termsAccepted: false });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [fromCta, setFromCta] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const [otpState] = useState({ active: false });
  const [recovery, setRecovery] = useState({ open: false, email: "" });
  const [newPasswordForm, setNewPasswordForm] = useState({ password: "", confirm: "", saving: false, done: false });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profile, setProfile] = useState({ billingAddress: "", shippingAddress: "", name: "", email: "", phone: "", password: "", marketingOptIn: false, company: "", city: "", zone: "", buildingNo: "", country: "", zip: "" });
  const [orders, setOrders] = useState([]);

  const wishlistProducts = useMemo(
    () => wishlist.map((id) => products.find((product) => String(product.id) === String(id))).filter(Boolean),
    [products, wishlist],
  );

  useEffect(() => {
    document.title = "My Account - Sports Way Trading";
    // Pre-fill register form from CTA banner
    const isRegister = searchParams.get("register") === "1";
    const emailParam = searchParams.get("email") || localStorage.getItem("ctaEmail") || "";
    const hasDiscount = localStorage.getItem("firstOrderDiscount") === "true";
    if (isRegister && emailParam) {
      setRegister((c) => ({ ...c, email: emailParam }));
    }
    if (isRegister || hasDiscount) {
      setFromCta(true);
      setAuthTab("register");
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      return;
    }

    let active = true;
    const loadOrders = async () => {
      const nextOrders = await fetchOrdersForUser(currentUser.id);
      if (active) {
        setOrders(nextOrders);
      }
    };

    loadOrders();
    return () => {
      active = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let sAddr = { first_name: "", last_name: "", company: "", phone: "", address: "", city: "", zone: "", buildingNo: "", country: "", zip: "" };
    try {
      if (currentUser.shipping_address && currentUser.shipping_address.startsWith("{")) {
        sAddr = { ...sAddr, ...JSON.parse(currentUser.shipping_address) };
      } else {
        sAddr.address = currentUser.shipping_address || "";
      }
    } catch(e) {}

    setProfile({
      billingAddress: currentUser.billing_address || "",
      shippingAddress: currentUser.shipping_address || "",
      name: currentUser.name || "",
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      password: "",
      marketingOptIn: Boolean(currentUser.marketing_opt_in),
      ...sAddr
    });
  }, [currentUser]);

  const setMessage = (key, text, type = "") => {
    setMessages((current) => ({ ...current, [key]: { text, type } }));
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/my-account` },
      });
      if (error) throw error;
      // Browser now navigates to Google — nothing left to do here. The
      // redirect back is picked up by detectSessionInUrl on the supabase
      // client, and useAccount's onAuthStateChange listener runs ensureProfile
      // for the new session same as any other sign-in.
    } catch (error) {
      setMessage("login", error.message || "Unable to start Google sign-in.", "error");
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthSubmitting(true);
    try {
      await signIn({
        email: login.identity.trim(),
        password: login.password,
        guestCart: cart,
        guestWishlist: wishlist,
      });
      setMessage("login", "");
    } catch (error) {
      setMessage("login", error.message || "Incorrect email or password.", "error");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setAuthSubmitting(true);
    try {
      const result = await signUp({
        email: register.email.trim(),
        password: register.password,
        name: register.name.trim(),
        phone: register.phone.trim(),
        terms_accepted: register.termsAccepted,
        marketing_opt_in: false,
        guestCart: cart,
        guestWishlist: wishlist,
      });
      if (result?.needsConfirmation) {
        setMessage("register", "✅ Account created! Please check your email to confirm your account, then log in.", "success");
      } else {
        setMessage("register", "✅ Account created successfully! You are now logged in.", "success");
      }
    } catch (error) {
      setMessage("register", error.message || "Unable to create the account.", "error");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const saveAddresses = async (event) => {
    event.preventDefault();
    const addrJson = JSON.stringify({
      first_name: profile.first_name,
      last_name: profile.last_name,
      company: profile.company,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      zone: profile.zone,
      buildingNo: profile.buildingNo,
      country: profile.country,
      zip: profile.zip,
    });
    setFormSubmitting(true);
    try {
      await saveProfile({
        profilePatch: {
          billing_address: addrJson,
          shipping_address: addrJson,
        },
      });
      setMessage("addresses", "Addresses updated successfully.", "success");
    } catch (error) {
      setMessage("addresses", error.message || "Unable to save addresses.", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const saveDetails = async (event) => {
    event.preventDefault();
    setFormSubmitting(true);
    try {
      await saveProfile({
        profilePatch: {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          marketing_opt_in: profile.marketingOptIn,
        },
        authPatch: {
          email: profile.email,
          password: profile.password || undefined,
          data: {
            name: profile.name,
            phone: profile.phone,
            marketing_opt_in: profile.marketingOptIn,
          },
        },
      });
      setProfile((current) => ({ ...current, password: "" }));
      setMessage("details", "Account details saved successfully.", "success");
    } catch (error) {
      setMessage("details", error.message || "Unable to save account details.", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const sendRecoveryEmail = async () => {
    setFormSubmitting(true);
    try {
      await requestPasswordReset(recovery.email.trim());
      setMessage("recovery", "Password reset email sent. Check your inbox.", "success");
    } catch (error) {
      setMessage("recovery", error.message || "Unable to send the reset email.", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSetNewPassword = async (event) => {
    event.preventDefault();
    if (newPasswordForm.password !== newPasswordForm.confirm) {
      setMessage("newpwd", "Passwords do not match.", "error");
      return;
    }
    if (newPasswordForm.password.length < 6) {
      setMessage("newpwd", "Password must be at least 6 characters.", "error");
      return;
    }
    setNewPasswordForm((f) => ({ ...f, saving: true }));
    try {
      const { error } = await supabase.auth.updateUser({ password: newPasswordForm.password });
      if (error) throw error;
      setNewPasswordForm({ password: "", confirm: "", saving: false, done: true });
      setMessage("newpwd", "Password updated successfully! You are now logged in.", "success");
      setTimeout(() => { if (clearRecovery) clearRecovery(); }, 2000);
    } catch (error) {
      setNewPasswordForm((f) => ({ ...f, saving: false }));
      setMessage("newpwd", error.message || "Unable to update password.", "error");
    }
  };

  return (
    <div className="account-page">
      <div className="container">
        {!currentUser ? (
          <div className="account-card">
            <BrandLoader visible={authSubmitting} />
            <div className="account-title">My Account</div>
            <div className="account-sub">Sign in to track orders, manage addresses, update details and view your wishlist.</div>
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab-btn ${authTab === "login" ? "active" : ""}`}
                onClick={() => setAuthTab("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authTab === "register" ? "active" : ""}`}
                onClick={() => setAuthTab("register")}
              >
                Register
              </button>
            </div>
            <div className="split-auth split-auth-single">
              {authTab === "login" && (
              <div>
                <form className="account-form" onSubmit={handleLogin} autoComplete="off">
                  <div className="account-field">
                    <label>Username or email address</label>
                    <input
                      type="email"
                      value={login.identity}
                      onChange={(event) => setLogin((current) => ({ ...current, identity: event.target.value }))}
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="account-field">
                    <label>Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={login.password}
                        onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))}
                        required
                        autoComplete="new-password"
                        style={{ paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex", alignItems: "center" }}
                        aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        {showLoginPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="account-actions">
                    <button className="btn btn-primary" type="submit">Log In</button>
                    <label className="remember-inline">
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>
                    <button type="button" className="link-button" onClick={() => setRecovery({ open: true, email: login.identity })}>Lost your password?</button>
                  </div>
                  <div className={`account-msg ${messages.login?.type || ""}`}>{messages.login?.text || ""}</div>
                </form>
                <div className="oauth-divider"><span>or</span></div>
                <button
                  type="button"
                  className="btn btn-google"
                  disabled
                  title="Coming soon — Google sign-in is not enabled yet"
                  style={{ opacity: 0.5, cursor: "not-allowed" }}
                  onClick={handleGoogleLogin}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"/>
                    <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"/>
                    <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
                  </svg>
                  Continue with Google (coming soon)
                </button>
              </div>
              )}
              {authTab === "register" && (
              <div>
                {fromCta && (
                  <div className="discount-welcome-banner">
                    <span className="dwb-badge">🎉 10% OFF</span>
                    <span>Your first order discount is ready! Complete registration to claim it.</span>
                  </div>
                )}
                <form className="account-form" onSubmit={handleRegister} autoComplete="off">
                  <div className="account-field">
                    <label>Full name</label>
                    <input
                      value={register.name}
                      onChange={(event) => setRegister((current) => ({ ...current, name: event.target.value }))}
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="account-field">
                    <label>Phone number</label>
                    <input
                      value={register.phone}
                      onChange={(event) => setRegister((current) => ({ ...current, phone: event.target.value }))}
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="account-field">
                    <label>Email address</label>
                    <input
                      type="email"
                      value={register.email}
                      onChange={(event) => setRegister((current) => ({ ...current, email: event.target.value }))}
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="account-field">
                    <label>Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showRegPassword ? "text" : "password"}
                        value={register.password}
                        onChange={(event) => setRegister((current) => ({ ...current, password: event.target.value }))}
                        required
                        autoComplete="new-password"
                        style={{ paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((v) => !v)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex", alignItems: "center" }}
                      >
                        {showRegPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <label className="remember-inline">
                    <input
                      type="checkbox"
                      checked={register.termsAccepted}
                      onChange={(event) => setRegister((current) => ({ ...current, termsAccepted: event.target.checked }))}
                      required
                    />
                    <span>I accept the <a href="/terms" target="_blank" style={{ textDecoration: "underline", color: "var(--red)" }}>terms and conditions</a>.</span>
                  </label>
                  <div className="account-actions">
                    <button className="btn btn-primary" type="submit">Register</button>
                  </div>
                  <div className={`account-msg ${messages.register?.type || ""}`}>{messages.register?.text || ""}</div>
                </form>
              </div>
              )}
            </div>
          </div>
        ) : (
          <div className="account-grid">
            <BrandLoader visible={formSubmitting} />
            <aside className="account-menu">
              <h3>My Account</h3>
              {["dashboard", "orders", "addresses", "details", "wishlist"].map((tab) => (
                <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
                  {tab === "details" ? "Account details" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              <button onClick={async () => { setFormSubmitting(true); try { await signOut(); } finally { setFormSubmitting(false); } }}>Logout</button>
            </aside>
            <main className="account-content">
              {!currentUser.terms_accepted ? (
                <div className="discount-welcome-banner" style={{ marginBottom: 20 }}>
                  <span>Please confirm you accept our <a href="/terms" target="_blank" style={{ textDecoration: "underline", color: "inherit" }}>terms and conditions</a> to finish setting up your account.</span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginLeft: 12, flexShrink: 0 }}
                    onClick={async () => {
                      setFormSubmitting(true);
                      try {
                        await saveProfile({ profilePatch: { terms_accepted: true } });
                      } catch (error) {
                        setMessage("dashboard", error.message, "error");
                      } finally {
                        setFormSubmitting(false);
                      }
                    }}
                  >
                    I accept
                  </button>
                </div>
              ) : null}
              {activeTab === "dashboard" ? (
                <section className="account-section active">
                  <h2 className="account-title" style={{ fontSize: 28 }}>Dashboard</h2>
                  <p className="account-sub">Hello {currentUser.name || currentUser.email}. From your account dashboard you can view recent orders, manage addresses, and update your details.</p>
                  <div className="dashboard-cards">
                    <div className="dashboard-card"><strong>{orders.length}</strong><span>Orders</span></div>
                    <div className="dashboard-card"><strong>{wishlistProducts.length}</strong><span>Wishlist</span></div>
                    <div className="dashboard-card"><strong>{orders[0]?.status || "No Orders"}</strong><span>Latest Order Status</span></div>
                  </div>
                </section>
              ) : null}
              {activeTab === "orders" ? (
                <section className="account-section active">
                  <h2 className="account-title" style={{ fontSize: 28 }}>My Orders</h2>
                  {orders.length ? (
                    <div className="orders-list">
                      {orders.map((order) => {
                        const STATUS_STEPS = ["Processing", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];
                        const currentStepIdx = STATUS_STEPS.findIndex(
                          (s) => s.toLowerCase() === String(order.status || "").toLowerCase()
                        );
                        const isCancelled = String(order.status || "").toLowerCase() === "cancelled";
                        const isPending = String(order.status || "").toLowerCase() === "pending payment";
                        return (
                          <div key={order.id} className="order-track-card">
                            <div className="order-track-header">
                              <div>
                                <span className="order-track-id">{order.id}</span>
                                <span className="order-track-date">{new Date(order.created_at).toLocaleDateString("en-QA", { day: "numeric", month: "short", year: "numeric" })}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span className={`status-pill status-pill--lg ${String(order.status || "processing").toLowerCase().replace(/\s+/g, "-")}`}>
                                  {order.status || "Processing"}
                                </span>
                                <span className="order-track-total">{formatPrice(order.total || 0)}</span>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="order-track-items">
                              {(order.items || []).map((item, idx) => (
                                <div key={idx} className="order-track-item">
                                  {(item.image || item.img || item.image_url) && (
                                    <img src={item.image || item.img || item.image_url} alt={item.name} />
                                  )}
                                  <div>
                                    <div className="otrack-name">{item.name}</div>
                                    <div className="otrack-meta">Qty: {item.qty} · {formatPrice(item.price)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Progress Tracker */}
                            {!isCancelled && !isPending && (
                              <div className="order-progress">
                                {STATUS_STEPS.map((step, idx) => (
                                  <div key={step} className={`op-step ${idx <= currentStepIdx ? "done" : ""} ${idx === currentStepIdx ? "current" : ""}`}>
                                    <div className="op-dot">
                                      {idx <= currentStepIdx ? (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      ) : null}
                                    </div>
                                    {idx < STATUS_STEPS.length - 1 && <div className="op-line" />}
                                    <div className="op-label">{step}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {isCancelled && (
                              <div className="order-cancelled-note">❌ This order has been cancelled.</div>
                            )}

                            <div className="order-track-footer">
                              <span>Payment: {order.payment_method}</span>
                              {order.address ? <span>Shipping to: {order.address}</span> : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <div className="empty-state">No orders found for this account yet.</div>}
                </section>
              ) : null}
              {activeTab === "addresses" ? (
                <section className="account-section active">
                  <h2 className="account-title" style={{ fontSize: 28 }}>Primary Address</h2>
                  <form className="account-form" onSubmit={saveAddresses}>
                    <div className="detail-grid">
                      <div className="account-field"><label>First Name</label><input value={profile.first_name || ""} onChange={(e) => setProfile((c) => ({ ...c, first_name: e.target.value }))} required /></div>
                      <div className="account-field"><label>Last Name</label><input value={profile.last_name || ""} onChange={(e) => setProfile((c) => ({ ...c, last_name: e.target.value }))} required /></div>
                    </div>
                    <div className="detail-grid">
                      <div className="account-field"><label>Company</label><input value={profile.company || ""} onChange={(e) => setProfile((c) => ({ ...c, company: e.target.value }))} /></div>
                      <div className="account-field"><label>Phone Number</label><input value={profile.phone || ""} onChange={(e) => setProfile((c) => ({ ...c, phone: e.target.value }))} required /></div>
                    </div>
                    <div className="account-field"><label>Address</label><input value={profile.address || ""} onChange={(e) => setProfile((c) => ({ ...c, address: e.target.value }))} required /></div>
                    <div className="detail-grid">
                      <div className="account-field"><label>City</label><input value={profile.city || ""} onChange={(e) => setProfile((c) => ({ ...c, city: e.target.value }))} required /></div>
                      <div className="account-field"><label>Zone</label><input value={profile.zone || ""} onChange={(e) => setProfile((c) => ({ ...c, zone: e.target.value }))} required /></div>
                    </div>
                    <div className="detail-grid">
                      <div className="account-field"><label>Building No.</label><input value={profile.buildingNo || ""} onChange={(e) => setProfile((c) => ({ ...c, buildingNo: e.target.value }))} required /></div>
                      <div className="account-field"><label>Country</label><input value={profile.country || ""} onChange={(e) => setProfile((c) => ({ ...c, country: e.target.value }))} required /></div>
                    </div>
                    <div className="account-field"><label>Postal / ZIP (Optional)</label><input value={profile.zip || ""} onChange={(e) => setProfile((c) => ({ ...c, zip: e.target.value }))} /></div>
                    <div className="account-actions"><button className="btn btn-primary" type="submit">Save Addresses</button></div>
                    <div className={`account-msg ${messages.addresses?.type || ""}`}>{messages.addresses?.text || ""}</div>
                  </form>
                </section>
              ) : null}
              {activeTab === "details" ? (
                <section className="account-section active">
                  <h2 className="account-title" style={{ fontSize: 28 }}>Account Details</h2>
                  <form className="account-form" onSubmit={saveDetails}>
                    <div className="detail-grid">
                      <div className="account-field"><label>Full name</label><input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} required /></div>
                      <div className="account-field"><label>Email address</label><input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} required /></div>
                    </div>
                    <div className="detail-grid">
                      <div className="account-field"><label>Phone</label><input value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} /></div>
                      <div className="account-field">
                        <label>New password</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={profile.password}
                            onChange={(event) => setProfile((current) => ({ ...current, password: event.target.value }))}
                            placeholder="Leave blank to keep current password"
                            style={{ paddingRight: 44 }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((v) => !v)}
                            style={{
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-muted)",
                              padding: 4,
                              display: "flex",
                              alignItems: "center",
                            }}
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="account-actions"><button className="btn btn-primary" type="submit">Save Details</button></div>
                    <div className={`account-msg ${messages.details?.type || ""}`}>{messages.details?.text || ""}</div>
                  </form>
                </section>
              ) : null}
              {activeTab === "wishlist" ? (
                <section className="account-section active">
                  <h2 className="account-title" style={{ fontSize: 28 }}>Wishlist</h2>
                  {wishlistProducts.length ? (
                    <div className="wishlist-list">
                      {wishlistProducts.map((product) => (
                        <div key={product.id} className="wishlist-item">
                          <div>
                            <div style={{ fontWeight: 700 }}>{product.name}</div>
                            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{formatPrice(product.price || 0)}</div>
                          </div>
                          <div style={{ display: "flex", gap: 10 }}>
                            <Link className="btn btn-primary" to={`/products/${product.slug || product.id}`}>View</Link>
                            <button className="btn btn-outline" type="button" onClick={() => removeWishlistItem(product.id)}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="empty-state">Your wishlist is empty.</div>}
                </section>
              ) : null}
            </main>
          </div>
        )}
      </div>

      {recovery.open ? (
        <div className="account-modal">
          <div className="account-modal-card">
            <button className="account-modal-close" onClick={() => setRecovery({ open: false, email: "" })}>✕</button>
            <h3>Password Reset</h3>
            <p>Enter your registered email address and we will send the reset link.</p>
            <div className="account-form">
              <div className="account-field">
                <label>Registered Email address</label>
                <input type="email" value={recovery.email} onChange={(event) => setRecovery((current) => ({ ...current, email: event.target.value }))} />
              </div>
              <button className="btn btn-primary" type="button" onClick={sendRecoveryEmail}>Send Reset Email</button>
              <div className={`account-msg ${messages.recovery?.type || ""}`}>{messages.recovery?.text || ""}</div>
            </div>
          </div>
        </div>
      ) : null}

      {isRecovery ? (
        <div className="account-modal">
          <div className="account-modal-card">
            <h3 style={{ marginBottom: 8 }}>🔐 Set New Password</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>You clicked the reset link. Please enter your new password below.</p>
            {newPasswordForm.done ? (
              <div className="account-msg success" style={{ padding: 16, textAlign: "center" }}>
                ✅ Password updated! Redirecting to your account...
              </div>
            ) : (
              <form className="account-form" onSubmit={handleSetNewPassword}>
                <div className="account-field">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPasswordForm.password}
                    onChange={(e) => setNewPasswordForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                  />
                </div>
                <div className="account-field">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={newPasswordForm.confirm}
                    onChange={(e) => setNewPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                    required
                    placeholder="Re-enter new password"
                  />
                </div>
                <div className="account-actions">
                  <button className="btn btn-primary" type="submit" disabled={newPasswordForm.saving}>
                    {newPasswordForm.saving ? "Saving..." : "Save New Password"}
                  </button>
                </div>
                <div className={`account-msg ${messages.newpwd?.type || ""}`}>{messages.newpwd?.text || ""}</div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
