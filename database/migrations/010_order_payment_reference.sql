-- ============================================================
-- Migration 010 — payment_reference column on orders
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-07-14
-- Reason: `orders.payment_method` only ever held a fixed label ("Cash on
--         Delivery" / "Direct Bank Transfer"). There was nowhere to record
--         payment-specific detail — a bank transfer reference/receipt note
--         the customer provides at checkout, or later a card gateway's
--         transaction ID once a real payment gateway is integrated. This
--         column holds that free-form reference so admins reviewing a
--         "Pending Payment" bank-transfer order have something to actually
--         match against the bank statement.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_reference text DEFAULT NULL;
