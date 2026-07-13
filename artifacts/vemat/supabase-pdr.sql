-- =============================================================================
-- VEMAT GROUP — Portail PDR (pièces de rechange)
-- Chaîne de documents : devis -> bon de commande -> (en stock) bon de livraison
--                       ou -> commande fournisseur -> bon de réception -> bon de livraison
--                       puis -> facture
-- À coller dans Supabase -> SQL Editor -> New query -> Run
-- =============================================================================

-- Séquence partagée pour les références (toutes uniques, préfixe par type)
create sequence if not exists public.pdr_ref_seq start 1;

-- Table unique : un document = une ligne, la chaîne est modélisée par parent_id
create table if not exists public.pdr_documents (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'devis', 'bon_commande', 'commande_fournisseur',
    'bon_reception', 'bon_livraison', 'facture'
  )),
  reference text unique,
  parent_id uuid references public.pdr_documents(id) on delete set null,
  source_form_devis_id uuid references public.form_devis(id) on delete set null,

  -- Client
  client_company text,
  client_name text,
  client_email text,
  client_phone text,
  client_address text,

  -- Montants
  currency text not null default 'EUR' check (currency in ('EUR', 'USD')),
  include_customs boolean not null default false,       -- pilote le choix du modèle Word (1/2 vs 3/4)
  items jsonb not null default '[]',                    -- [{designation, reference, quantity, unit_price}]
  transport_amount numeric not null default 0,
  customs_amount numeric not null default 0,
  total_amount numeric not null default 0,

  -- Workflow
  status text not null default 'brouillon',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pdr_documents_type    on public.pdr_documents(type);
create index if not exists idx_pdr_documents_status  on public.pdr_documents(status);
create index if not exists idx_pdr_documents_created on public.pdr_documents(created_at desc);
create index if not exists idx_pdr_documents_parent  on public.pdr_documents(parent_id);

-- Référence auto : PREFIX-YYYY-NNNN
create or replace function public.set_pdr_reference()
returns trigger as $$
declare
  prefix text;
begin
  if new.reference is null then
    prefix := case new.type
      when 'devis'                then 'DEV'
      when 'bon_commande'         then 'BC'
      when 'commande_fournisseur' then 'CF'
      when 'bon_reception'        then 'BR'
      when 'bon_livraison'        then 'BL'
      when 'facture'              then 'FAC'
      else 'DOC'
    end;
    new.reference := prefix || '-' || to_char(now(), 'YYYY') || '-'
                     || lpad(nextval('public.pdr_ref_seq')::text, 4, '0');
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_pdr_reference on public.pdr_documents;
create trigger trg_set_pdr_reference
  before insert or update on public.pdr_documents
  for each row execute function public.set_pdr_reference();

-- RLS : réservé au personnel connecté (rôle authenticated). Anon = aucun accès.
alter table public.pdr_documents enable row level security;
drop policy if exists "pdr_documents_auth_all" on public.pdr_documents;
create policy "pdr_documents_auth_all"
  on public.pdr_documents
  for all
  to authenticated
  using (true)
  with check (true);

-- Marqueur "pièces de rechange" sur les demandes du site (pour l'inbox PDR)
alter table public.form_devis
  add column if not exists is_spare_parts boolean not null default false;
