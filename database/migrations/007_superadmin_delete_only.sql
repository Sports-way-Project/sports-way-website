-- ============================================================
-- Migration 007 — Superadmin-only deletes + lock down products/site_settings
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-07-13
-- Reason: (1) Regular admins should keep full create/edit access everywhere
--         but destructive/hard-to-undo actions (deleting products, orders,
--         customer accounts, brands/categories, coupons, blog posts,
--         clients/partners) are now superadmin-only in the frontend
--         (AdminPage.jsx's requireSuperAdmin() guard) — this migration adds
--         the matching DB-level enforcement so it can't be bypassed by a
--         tampered frontend build or a direct Supabase call.
--         (2) While auditing this, found that `products` and
--         `site_settings` (brands/categories/clients/partners/blogs/
--         coupons' sibling config table) had NO RLS at all — enabled by
--         migration 006 for profiles/orders/cart_items/wishlist_items/
--         coupons but never for these two, meaning any anon-key holder
--         could write or delete them directly. Closing that here too.
-- ============================================================

-- 1. Superadmin-only helper (separate from migration 006's is_sw_admin,
--    which allows both admin and superadmin).
CREATE OR REPLACE FUNCTION public.is_sw_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

-- 2. Tighten orders: DELETE now requires superadmin, not just any admin.
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
CREATE POLICY "orders_delete_superadmin" ON public.orders
  FOR DELETE USING (public.is_sw_superadmin());

-- 3. Tighten coupons: DELETE now requires superadmin. Admin write access
--    (create/edit coupons) is unaffected — "coupons_write_admin" from
--    migration 006 already covers INSERT/UPDATE/DELETE via FOR ALL, so
--    split it into three explicit policies to carve DELETE out.
DROP POLICY IF EXISTS "coupons_write_admin" ON public.coupons;
CREATE POLICY "coupons_insert_admin" ON public.coupons
  FOR INSERT WITH CHECK (public.is_sw_admin());
CREATE POLICY "coupons_update_admin" ON public.coupons
  FOR UPDATE USING (public.is_sw_admin());
CREATE POLICY "coupons_delete_superadmin" ON public.coupons
  FOR DELETE USING (public.is_sw_superadmin());

-- 4. products — no RLS existed at all before this. Storefront needs public
--    read access; only admins may create/edit; only superadmins may delete.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_all" ON public.products;
CREATE POLICY "products_select_all" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin" ON public.products
  FOR INSERT WITH CHECK (public.is_sw_admin());

DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin" ON public.products
  FOR UPDATE USING (public.is_sw_admin());

DROP POLICY IF EXISTS "products_delete_superadmin" ON public.products;
CREATE POLICY "products_delete_superadmin" ON public.products
  FOR DELETE USING (public.is_sw_superadmin());

-- 5. site_settings — same gap: holds brands/custom_categories/site_clients/
--    site_partners/site_blogs/hidden_categories/etc, all read by the public
--    storefront (e.g. to filter hidden categories) but should only be
--    written by admins. Deletes (removing a brand/blog/client/partner row)
--    are superadmin-only, matching the frontend guard.
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_select_all" ON public.site_settings;
CREATE POLICY "site_settings_select_all" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_settings_insert_admin" ON public.site_settings;
CREATE POLICY "site_settings_insert_admin" ON public.site_settings
  FOR INSERT WITH CHECK (public.is_sw_admin());

DROP POLICY IF EXISTS "site_settings_update_admin" ON public.site_settings;
CREATE POLICY "site_settings_update_admin" ON public.site_settings
  FOR UPDATE USING (public.is_sw_admin());

DROP POLICY IF EXISTS "site_settings_delete_superadmin" ON public.site_settings;
CREATE POLICY "site_settings_delete_superadmin" ON public.site_settings
  FOR DELETE USING (public.is_sw_superadmin());
