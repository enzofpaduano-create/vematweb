-- =============================================================================
-- VEMAT GROUP — Mémoire des pièces (portail PDR)
-- Chaque pièce saisie avec une référence est mémorisée ici et proposée
-- en autocomplétion lors des devis suivants.
-- À coller dans Supabase -> SQL Editor -> New query -> Run
-- =============================================================================

create table if not exists public.pdr_parts (
  reference text primary key,
  designation text,
  last_unit_price numeric,
  currency text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_pdr_parts_updated on public.pdr_parts(updated_at desc);

alter table public.pdr_parts enable row level security;
drop policy if exists "pdr_parts_auth_all" on public.pdr_parts;
create policy "pdr_parts_auth_all"
  on public.pdr_parts
  for all
  to authenticated
  using (true)
  with check (true);
