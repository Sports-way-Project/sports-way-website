-- ============================================================
-- Migration 009 — Fix checkout RPCs to bypass RLS correctly
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-07-14
-- Reason: `next_order_number()` (migration 005) and `increment_coupon_usage()`
--         (migration 003) were both created without SECURITY DEFINER, so
--         they run with the CALLING user's privileges (anon/customer) —
--         not the function owner's. Once RLS was enabled on `order_sequences`
--         and tightened on `coupons` (migrations 006/007), any customer
--         placing an order or applying a coupon at checkout started hitting
--         "new row violates row-level security policy" / silent update
--         failures, because a plain customer has no write policy on either
--         table. These two RPCs are exactly the kind of thing that SHOULD
--         run with elevated privileges regardless of caller — they're
--         narrow, atomic, and don't leak anything the caller couldn't
--         already do through the normal checkout flow.
-- ============================================================

CREATE OR REPLACE FUNCTION public.next_order_number(p_yearmonth text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_code text, p_user_key text)
RETURNS public.coupons
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Belt-and-suspenders: also make sure RLS is actually enabled on
-- order_sequences (it's an internal counter table, never queried directly
-- by the client — only through the SECURITY DEFINER function above — so a
-- lockdown-everything policy is correct and never blocks legitimate use).
ALTER TABLE public.order_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_sequences_no_direct_access" ON public.order_sequences;
CREATE POLICY "order_sequences_no_direct_access" ON public.order_sequences
  FOR ALL USING (false) WITH CHECK (false);
