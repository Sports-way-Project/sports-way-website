-- ============================================================
-- Migration 012 — billing_details column on orders
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-07-14
-- Reason: The checkout form collects first/last name, company, phone,
--         email, address1/2, city, state (zone), zip, and country — but
--         orders.address was only ever a single concatenated string built
--         from address1 + address2 + city + a HARDCODED "Qatar", silently
--         dropping the zone and zip the customer actually typed. This adds
--         a structured `billing_details` jsonb column (same shape as
--         profiles.billing_address) so every field the customer enters is
--         preserved exactly, whether they're logged in or checking out as
--         a guest — the `address` text column stays as-is for quick
--         display, this is the full-fidelity backup of it.
-- ============================================================



ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS billing_details jsonb DEFAULT NULL;

