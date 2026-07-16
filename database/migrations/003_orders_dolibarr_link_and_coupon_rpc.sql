-- ============================================================
-- Migration 003 — Dolibarr link columns on orders + atomic coupon usage
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-07-11
-- Reason:
--   1) Orders should carry a place to record the Dolibarr order/invoice ID
--      once an order is later pushed into Dolibarr for fulfillment. Each
--      order's `items` JSON already stores each line's website product id
--      (productId) and Dolibarr product id/ref (dolibarrId/dolibarrRef) —
--      these two new columns are for the order-level Dolibarr document,
--      which doesn't exist yet.
--   2) `recordCouponUsage` used to read `used_count`, add 1, and write it
--      back — two concurrent checkouts using the same limited coupon could
--      both read the same count and both succeed past the limit. This RPC
--      does the read-check-increment in a single atomic statement instead.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS dolibarr_order_id text DEFAULT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS dolibarr_invoice_id text DEFAULT NULL;

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_code text, p_user_key text)
RETURNS public.coupons
LANGUAGE plpgsql
AS $$
DECLARE
  updated_row public.coupons;
BEGIN
  UPDATE public.coupons
  SET
    used_count = used_count + 1,
    user_uses = CASE
      WHEN p_user_key IS NOT NULL THEN
        jsonb_set(
          user_uses,
          ARRAY[p_user_key],
          to_jsonb(COALESCE((user_uses ->> p_user_key)::int, 0) + 1)
        )
      ELSE user_uses
    END,
    updated_at = now()
  WHERE
    code = upper(p_code)
    AND active = true
    AND (limit_per_coupon IS NULL OR used_count < limit_per_coupon)
    AND (
      p_user_key IS NULL
      OR limit_per_user IS NULL
      OR COALESCE((user_uses ->> p_user_key)::int, 0) < limit_per_user
    )
  RETURNING * INTO updated_row;

  RETURN updated_row; -- NULL means the coupon was no longer valid (limit hit, inactive, etc.)
END;
$$;
