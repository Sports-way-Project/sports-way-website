# Database Updates Log

## How to apply migrations

Go to **Supabase Dashboard → SQL Editor**, paste the SQL, click **Run**.

---

## Migration 001 — `dolibarr_ref` column on `products` (2026-07-04)

**File:** `migrations/001_add_dolibarr_ref_to_products.sql`

**Status:** ⏳ Pending — needs to be applied

**What it does:**
- Adds `dolibarr_ref TEXT NULL` to `public.products`
- Adds a partial unique index (two products cannot share the same Dolibarr ref)
- Adds a regular index for fast sync queries by ref

**Why:**
The admin product wizard (Edit / Add Product → Step 3 "Dolibarr Link") lets the admin
enter a Dolibarr product reference. Without this column, the value is saved in the UI
state but silently dropped when writing to Supabase.

**Impact on existing data:** None — column is nullable, all existing rows get `NULL`.

**Code changes applied alongside:**
- `src/lib/storefrontApi.js` → `mapProductFromRow` now reads `row.dolibarr_ref`
- `src/lib/storefrontApi.js` → `mapProductToRow` now writes `product.dolibarr_ref`

---

## Migration 003 — `dolibarr_order_id`/`dolibarr_invoice_id` on `orders` + atomic coupon usage (2026-07-11)

**File:** `migrations/003_orders_dolibarr_link_and_coupon_rpc.sql`

**Status:** ⏳ Pending — needs to be applied

**What it does:**
- Adds `dolibarr_order_id text` and `dolibarr_invoice_id text` to `public.orders`, for when an order is later pushed into Dolibarr for fulfillment. Each order's `items` JSON already carries each line's `productId` (website) and `dolibarrId`/`dolibarrRef` (Dolibarr product) — added via `buildCartItem` in `src/lib/storefront.js`.
- Adds `increment_coupon_usage(p_code, p_user_key)` — an atomic read-check-increment used to fix a race condition where two concurrent checkouts using the same limited coupon could both read the same `used_count` and both succeed past the limit.

**Code changes applied alongside:**
- `src/lib/storefrontApi.js` → `recordCouponUsage` now calls `supabase.rpc("increment_coupon_usage", ...)` instead of a plain update.
- `src/pages/CheckoutPage.jsx` → drops the discount and re-totals if the RPC reports the coupon is no longer valid (limit hit concurrently) instead of blocking the order.

---

## Migration 004 — `address` column on `orders` (2026-07-12)

**File:** `migrations/004_add_address_to_orders.sql`

**Status:** ⏳ Pending — needs to be applied

**What it does:** Adds `address text NOT NULL DEFAULT ''` to `public.orders`.

**Why:** `CheckoutPage.jsx` builds a shipping `address` string for every order, but `createOrder()` never included it in the insert payload and the table never had a column for it — the address the customer typed at checkout was silently discarded on every single order. Needed so the Dolibarr website-orders module (and anyone fulfilling orders) can see where to ship.

**Code changes applied alongside:**
- `src/lib/storefrontApi.js` → `createOrder` now includes `address` in the insert payload; `mapOrderFromRow` now reads it back.

---

## Migration 006 — RLS + role hardening + superadmin (2026-07-13)

**File:** `migrations/006_role_security.sql`

**Status:** ⏳ Pending — needs to be applied

**What it does:**
- Enables Row Level Security on `profiles`, `orders`, `cart_items`, `wishlist_items`, `coupons` (none of these tables had any RLS policy at all before this).
- Adds a `BEFORE UPDATE` trigger on `profiles` that blocks any change to `role` unless the request uses the service-role key — closes off client-side role self-promotion entirely.
- Adds `'superadmin'` to the allowed `profiles.role` values.
- Gives admins a real `DELETE` policy on `orders` (previously missing — the admin order-delete button in the dashboard was silently failing because of this).

**Why:** Audit found `promoteProfileToAdmin()` ran from the browser with the anon key whenever a signed-in email matched a hardcoded list — with no RLS backing it up, any user could self-promote to admin via devtools.

