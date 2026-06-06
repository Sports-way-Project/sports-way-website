import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "../lib/format";
import { getOrders, getUsers, getWishlistMap, saveUsers } from "../lib/storefront";

export function AccountPage({ currentUser, products, removeWishlistItem, setCurrentUser }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [messages, setMessages] = useState({});
  const [login, setLogin] = useState({ identity: "", password: "", remember: true });
  const [register, setRegister] = useState({ name: "", phone: "", email: "", password: "" });
  const [recovery, setRecovery] = useState({ open: false, email: "", code: "", generated: "", password: "" });
  const [profile, setProfile] = useState({ billingAddress: "", shippingAddress: "", name: "", email: "", phone: "", password: "" });

  const orders = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return getOrders()
      .filter((order) => String(order.email || "").toLowerCase() === String(currentUser.email || "").toLowerCase())
      .sort((left, right) => new Date(right.created_at) - new Date(left.created_at));
  }, [currentUser]);

  const wishlistProducts = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    const wishlistMap = getWishlistMap();
    const ids = wishlistMap[String(currentUser.email || "").toLowerCase()] || [];
    return ids.map((id) => products.find((product) => String(product.id) === String(id))).filter(Boolean);
  }, [currentUser, products]);

  useEffect(() => {
    document.title = "My Account - Sports Way Trading";
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setProfile({
      billingAddress: currentUser.billing_address || "",
      shippingAddress: currentUser.shipping_address || "",
      name: currentUser.name || "",
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      password: "",
    });
  }, [currentUser]);

  const setMessage = (key, text, type = "") => {
    setMessages((current) => ({ ...current, [key]: { text, type } }));
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const user = getUsers().find((item) => {
      const identity = login.identity.trim().toLowerCase();
      return String(item.email || "").toLowerCase() === identity || String(item.name || "").toLowerCase() === identity;
    });

    if (!user || user.password !== login.password) {
      setMessage("login", "Incorrect username/email or password.", "error");
      return;
    }

    setCurrentUser(user, login.remember);
    setMessage("login", "");
  };

  const handleRegister = (event) => {
    event.preventDefault();
    const users = getUsers();
    if (users.some((item) => String(item.email || "").toLowerCase() === register.email.toLowerCase())) {
      setMessage("register", "An account with this email already exists.", "error");
      return;
    }

    const user = {
      id: `U${Date.now()}`,
      name: register.name,
      phone: register.phone,
      email: register.email,
      password: register.password,
      billing_address: "",
      shipping_address: "",
      created_at: new Date().toISOString(),
    };

    saveUsers([...users, user]);
    setCurrentUser(user, true);
    setMessage("register", "Account created successfully.", "success");
  };

  const saveAddresses = (event) => {
    event.preventDefault();
    const nextUser = {
      ...currentUser,
      billing_address: profile.billingAddress,
      shipping_address: profile.shippingAddress,
    };
    saveUsers(getUsers().map((item) => item.id === nextUser.id ? nextUser : item));
    setCurrentUser(nextUser, true);
    setMessage("addresses", "Addresses updated successfully.", "success");
  };

  const saveDetails = (event) => {
    event.preventDefault();
    const users = getUsers();
    if (users.some((item) => String(item.email || "").toLowerCase() === profile.email.toLowerCase() && item.id !== currentUser.id)) {
      setMessage("details", "This email address is already used by another account.", "error");
      return;
    }

    const nextUser = {
      ...currentUser,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      password: profile.password || currentUser.password,
    };
    saveUsers(users.map((item) => item.id === nextUser.id ? nextUser : item));
    setCurrentUser(nextUser, true);
    setMessage("details", "Account details saved successfully.", "success");
  };

  const sendRecoveryCode = () => {
    const user = getUsers().find((item) => String(item.email || "").toLowerCase() === recovery.email.toLowerCase());
    if (!user) {
      setMessage("recovery", "This email address is not registered.", "error");
      return;
    }

    setRecovery((current) => ({ ...current, generated: `SW-RESET-${Math.floor(10 + Math.random() * 90)}` }));
    setMessage("recovery", "");
  };

  const applyRecovery = () => {
    if (recovery.code !== recovery.generated) {
      setMessage("recovery", "Invalid verification key.", "error");
      return;
    }

    saveUsers(getUsers().map((item) => (
      String(item.email || "").toLowerCase() === recovery.email.toLowerCase()
        ? { ...item, password: recovery.password }
        : item
    )));
    setRecovery({ open: false, email: "", code: "", generated: "", password: "" });
    setMessage("login", "Password reset successful. Please log in.", "success");
  };

  return (
    <div className="account-page">
      <div className="container">
        {!currentUser ? (
          <div className="account-card">
            <div className="account-title">My Account</div>
            <div className="account-sub">Sign in to track orders, manage addresses, update details and view your wishlist.</div>
            <div className="split-auth">
              <div>
                <h3 style={{ fontFamily: "Outfit, sans-serif", marginBottom: 16 }}>Login</h3>
                <form className="account-form" onSubmit={handleLogin}>
                  <div className="account-field">
                    <label>Username or email address</label>
                    <input value={login.identity} onChange={(event) => setLogin((current) => ({ ...current, identity: event.target.value }))} required />
                  </div>
                  <div className="account-field">
                    <label>Password</label>
                    <input type="password" value={login.password} onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))} required />
                  </div>
                  <div className="account-actions">
                    <button className="btn btn-primary" type="submit">Log In</button>
                    <label className="remember-inline">
                      <input type="checkbox" checked={login.remember} onChange={(event) => setLogin((current) => ({ ...current, remember: event.target.checked }))} />
                      Remember me
                    </label>
                    <button type="button" className="link-button" onClick={() => setRecovery((current) => ({ ...current, open: true }))}>Lost your password?</button>
                  </div>
                  <div className={`account-msg ${messages.login?.type || ""}`}>{messages.login?.text || ""}</div>
                </form>
              </div>
              <div>
                <h3 style={{ fontFamily: "Outfit, sans-serif", marginBottom: 16 }}>Register</h3>
                <form className="account-form" onSubmit={handleRegister}>
                  <div className="account-field">
                    <label>Full name</label>
                    <input value={register.name} onChange={(event) => setRegister((current) => ({ ...current, name: event.target.value }))} required />
                  </div>
                  <div className="account-field">
                    <label>Phone number</label>
                    <input value={register.phone} onChange={(event) => setRegister((current) => ({ ...current, phone: event.target.value }))} required />
                  </div>
                  <div className="account-field">
                    <label>Email address</label>
                    <input type="email" value={register.email} onChange={(event) => setRegister((current) => ({ ...current, email: event.target.value }))} required />
                  </div>
                  <div className="account-field">
                    <label>Password</label>
                    <input type="password" value={register.password} onChange={(event) => setRegister((current) => ({ ...current, password: event.target.value }))} required />
                  </div>
                  <div className="account-actions">
                    <button className="btn btn-primary" type="submit">Create Account</button>
                  </div>
                  <div className={`account-msg ${messages.register?.type || ""}`}>{messages.register?.text || ""}</div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="account-grid">
            <aside className="account-menu">
              <h3>My Account</h3>
              {["dashboard", "orders", "downloads", "addresses", "details", "wishlist"].map((tab) => (
                <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
                  {tab === "details" ? "Account details" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              <button onClick={() => setCurrentUser(null)}>Logout</button>
            </aside>
            <main className="account-content">
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
                  <h2 className="account-title" style={{ fontSize: 28 }}>Orders</h2>
                  {orders.length ? (
                    <table className="account-table">
                      <thead>
                        <tr><th>Order</th><th>Date</th><th>Status</th><th>Payment</th><th>Total</th><th>Items</th></tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>{new Date(order.created_at).toLocaleDateString()}</td>
                            <td><span className={`status-pill ${String(order.status || "processing").toLowerCase().replace(/\s+/g, "-")}`}>{order.status}</span></td>
                            <td>{order.payment_method}</td>
                            <td>{formatPrice(order.total || 0)}</td>
                            <td>{(order.items || []).map((item) => `${item.name} x ${item.qty}`).join(", ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <div className="empty-state">No orders found for this account yet.</div>}
                </section>
              ) : null}
              {activeTab === "downloads" ? <section className="account-section active"><h2 className="account-title" style={{ fontSize: 28 }}>Downloads</h2><div className="empty-state">No downloadable products are available yet.</div></section> : null}
              {activeTab === "addresses" ? (
                <section className="account-section active">
                  <h2 className="account-title" style={{ fontSize: 28 }}>Addresses</h2>
                  <form className="account-form" onSubmit={saveAddresses}>
                    <div className="detail-grid">
                      <div className="account-field"><label>Billing address</label><textarea rows="5" value={profile.billingAddress} onChange={(event) => setProfile((current) => ({ ...current, billingAddress: event.target.value }))} /></div>
                      <div className="account-field"><label>Shipping address</label><textarea rows="5" value={profile.shippingAddress} onChange={(event) => setProfile((current) => ({ ...current, shippingAddress: event.target.value }))} /></div>
                    </div>
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
                      <div className="account-field"><label>New password</label><input type="password" value={profile.password} onChange={(event) => setProfile((current) => ({ ...current, password: event.target.value }))} placeholder="Leave blank to keep current password" /></div>
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
                            <a className="btn btn-primary" href={`product.html?id=${product.id}`}>View</a>
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
            <button className="account-modal-close" onClick={() => setRecovery({ open: false, email: "", code: "", generated: "", password: "" })}>x</button>
            <h3>Lost Password Recovery</h3>
            <p>Enter your registered email address to reset your password.</p>
            <div className="account-form">
              <div className="account-field">
                <label>Registered Email address</label>
                <input type="email" value={recovery.email} onChange={(event) => setRecovery((current) => ({ ...current, email: event.target.value }))} />
              </div>
              {!recovery.generated ? (
                <button className="btn btn-primary" onClick={sendRecoveryCode}>Send Reset Code</button>
              ) : (
                <>
                  <p className="recovery-code-preview">Demo Verification Key: <strong>{recovery.generated}</strong></p>
                  <div className="account-field">
                    <label>Enter Demo Verification Key</label>
                    <input value={recovery.code} onChange={(event) => setRecovery((current) => ({ ...current, code: event.target.value }))} />
                  </div>
                  <div className="account-field">
                    <label>Choose New Password</label>
                    <input type="password" value={recovery.password} onChange={(event) => setRecovery((current) => ({ ...current, password: event.target.value }))} />
                  </div>
                  <button className="btn btn-primary" onClick={applyRecovery}>Reset Password</button>
                </>
              )}
              <div className={`account-msg ${messages.recovery?.type || ""}`}>{messages.recovery?.text || ""}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
