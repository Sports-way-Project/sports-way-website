-- ============================================================
-- Migration 004 — Add address to orders table
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-07-12
-- Reason: CheckoutPage.jsx builds a shipping `address` string for every
--         order, but createOrder() never included it in the insert payload
--         and the orders table never had a column for it — the address the
--         customer typed at checkout was silently discarded. This is
--         required for the Dolibarr website-orders module to know where to
--         ship anything.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';
