-- =============================================================================
-- VEMAT GROUP — Table form_contact
-- À coller dans Supabase → SQL Editor → New query → Run
-- Cette table stocke les soumissions du formulaire Contact (/contact).
-- =============================================================================

create table if not exists public.form_contact (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  company_name text,
  type_demande text not null check (type_demande in ('devis', 'sav', 'pieces', 'autre')),
  message text not null,
  created_at timestamptz default now()
);

-- Index pour tri par date (dashboards futurs)
create index if not exists idx_form_contact_created_at on public.form_contact (created_at desc);

-- RLS : anon peut INSERT (formulaire public), lecture réservée à service_role.
alter table public.form_contact enable row level security;

-- Autorise les inserts anonymes depuis le site.
drop policy if exists "public_insert_form_contact" on public.form_contact;
create policy "public_insert_form_contact"
  on public.form_contact
  for insert
  to anon
  with check (true);

-- Aucune policy SELECT/UPDATE/DELETE pour anon → les données ne sont
-- lisibles que via la service_role key (script admin / dashboard).
