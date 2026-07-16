-- ============================================================
-- Migration 008 — Storage bucket policies for product-images
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-07-14
-- Reason: Uploading a client/partner logo failed with "new row violates
--         row-level security policy" (Storage's RLS on storage.objects).
--         Product image uploads worked because an existing policy only
--         allowed writes under the "products/" path prefix — client logos,
--         partner logos, and blog cover images (folders "clients/",
--         "partners/", "blogs/") were never covered. This adds a policy
--         that allows any admin/superadmin to write anywhere in the
--         product-images bucket, and keeps public read access.
-- ============================================================

DROP POLICY IF EXISTS "product_images_select_all" ON storage.objects;
CREATE POLICY "product_images_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_insert_admin" ON storage.objects;
CREATE POLICY "product_images_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_sw_admin());

DROP POLICY IF EXISTS "product_images_update_admin" ON storage.objects;
CREATE POLICY "product_images_update_admin" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND public.is_sw_admin());

DROP POLICY IF EXISTS "product_images_delete_admin" ON storage.objects;
CREATE POLICY "product_images_delete_admin" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND public.is_sw_admin());

-- Note: this ADDS a permissive policy alongside whatever policy already
-- exists on this bucket — Postgres RLS treats multiple permissive policies
-- as OR'd together, so this fixes the gap without needing to know or touch
-- the name of the pre-existing "products/" -only policy.
