-- ============================================================
-- Migration 014 — seen flag on profiles
-- Run this in: Supabase Dashboard → SQL Editor
-- Reason: The "new user" badge in the admin panel used a single blanket
--         localStorage timestamp ("adminLastViewedUsers") — per-browser, not
--         durable, and reset on a new device/profile. This adds a real
--         `seen` column, set to true once an admin has viewed the Users
--         section, so "new" is a persisted per-user fact instead of a
--         client-side heuristic (mirrors migration 013's orders.seen).
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seen boolean NOT NULL DEFAULT false;

-- Admins need to flip `seen` on OTHER users' rows, not just their own —
-- "profiles_update_own" (migration 006) only allows id = auth.uid(). The
-- prevent_role_self_update trigger still blocks role changes through this
-- policy regardless, so this only ever grants the ability to touch
-- non-role columns like `seen`.
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_sw_admin());