**Code changes applied alongside:**
- `src/lib/supabase.js` / `src/lib/storefrontApi.js` / `src/hooks/useAccount.js` — removed the `SUPABASE_ADMIN_EMAILS` bootstrap and `promoteProfileToAdmin()` entirely. There is no self-service path to admin/superadmin anymore — see the manual bootstrap step inside the migration file.
- `backend/app/routers/admin.py` — new superadmin-only endpoints to manage admin accounts going forward.

---

## Migration 007 — Superadmin-only deletes + lock down products/site_settings (2026-07-13)

**File:** `migrations/007_superadmin_delete_only.sql`

**Status:** ⏳ Pending — needs to be applied

**What it does:**
- Adds `is_sw_superadmin()` helper and tightens `orders`/`coupons` `DELETE` policies to superadmin-only (matches the frontend's `requireSuperAdmin()` guard added the same session).
- Enables RLS on `products` and `site_settings` — neither had any RLS at all before this, meaning any anon-key holder could write/delete them directly.

**Code changes applied alongside:** `AdminPage.jsx`'s `requireSuperAdmin()` guard on every delete handler; delete buttons hidden for non-superadmins in Orders/Customers.

---

## Migration 008 — Storage bucket policies for product-images (2026-07-14)

**File:** `migrations/008_storage_policies.sql`

**Status:** ⏳ Pending — needs to be applied

**What it does:** Adds an admin-write policy on `storage.objects` for the `product-images` bucket covering every folder, plus a public-read policy.

**Why:** Uploading a client/partner logo failed with "new row violates row-level security policy" — the existing storage policy only allowed writes under the `products/` path prefix, so `clients/`, `partners/`, and `blogs/` uploads were silently rejected by Storage's RLS (separate from the `public` schema's RLS).

---

## Migration 009 — Fix checkout RPCs to bypass RLS correctly (2026-07-14)

**File:** `migrations/009_fix_rpc_security_definer.sql`

**Status:** ⏳ Pending — needs to be applied

**What it does:** Adds `SECURITY DEFINER` (+ a locked `search_path`) to `next_order_number()` and `increment_coupon_usage()`, and enables RLS on `order_sequences` with a deny-all policy for direct client access (the function still works since `SECURITY DEFINER` runs as the function owner, bypassing RLS).

**Why:** Both RPCs ran with the *caller's* privileges by default. Once RLS was enabled/tightened in migrations 006/007, a plain customer placing an order got "new row violates row-level security policy for table order_sequences" — and applying a coupon would have hit the identical wall against `coupons`, since that table's `UPDATE` policy is admin-only. This is a real regression from 006/007 that needed fixing before customers could check out at all.

---

## Migration 010 — payment_reference column on orders (2026-07-14)

**File:** `migrations/010_order_payment_reference.sql`

**Status:** ⏳ Pending — needs to be applied

**What it does:** Adds `payment_reference text` to `public.orders`.

**Why:** Bank-transfer orders sit at "Pending Payment" until an admin confirms the transfer against the bank statement — there was nowhere to record the customer-provided reference/receipt number to make that matching easy. Also reserves a home for a card gateway's transaction ID once a real payment gateway is integrated.

**Code changes applied alongside:** `CheckoutPage.jsx` — optional "Transfer reference / receipt number" field shown only for Bank Transfer; `storefrontApi.js` — `createOrder`/`mapOrderFromRow` read/write it; `AdminOrders.jsx` — shown in the expanded order detail panel.

---

## Migration 011 — company column on orders (2026-07-14)

**File:** `migrations/011_order_company_field.sql`

**Status:** ⏳ Pending — needs to be applied

**What it does:** Adds `company text NOT NULL DEFAULT ''` to `public.orders`.

**Why:** The checkout form has always captured a "Company" billing field but `createOrder()` never included it in the insert payload — same class of bug as the shipping address before migration 004. Found while building the new order detail modal, which needed a real place to show it.

**Code changes applied alongside:** `CheckoutPage.jsx`, `storefrontApi.js` (`createOrder`/`mapOrderFromRow`), and the new `AdminOrderModal.jsx`.

---

## Migration 012 — billing_details column on orders (2026-07-14)

**File:** `migrations/012_order_billing_details.sql`

**Status:** ⏳ Pending — needs to be applied

