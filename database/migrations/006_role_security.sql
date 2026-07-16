-- ============================================================
-- Migration 006 — Row Level Security + role hardening + superadmin
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-07-13
-- Reason: No RLS policies existed anywhere for profiles/orders/cart_items/
--         wishlist_items/coupons. Combined with a client-side
--         promoteProfileToAdmin() call that ran with the anon key, any
--         signed-in user could open devtools and self-promote to admin by
--         calling supabase.from("profiles").update({role:"admin"}) directly.
--         This migration locks that down with a trigger (belt) plus real
--         RLS policies (suspenders), adds "superadmin" as a third role, and
--         gives admins a proper DELETE policy on orders (previously
--         missing, which silently no-op'd the admin order-delete feature).
-- ============================================================

-- 1. Widen the role CHECK constraint to include superadmin.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['customer'::text, 'admin'::text, 'superadmin'::text]));

-- 2. Block role self-service at the trigger level — the one write path
--    (browser, anon key, or authenticated user's own JWT) that must NEVER
--    be able to change `role`, regardless of what RLS policies exist.
--    Only the service-role key (used exclusively server-side, see
--    backend/app/core/supabase_client.py) bypasses this.
CREATE OR REPLACE FUNCTION public.prevent_role_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'role cannot be changed directly; use the admin API';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_update ON public.profiles;
CREATE TRIGGER trg_prevent_role_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_update();

-- 3. Helper used by policies below — SECURITY DEFINER so it can read
--    profiles.role for the *caller* without needing its own RLS grant
--    (avoids infinite recursion if profiles RLS referenced itself).
--    Named is_sw_admin (not is_admin) to avoid colliding with an existing
--    overloaded is_admin() already present in this Supabase project, which
--    made Postgres unable to pick a candidate ("function is_admin() is not
--    unique") when this migration first ran.
CREATE OR REPLACE FUNCTION public.is_sw_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$;

-- 4. Enable RLS.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- profiles: own row, plus admins can read everyone's (needed for the
-- Customers/Manage Admins admin screens).
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_sw_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- orders: own rows, plus admins get full access including the DELETE that
-- was previously missing entirely.
DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
CREATE POLICY "orders_select_own_or_admin" ON public.orders
  FOR SELECT USING (user_id = auth.uid() OR public.is_sw_admin());

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "orders_update_own_or_admin" ON public.orders;
CREATE POLICY "orders_update_own_or_admin" ON public.orders
  FOR UPDATE USING (user_id = auth.uid() OR public.is_sw_admin());

DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
CREATE POLICY "orders_delete_admin" ON public.orders
  FOR DELETE USING (public.is_sw_admin());

-- cart_items / wishlist_items: strictly own rows (admins don't need to
-- browse other people's carts today).
DROP POLICY IF EXISTS "cart_items_own" ON public.cart_items;
CREATE POLICY "cart_items_own" ON public.cart_items
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wishlist_items_own" ON public.wishlist_items;
CREATE POLICY "wishlist_items_own" ON public.wishlist_items
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- coupons: everyone (including anonymous/guest checkout) may read active
-- coupons to validate a code; only admins may write.
DROP POLICY IF EXISTS "coupons_select_all" ON public.coupons;
CREATE POLICY "coupons_select_all" ON public.coupons
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "coupons_write_admin" ON public.coupons;
CREATE POLICY "coupons_write_admin" ON public.coupons
  FOR ALL USING (public.is_sw_admin()) WITH CHECK (public.is_sw_admin());

-- ============================================================
-- MANUAL STEP (not run by this script): after applying this migration,
-- promote your own account to superadmin once, e.g.:
--   UPDATE public.profiles SET role = 'superadmin' WHERE email = 'you@example.com';
-- This is a one-time bootstrap — there is no self-service path to admin/
-- superadmin in the app anymore (see removal of promoteProfileToAdmin()).
-- ============================================================

