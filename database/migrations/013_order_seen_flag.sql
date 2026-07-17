-- ============================================================
-- Migration 013 — seen flag on orders
-- Run this in: Supabase Dashboard → SQL Editor
-- Reason: "New order" detection in the admin panel only ever used an
--         in-memory Set (wiped on every page reload) plus a single blanket
--         "last viewed orders" localStorage timestamp that only updated when
--         navigating INTO the Orders section — not when an admin actually
--         opened a specific order. Result: after being away and reloading,
--         already-opened orders got re-flagged as new (sound + badge) since
--         there was no durable, per-order record of what had actually been
--         viewed. This adds a real `seen` column, set to true the moment an
--         admin opens that order's modal, so "new" is a persisted per-order
--         fact instead of a client-side heuristic that resets on reload.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS seen boolean NOT NULL DEFAULT false;
