-- =============================================================================
-- VEMAT — Clean PDR / spare-parts TEST data
-- Supabase → SQL Editor → Run
-- Does NOT touch machine devis, interventions, or technician data.
-- =============================================================================

-- 1) PDR portal documents (offers, PO, DN, invoices…)
truncate table public.pdr_documents restart identity cascade;

-- 2) Spare-parts quote requests from the public site (inbox)
delete from public.form_devis
where is_spare_parts = true;

-- 3) Parts autocomplete memory
truncate table public.pdr_parts restart identity;

-- 4) Reset offer numbers to continue from DE26501
alter sequence public.pdr_offer_seq restart with 26501;
alter sequence public.pdr_ref_seq restart with 1;
