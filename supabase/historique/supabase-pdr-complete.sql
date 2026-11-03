-- =============================================================================
-- VEMAT GROUP — Portail PDR complet (à coller UNE FOIS)
-- Supabase → SQL Editor → New query → Run
--
-- Remplace la séquence manuelle :
--   supabase-pdr.sql → supabase-pdr-v2.sql → supabase-pdr-parts.sql
-- + patch RLS form_devis pour l'inbox pièces (authenticated).
-- Idempotent : safe à rejouer.
-- =============================================================================

-- ── 1. Table + séquence de base ───────────────────────────────────────────────

create sequence if not exists public.pdr_ref_seq start 1;

create table if not exists public.pdr_documents (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'devis', 'bon_commande', 'commande_fournisseur',
    'bon_reception', 'bon_livraison', 'facture'
  )),
  reference text unique,
  parent_id uuid references public.pdr_documents(id) on delete set null,
  source_form_devis_id uuid references public.form_devis(id) on delete set null,

  client_company text,
  client_name text,
  client_email text,
  client_phone text,
  client_address text,

  currency text not null default 'EUR' check (currency in ('EUR', 'USD')),
  items jsonb not null default '[]',
  total_amount numeric not null default 0,

  status text not null default 'brouillon',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Colonnes legacy éventuelles (si table créée via ancien script) : drop plus bas
-- Colonnes v2 (offres Nigeria)
alter table public.pdr_documents
  add column if not exists machine        text,
  add column if not exists client_code    text,
  add column if not exists attention      text,
  add column if not exists delivery_terms text,
  add column if not exists payment_terms  text default 'Advance payment',
  add column if not exists validity       text default '30 Days',
  add column if not exists incoterms_note text,
  add column if not exists apply_vat      boolean not null default false,
  add column if not exists vat_rate       numeric not null default 7.5,
  add column if not exists customs_naira  numeric not null default 0,
  add column if not exists customs_label  text;

-- Anciens champs v1 (transport = ligne du tableau, douane = NAIRA)
alter table public.pdr_documents
  drop column if exists transport_amount,
  drop column if exists customs_amount,
  drop column if exists include_customs;

create index if not exists idx_pdr_documents_type    on public.pdr_documents(type);
create index if not exists idx_pdr_documents_status  on public.pdr_documents(status);
create index if not exists idx_pdr_documents_created on public.pdr_documents(created_at desc);
create index if not exists idx_pdr_documents_parent  on public.pdr_documents(parent_id);

-- Références : devis → DE26501… ; autres → PREFIX-YYYY-NNNN
create sequence if not exists public.pdr_offer_seq start 26501;

create or replace function public.set_pdr_reference()
returns trigger as $$
begin
  if new.reference is null then
    if new.type = 'devis' then
      new.reference := 'DE' || nextval('public.pdr_offer_seq')::text;
    else
      new.reference := (case new.type
        when 'bon_commande'         then 'PO'
        when 'commande_fournisseur' then 'SO'
        when 'bon_reception'        then 'GR'
        when 'bon_livraison'        then 'DN'
        when 'facture'              then 'INV'
        else 'DOC'
      end) || '-' || to_char(now(), 'YYYY') || '-'
        || lpad(nextval('public.pdr_ref_seq')::text, 4, '0');
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_pdr_reference on public.pdr_documents;
create trigger trg_set_pdr_reference
  before insert or update on public.pdr_documents
  for each row execute function public.set_pdr_reference();

alter table public.pdr_documents enable row level security;
drop policy if exists "pdr_documents_auth_all" on public.pdr_documents;
create policy "pdr_documents_auth_all"
  on public.pdr_documents
  for all
  to authenticated
  using (true)
  with check (true);

alter table public.form_devis
  add column if not exists is_spare_parts boolean not null default false;

-- Logistics (stock delivery / factory order)
alter table public.pdr_documents
  add column if not exists logistics jsonb not null default '{}'::jsonb;

-- ── 2. Mémoire des pièces ────────────────────────────────────────────────────

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

-- ── 3. RLS form_devis — inbox PDR (authenticated + is_spare_parts) ───────────
-- Les politiques existantes (admin/dg/commercial) restent ; on ajoute l'accès
-- pièces pour tout utilisateur authentifié (comptes PDR dédiés plus tard).

drop policy if exists "form_devis_select_spare_parts" on public.form_devis;
create policy "form_devis_select_spare_parts"
  on public.form_devis for select to authenticated
  using (is_spare_parts = true);

drop policy if exists "form_devis_update_spare_parts" on public.form_devis;
create policy "form_devis_update_spare_parts"
  on public.form_devis for update to authenticated
  using (is_spare_parts = true)
  with check (is_spare_parts = true);

-- Suppression des demandes pièces (bouton Clear / Delete dans le portail PDR)
grant delete on public.form_devis to authenticated;
drop policy if exists "form_devis_delete_spare_parts" on public.form_devis;
create policy "form_devis_delete_spare_parts"
  on public.form_devis for delete to authenticated
  using (is_spare_parts = true);

-- Séquences : le trigger nextval doit pouvoir tourner pour authenticated
grant usage, select on sequence public.pdr_ref_seq to authenticated;
grant usage, select on sequence public.pdr_offer_seq to authenticated;
