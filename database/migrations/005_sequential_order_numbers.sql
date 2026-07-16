-- ============================================================
-- Migration 005 — Sequential order numbers (SWWO-YYMM#####)
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-07-13
-- Reason: Order IDs were a time+random string (e.g. SW-MRIGQZ6HFDEW) — not
--         human-friendly for staff reading them off a Dolibarr screen or a
--         WhatsApp notification. Switching to a per-month atomic sequence
--         (SWWO-260700001, SWWO-260700002, ...) instead. The function does the
--         read-increment atomically, same pattern as increment_coupon_usage
--         in migration 003, so two simultaneous checkouts can't collide.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_sequences (
  yearmonth text PRIMARY KEY,
  last_value integer NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.next_order_number(p_yearmonth text)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  next_val integer;
BEGIN
  INSERT INTO public.order_sequences (yearmonth, last_value)
  VALUES (p_yearmonth, 1)
  ON CONFLICT (yearmonth) DO UPDATE SET last_value = public.order_sequences.last_value + 1
  RETURNING last_value INTO next_val;

  RETURN next_val;
END;
$$;
