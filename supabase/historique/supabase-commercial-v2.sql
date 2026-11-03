-- ─────────────────────────────────────────────────────────────────────────────
-- Vemat Commercial v2 — Migration SQL
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add DG validation fields to meeting reports
ALTER TABLE commercial_meeting_reports
  ADD COLUMN IF NOT EXISTS validated_by_dg BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE commercial_meeting_reports
  ADD COLUMN IF NOT EXISTS dg_comment TEXT;

-- 2. Add Domenico Paduano as a commercial (for recording his own machine sales)
--    His sales will be attributed to him separately — Younes's objectives unaffected.
INSERT INTO commercials (name, title, color, active, user_id, phone, email)
SELECT 'Domenico Paduano', 'Directeur Général', '#7c3aed', true, null, null, null
WHERE NOT EXISTS (
  SELECT 1 FROM commercials WHERE name = 'Domenico Paduano'
);

-- 3. (Optional) Rename Younes if needed — edit name as appropriate
-- UPDATE commercials SET name = 'Younes' WHERE name = 'Younes El ...';

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS note: commercial_meeting_reports should already allow supabaseDG
-- (service role) to update rows. If not, run:
-- ALTER TABLE commercial_meeting_reports DISABLE ROW LEVEL SECURITY;
-- or add a policy for the authenticated/service role.
-- ─────────────────────────────────────────────────────────────────────────────
