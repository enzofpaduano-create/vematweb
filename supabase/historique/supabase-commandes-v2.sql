-- ─────────────────────────────────────────────────────────────────────────────
-- Vemat Commandes v2 — Migration SQL
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add payment tracking columns to devis_requests
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS payment_date       DATE;
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS payment_proof_url  TEXT;

-- 2. Add delivery & BL tracking columns to devis_requests
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS bl_url             TEXT;
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS delivery_date      DATE;
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS carrier            TEXT;
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS tracking_number    TEXT;

-- 3. Link form_devis to the devis_request it was converted into
ALTER TABLE form_devis ADD COLUMN IF NOT EXISTS converted_to_order_id UUID REFERENCES devis_requests(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Make the "quotes" storage bucket public so payment proofs and BL photos
--    can be viewed via direct URL (required by the AdminCommandeDetail UI).
--    Run in SQL Editor:
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('quotes', 'quotes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users (vemat admin) to upload to quotes bucket
DROP POLICY IF EXISTS "auth users can upload quotes" ON storage.objects;
CREATE POLICY "auth users can upload quotes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'quotes');

-- Allow authenticated users to read from quotes bucket
DROP POLICY IF EXISTS "auth users can read quotes" ON storage.objects;
CREATE POLICY "auth users can read quotes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'quotes');

-- Allow public read so direct URLs for BL/payment proofs work
DROP POLICY IF EXISTS "public read quotes" ON storage.objects;
CREATE POLICY "public read quotes"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'quotes');

-- Add cart_items JSON column to form_devis (stores individual cart items with sku, title, brand, quantity)
ALTER TABLE form_devis ADD COLUMN IF NOT EXISTS cart_items JSONB DEFAULT NULL;

-- Add converted_to_repair_id to form_interventions (if not exists)
ALTER TABLE form_interventions ADD COLUMN IF NOT EXISTS converted_to_repair_id UUID REFERENCES repair_requests(id) ON DELETE SET NULL;
