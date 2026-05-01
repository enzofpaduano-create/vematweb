-- ─────────────────────────────────────────────────────────────────────────────
-- Vemat Fix v4
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Rename DG profile to Domenico Paduano
UPDATE profiles
SET first_name = 'Domenico', last_name = 'Paduano'
WHERE role = 'vemat_dg';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Enable RLS on commercial tables
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE commercial_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_meeting_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_targets ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. commercial_sales policies
-- ─────────────────────────────────────────────────────────────────────────────

-- SELECT: all authenticated can read
DROP POLICY IF EXISTS "authenticated can read commercial_sales" ON commercial_sales;
CREATE POLICY "authenticated can read commercial_sales"
  ON commercial_sales FOR SELECT TO authenticated
  USING (true);

-- INSERT: commercial (own rows) OR DG
DROP POLICY IF EXISTS "commercial can insert own sales" ON commercial_sales;
CREATE POLICY "commercial can insert own sales"
  ON commercial_sales FOR INSERT TO authenticated
  WITH CHECK (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'vemat_dg')
  );

-- UPDATE: commercial (own rows) OR DG
DROP POLICY IF EXISTS "commercial can update own sales" ON commercial_sales;
CREATE POLICY "commercial can update own sales"
  ON commercial_sales FOR UPDATE TO authenticated
  USING (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'vemat_dg')
  );

-- DELETE: commercial (own rows) OR DG
DROP POLICY IF EXISTS "commercial can delete own sales" ON commercial_sales;
CREATE POLICY "commercial can delete own sales"
  ON commercial_sales FOR DELETE TO authenticated
  USING (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'vemat_dg')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. commercial_meeting_reports policies
-- ─────────────────────────────────────────────────────────────────────────────

-- SELECT: all authenticated
DROP POLICY IF EXISTS "authenticated can read meeting_reports" ON commercial_meeting_reports;
CREATE POLICY "authenticated can read meeting_reports"
  ON commercial_meeting_reports FOR SELECT TO authenticated
  USING (true);

-- INSERT: commercial own reports OR DG
DROP POLICY IF EXISTS "commercial can insert own reports" ON commercial_meeting_reports;
CREATE POLICY "commercial can insert own reports"
  ON commercial_meeting_reports FOR INSERT TO authenticated
  WITH CHECK (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'vemat_dg')
  );

-- UPDATE: commercial own OR DG (to validate)
DROP POLICY IF EXISTS "commercial can update own reports" ON commercial_meeting_reports;
DROP POLICY IF EXISTS "dg can validate reports" ON commercial_meeting_reports;
CREATE POLICY "commercial or dg can update reports"
  ON commercial_meeting_reports FOR UPDATE TO authenticated
  USING (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'vemat_dg')
  );

-- DELETE: commercial own
DROP POLICY IF EXISTS "commercial can delete own reports" ON commercial_meeting_reports;
CREATE POLICY "commercial can delete own reports"
  ON commercial_meeting_reports FOR DELETE TO authenticated
  USING (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'vemat_dg')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. commercial_events policies
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE commercial_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can read commercial_events" ON commercial_events;
CREATE POLICY "authenticated can read commercial_events"
  ON commercial_events FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "commercial can insert own events" ON commercial_events;
CREATE POLICY "commercial can insert own events"
  ON commercial_events FOR INSERT TO authenticated
  WITH CHECK (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'vemat_dg')
  );

DROP POLICY IF EXISTS "commercial can update own events" ON commercial_events;
CREATE POLICY "commercial can update own events"
  ON commercial_events FOR UPDATE TO authenticated
  USING (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'vemat_dg')
  );

DROP POLICY IF EXISTS "commercial can delete own events" ON commercial_events;
CREATE POLICY "commercial can delete own events"
  ON commercial_events FOR DELETE TO authenticated
  USING (
    commercial_id IN (SELECT id FROM commercials WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'vemat_dg')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. commercial_targets policies (DG only)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "dg can manage targets" ON commercial_targets;
CREATE POLICY "dg can manage targets"
  ON commercial_targets FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'vemat_dg'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'vemat_dg'));

DROP POLICY IF EXISTS "authenticated can read targets" ON commercial_targets;
CREATE POLICY "authenticated can read targets"
  ON commercial_targets FOR SELECT TO authenticated
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Storage bucket for commercial invoices
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('commercial-invoices', 'commercial-invoices', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "auth can upload commercial invoices" ON storage.objects;
CREATE POLICY "auth can upload commercial invoices"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'commercial-invoices');

DROP POLICY IF EXISTS "auth can read commercial invoices" ON storage.objects;
CREATE POLICY "auth can read commercial invoices"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'commercial-invoices');

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Ensure Domenico Paduano exists in commercials (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO commercials (name, title, phone, email, color, active)
SELECT 'Domenico Paduano', 'Directeur Général', NULL, NULL, '#7c3aed', true
WHERE NOT EXISTS (
  SELECT 1 FROM commercials WHERE name = 'Domenico Paduano'
);
