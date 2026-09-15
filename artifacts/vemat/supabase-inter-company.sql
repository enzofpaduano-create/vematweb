-- =============================================================================
-- VEMAT — Phase 7 : Flux inter-sociétés (Hassan spec)
-- À coller dans Supabase → SQL Editor → RUN. Idempotent.
--
-- Chaque document sait :
--   - de quelle entité Vemat il a été émis (issuing_entity)
--   - si le client est lui-même une autre entité Vemat (client_entity_id)
-- Un doc avec client_entity_id ≠ NULL et ≠ issuing_entity → INTER-SOCIÉTÉ.
--
-- Valeurs autorisées (ids) : 'casablanca', 'dubai', 'lagos', 'port-harcourt',
-- 'nouadhibou'. Défaut = 'casablanca' (siège).
-- =============================================================================

alter table public.pdr_documents
  add column if not exists issuing_entity text not null default 'casablanca',
  add column if not exists client_entity_id text;

alter table public.sav_documents
  add column if not exists issuing_entity text not null default 'casablanca',
  add column if not exists client_entity_id text;

-- Indexes pour dashboards / listes filtrées
create index if not exists idx_pdr_documents_intercompany
  on public.pdr_documents (issuing_entity, client_entity_id, created_at desc)
  where client_entity_id is not null;

create index if not exists idx_sav_documents_intercompany
  on public.sav_documents (issuing_entity, client_entity_id, created_at desc)
  where client_entity_id is not null;
