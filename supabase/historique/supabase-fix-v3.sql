-- ─────────────────────────────────────────────────────────────────────────────
-- Vemat Fix v3
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Rename DG test user profile to Domenico Paduano
--    (updates the profile of whichever user has the vemat_dg role)
UPDATE profiles
SET first_name = 'Domenico', last_name = 'Paduano'
WHERE role = 'vemat_dg';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RLS policies — allow authenticated commercial users to INSERT/UPDATE
--    their own commercial_sales and commercial_meeting_reports
-- ─────────────────────────────────────────────────────────────────────────────

-- commercial_sales: insert
DROP POLICY IF EXISTS "commercial can insert own sales" ON commercial_sales;
CREATE POLICY "commercial can insert own sales"
  ON commercial_sales FOR INSERT TO authenticated
  WITH CHECK (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'vemat_dg')
  );

-- commercial_sales: update
DROP POLICY IF EXISTS "commercial can update own sales" ON commercial_sales;
CREATE POLICY "commercial can update own sales"
  ON commercial_sales FOR UPDATE TO authenticated
  USING (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'vemat_dg')
  );

-- commercial_sales: delete
DROP POLICY IF EXISTS "commercial can delete own sales" ON commercial_sales;
CREATE POLICY "commercial can delete own sales"
  ON commercial_sales FOR DELETE TO authenticated
  USING (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
  );

-- commercial_meeting_reports: insert
DROP POLICY IF EXISTS "commercial can insert own reports" ON commercial_meeting_reports;
CREATE POLICY "commercial can insert own reports"
  ON commercial_meeting_reports FOR INSERT TO authenticated
  WITH CHECK (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
  );

-- commercial_meeting_reports: update
DROP POLICY IF EXISTS "commercial can update own reports" ON commercial_meeting_reports;
CREATE POLICY "commercial can update own reports"
  ON commercial_meeting_reports FOR UPDATE TO authenticated
  USING (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
  );

-- commercial_meeting_reports: delete
DROP POLICY IF EXISTS "commercial can delete own reports" ON commercial_meeting_reports;
CREATE POLICY "commercial can delete own reports"
  ON commercial_meeting_reports FOR DELETE TO authenticated
  USING (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
  );

-- commercial_meeting_reports: DG can update (to validate)
DROP POLICY IF EXISTS "dg can validate reports" ON commercial_meeting_reports;
CREATE POLICY "dg can validate reports"
  ON commercial_meeting_reports FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (SELECT p.id FROM profiles p WHERE p.role = 'vemat_dg')
  );

-- commercial_targets: insert/update by DG only
DROP POLICY IF EXISTS "dg can manage targets" ON commercial_targets;
CREATE POLICY "dg can manage targets"
  ON commercial_targets FOR ALL TO authenticated
  USING (
    auth.uid() IN (SELECT p.id FROM profiles p WHERE p.role = 'vemat_dg')
  )
  WITH CHECK (
    auth.uid() IN (SELECT p.id FROM profiles p WHERE p.role = 'vemat_dg')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Make sure RLS is enabled on commercial tables
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE commercial_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_meeting_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_targets ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to READ commercial data (needed by DG + commercial portals)
DROP POLICY IF EXISTS "authenticated can read commercial_sales" ON commercial_sales;
CREATE POLICY "authenticated can read commercial_sales"
  ON commercial_sales FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated can read meeting_reports" ON commercial_meeting_reports;
CREATE POLICY "authenticated can read meeting_reports"
  ON commercial_meeting_reports FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated can read targets" ON commercial_targets;
CREATE POLICY "authenticated can read targets"
  ON commercial_targets FOR SELECT TO authenticated
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Storage bucket for commercial invoices
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('commercial-invoices', 'commercial-invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to commercial-invoices
DROP POLICY IF EXISTS "auth can upload commercial invoices" ON storage.objects;
CREATE POLICY "auth can upload commercial invoices"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'commercial-invoices');

-- Allow authenticated users to read from commercial-invoices
DROP POLICY IF EXISTS "auth can read commercial invoices" ON storage.objects;
CREATE POLICY "auth can read commercial invoices"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'commercial-invoices');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Ensure Domenico Paduano exists in commercials with correct data
--    (idempotent — only inserts if not already present by name)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO commercials (name, title, phone, email, color, active)
SELECT 'Domenico Paduano', 'Directeur Général', NULL, NULL, '#7c3aed', true
WHERE NOT EXISTS (
  SELECT 1 FROM commercials WHERE name = 'Domenico Paduano'
);
