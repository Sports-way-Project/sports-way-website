function readWindowValue(key, fallback) {
  if (typeof window === "undefined") return fallback;
  return window[key] || fallback;
}

export const FASTAPI_URL = readWindowValue("FASTAPI_URL", "http://localhost:8010");

async function request(path, options) {
  const res = await fetch(`${FASTAPI_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FastAPI ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export function searchDolibarrProducts(query) {
  return request(`/products/search?q=${encodeURIComponent(query)}`);
}

export function getLiveStock(productId, dolibarrId) {
  return request(`/stock/${productId}/${dolibarrId}`);
}

export function listAllDolibarrProducts() {
  return request(`/products/dolibarr/all`);
}

export function getDolibarrProductPhotoCount(dolibarrId) {
  return request(`/products/${dolibarrId}/photos`);
}

export async function fetchDolibarrProductPhotoBlob(dolibarrId, index) {
  const res = await fetch(`${FASTAPI_URL}/products/${dolibarrId}/photo?index=${index}`);
  if (!res.ok) throw new Error(`FastAPI ${res.status}: failed to fetch photo`);
  return res.blob();
}

export function sendWebsiteChatMessage(message) {
  return request("/chat/website", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// Fire-and-forget from the caller's point of view — the backend holds the
// Infobip/FormSubmit credentials now, instead of shipping an API key in the
// frontend bundle the way this used to work.
export function sendOrderNotification(order) {
  return request("/notifications/order-placed", {
    method: "POST",
    body: JSON.stringify({
      id: order.id,
      customer_name: order.customer_name,
      email: order.email,
      phone: order.phone,
      status: order.status,
      payment_method: order.payment_method,
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      coupon_code: order.coupon_code,
      notes: order.notes,
      items: (order.items || []).map((item) => ({ name: item.name, qty: item.qty, price: item.price })),
    }),
  });
}

// Actually deletes the Supabase Auth account (not just the profile row) —
// requires the calling admin's own access token so the backend can verify
// they're really an admin before using its service-role key. See
// backend/app/routers/admin.py.
export async function deleteUserAccount(userId, accessToken) {
  const res = await fetch(`${FASTAPI_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FastAPI ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// Superadmin-only — returns the backend's current .env Dolibarr values, used
// to pre-fill AdminIntegrationSettings instead of leaving it blank.
export async function fetchIntegrationDefaults(accessToken) {
  const res = await fetch(`${FASTAPI_URL}/admin/integration-settings/defaults`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FastAPI ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// Superadmin-only — see backend/app/routers/admin.py's _require_superadmin.
export async function listAdmins(accessToken) {
  const res = await fetch(`${FASTAPI_URL}/admin/admins`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FastAPI ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export async function updateAdminRole(userId, role, accessToken) {
  const res = await fetch(`${FASTAPI_URL}/admin/admins/${userId}/role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FastAPI ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// Creates a brand-new admin account directly (not a promotion of an
// existing customer) — superadmin-only, see backend/app/routers/admin.py.
export async function createAdmin({ email, password, name, role }, accessToken) {
  const res = await fetch(`${FASTAPI_URL}/admin/admins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email, password, name, role }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FastAPI ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// Which Dolibarr PDFs (order/invoice) exist for this website order —
// see backend/app/routers/orders.py's list_documents.
export async function listOrderDocuments(orderId, accessToken) {
  const res = await fetch(`${FASTAPI_URL}/orders/${orderId}/documents`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FastAPI ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// Opens a Dolibarr PDF (order/invoice) in a new tab. Requires the admin's
// access token, so this can't just be a plain <a href> — fetch as a blob
// and open that instead.
export async function openOrderDocument(orderId, kind, accessToken) {
  const res = await fetch(`${FASTAPI_URL}/orders/${orderId}/documents/${kind}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let message = body;
    try { message = JSON.parse(body).detail || body; } catch { /* not json */ }
    throw new Error(message || res.statusText);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
