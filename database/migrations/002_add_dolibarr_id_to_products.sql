-- ============================================================
-- Migration 002 — Add dolibarr_id to products table
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-07-04
-- Reason: The FastAPI backend links/looks up Dolibarr products by their
--         numeric rowid (dolibarr_id), not just the ref text. This is what
--         the live stock and admin-link endpoints key off.
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS dolibarr_id integer DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_dolibarr_id_unique
  ON public.products (dolibarr_id)
  WHERE dolibarr_id IS NOT NULL;
