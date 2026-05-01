-- ─────────────────────────────────────────────────────────────────────────────
-- Vemat Machine Devis Routing — Migration SQL
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add sale link to form_devis (for machine devis converted to commercial_sales)
ALTER TABLE form_devis ADD COLUMN IF NOT EXISTS converted_to_sale_id UUID;

-- 2. Grant read access on form_devis to authenticated role
--    (needed for DG and Commercial portals to query machine devis)
GRANT SELECT ON form_devis TO authenticated;
GRANT UPDATE ON form_devis TO authenticated;
