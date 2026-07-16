-- ============================================================
-- Migration 001 — Add dolibarr_ref to products table
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-07-04
-- Reason: Links each product to its Dolibarr ERP reference,
--         enabling real-time stock/price sync in Phase 1.
-- ============================================================

-- 1. Add the column (nullable — existing products are not linked yet)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS dolibarr_ref text DEFAULT NULL;

-- 2. Add a unique constraint (allows NULLs — only enforces uniqueness on non-null values)
--    This prevents two products being linked to the same Dolibarr product by accident.
CREATE UNIQUE INDEX IF NOT EXISTS products_dolibarr_ref_unique
  ON public.products (dolibarr_ref)
  WHERE dolibarr_ref IS NOT NULL;

-- 3. Add an index for fast lookups when syncing stock by ref
CREATE INDEX IF NOT EXISTS products_dolibarr_ref_idx
  ON public.products (dolibarr_ref);

-- ============================================================
-- Verify
-- ============================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'products' AND column_name = 'dolibarr_ref';
