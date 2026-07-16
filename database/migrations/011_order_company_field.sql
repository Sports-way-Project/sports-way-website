-- ============================================================
-- Migration 011 — company column on orders
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-07-14
-- Reason: The checkout form has always captured a "Company" field
--         (billing.company) but createOrder() never included it in the
--         insert payload and the table never had a column for it — same
--         class of bug as the shipping address before migration 004.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS company text NOT NULL DEFAULT '';
