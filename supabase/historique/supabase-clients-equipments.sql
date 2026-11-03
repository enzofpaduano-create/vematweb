-- =============================================================================
-- VEMAT — Clients + Parc équipements (Hassan spec 11/08/2026, Phases 1+2)
-- À coller dans Supabase → SQL Editor → RUN.
-- Idempotent — safe to run multiple times.
-- =============================================================================

-- ── 1. Table CLIENTS ────────────────────────────────────────────────────────

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  code_unique text unique,                    -- code interne Vemat (ex: CLI-0142)
  name text not null,                         -- raison sociale
  contact_name text,
  contact_email text,
  contact_phone text,
  address text,
  city text,
  country text,

  -- Conditions commerciales
  payment_terms text not null default 'comptant'
    check (payment_terms in ('comptant', '30j', '60j', 'lcr')),
  credit_limit numeric not null default 0,   -- encours crédit accordé (€/USD, selon usage)
  currency text not null default 'EUR' check (currency in ('EUR', 'USD')),

  -- Statut commercial (bloque la création de docs facturables si non-actif)
  status text not null default 'actif'
    check (status in ('actif', 'bloque', 'litige')),
  status_reason text,                        -- motif du blocage/litige
  status_changed_at timestamptz,

  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_name on public.clients (name);
create index if not exists idx_clients_code_unique on public.clients (code_unique) where code_unique is not null;
create index if not exists idx_clients_status on public.clients (status);

-- Auto-timestamp status_changed_at when status changes
create or replace function public.set_client_status_changed()
returns trigger as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists clients_status_trigger on public.clients;
create trigger clients_status_trigger
  before update on public.clients
  for each row execute function public.set_client_status_changed();

-- ── 2. Table CLIENT_EQUIPMENTS (parc client) ────────────────────────────────

create table if not exists public.client_equipments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  serial_number text,                        -- N° série (peut être null si inconnu)
  brand text,                                -- ex: Terex, JLG, Manitou
  model text,                                -- ex: RT555, 660SJ, MT1840
  machine_type text,                         -- ex: grue mobile, nacelle, télescopique
  year_manufacture int,
  purchase_date date,
  hour_meter numeric,                        -- relevé horaire actuel
  hour_meter_updated_at timestamptz,

  status text not null default 'actif'
    check (status in ('actif', 'hors_service', 'vendu', 'ferraille')),

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_client_equipments_client on public.client_equipments (client_id);
create index if not exists idx_client_equipments_serial on public.client_equipments (serial_number) where serial_number is not null;
create unique index if not exists uq_client_equipments_serial_per_client
  on public.client_equipments (client_id, serial_number)
  where serial_number is not null;

-- Auto-timestamp
create or replace function public.set_equipment_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  if new.hour_meter is distinct from old.hour_meter then
    new.hour_meter_updated_at := now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists equipments_updated_trigger on public.client_equipments;
create trigger equipments_updated_trigger
  before update on public.client_equipments
  for each row execute function public.set_equipment_updated_at();

-- ── 3. Lien vers pdr_documents et sav_documents ────────────────────────────

alter table public.pdr_documents
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists equipment_id uuid references public.client_equipments(id) on delete set null;

alter table public.sav_documents
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists equipment_id uuid references public.client_equipments(id) on delete set null;

create index if not exists idx_pdr_documents_client on public.pdr_documents (client_id) where client_id is not null;
create index if not exists idx_pdr_documents_equipment on public.pdr_documents (equipment_id) where equipment_id is not null;
create index if not exists idx_sav_documents_client on public.sav_documents (client_id) where client_id is not null;
create index if not exists idx_sav_documents_equipment on public.sav_documents (equipment_id) where equipment_id is not null;

-- ── 4. RLS — accès pour utilisateurs authentifiés (PDR + SAV portals) ──────

alter table public.clients enable row level security;
alter table public.client_equipments enable row level security;

drop policy if exists "auth_read_clients" on public.clients;
create policy "auth_read_clients" on public.clients
  for select to authenticated using (true);

drop policy if exists "auth_write_clients" on public.clients;
create policy "auth_write_clients" on public.clients
  for insert to authenticated with check (true);

drop policy if exists "auth_update_clients" on public.clients;
create policy "auth_update_clients" on public.clients
  for update to authenticated using (true) with check (true);

drop policy if exists "auth_delete_clients" on public.clients;
create policy "auth_delete_clients" on public.clients
  for delete to authenticated using (true);

drop policy if exists "auth_all_equipments" on public.client_equipments;
create policy "auth_all_equipments" on public.client_equipments
  for all to authenticated using (true) with check (true);

-- ── 5. Vue 360° — historique complet d'un équipement (docs PDR + SAV) ──────

create or replace view public.equipment_history_360 as
  select
    'pdr'::text as source,
    d.id, d.type::text, d.reference, d.equipment_id, d.client_id,
    d.total_amount, d.currency, d.created_at,
    d.communication_status::text, d.commercial_status::text
  from public.pdr_documents d
  where d.equipment_id is not null
  union all
  select
    'sav'::text as source,
    d.id, d.type::text, d.reference, d.equipment_id, d.client_id,
    d.total_amount, d.currency, d.created_at,
    null::text as communication_status, null::text as commercial_status
  from public.sav_documents d
  where d.equipment_id is not null;

-- Helper: agents / users pour l'autocomplete côté équipe
-- (déjà défini dans supabase-pdr-tracking.sql pour PDR : pdr_agents_used)
