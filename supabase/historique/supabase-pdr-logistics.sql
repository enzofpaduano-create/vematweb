-- =============================================================================
-- VEMAT — Logistics fields for Deliver (stock) / Order from factory
-- Supabase → SQL Editor → Run once
-- =============================================================================

alter table public.pdr_documents
  add column if not exists logistics jsonb not null default '{}'::jsonb;