**What it does:** Adds `billing_details jsonb` to `public.orders` — a full structured copy of every field the checkout form collects (first/last name, company, phone, email, address1/2, city, zone, zip, country), same shape as `profiles.billing_address`.

**Why:** `orders.address` was only ever a concatenated string built from address1 + address2 + city + a **hardcoded "Qatar"** — silently dropping the zone/zip the customer actually typed and ignoring their real country. Applies to guests and logged-in customers alike (a logged-in customer's saved profile address can change after the order was placed, so the order needs its own frozen copy, not a live reference to the profile).

**Code changes applied alongside:** `CheckoutPage.jsx` (fixed the address string too — now includes zone/zip/country properly instead of hardcoding "Qatar"), `storefrontApi.js`, `AdminOrderModal.jsx` (shows the full structured address when present).

---

## Migration 013 — `seen` flag on orders (2026-07-17)

**File:** `migrations/013_order_seen_flag.sql`

**Status:** ⏳ Pending — needs to be applied

**What it does:** Adds `seen boolean NOT NULL DEFAULT false` to `public.orders`.

**Why:** The admin panel's "new order" badge/sound/highlight only ever relied on an in-memory Set (wiped on every page reload) plus one blanket "last viewed orders" localStorage timestamp that only updated on navigating into the Orders section — not when an admin actually opened a specific order. After being away and reloading, already-opened orders got re-flagged as new. This makes "seen" a real per-order fact in the database, set the moment the order's modal is opened, instead of a client-side heuristic.

**Code changes applied alongside:** `storefrontApi.js` (`markOrderSeen`, `mapOrderFromRow` includes `seen`), `AdminPage.jsx` (badge/highlight now derived directly from `orders.filter(o => !o.seen)` instead of the old Set/localStorage logic), `AdminOrders.jsx`/`AdminDashboard.jsx` (mark seen on open).

---

## Product slug bug fix + SEO meta defaults (2026-07-17, no migration needed)

**No new columns.** Meta title/description are derived on the fly from existing `name`/`short_desc`/`description` (see `effectiveMetaTitle`/`effectiveMetaDescription` in `lib/format.js`) rather than stored separately — a `meta_title`/`meta_description` migration was drafted and then deliberately dropped in favor of this simpler approach.

**Real bug fixed:** `mapProductToRow` in `storefrontApi.js` never included `slug` in its payload, so every product save silently dropped the slug — meaning product URLs were falling back to the raw numeric id (`/products/12345`) instead of an SEO-friendly slug for effectively every product. Fixed, with auto-generated slugs now suffixed with the product id to avoid unique-constraint collisions now that slug is actually being persisted.

**Code changes:** `storefrontApi.js` (`mapProductToRow` now sends `slug`), `lib/format.js` (`effectiveMetaTitle`/`effectiveMetaDescription` helpers), `AdminProductEdit.jsx`/`AdminPage.jsx` (id-suffixed auto-slug), `ProductPage.jsx` (`<SEO>` uses the derived title/description).

---

## Future migrations (not yet needed)

### 009 — `payments` table
Will be needed when a real payment gateway (Fatora, QPay, etc.) is integrated.
Currently payment method is just a text field on `orders`.

```sql
CREATE TABLE public.payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      text NOT NULL REFERENCES public.orders(order_id),
  gateway       text NOT NULL,           -- 'fatora' | 'qpay' | 'skipcash'
  gateway_ref   text,                    -- gateway transaction ID
  amount        numeric NOT NULL,
  currency      text NOT NULL DEFAULT 'QAR',
  status        text NOT NULL DEFAULT 'pending',  -- pending | paid | failed | refunded
  paid_at       timestamp with time zone,
  created_at    timestamp with time zone DEFAULT now()
);
```

### 010 — `dolibarr_sync_log` table (for Phase 1 stock sync)
Tracks when each product was last synced from Dolibarr.

```sql
CREATE TABLE public.dolibarr_sync_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   bigint REFERENCES public.products(id),
  dolibarr_ref text,
  synced_at    timestamp with time zone DEFAULT now(),
  stock_count  integer,
  price        numeric,
  status       text     -- 'ok' | 'not_found' | 'error'
);
```
