-- =============================================================================
-- VEMAT — Phase 3 : Workflow validation devis (Hassan spec 11/08/2026)
-- À coller dans Supabase → SQL Editor → RUN. Idempotent.
--
-- Règle : un devis dont le total dépasse `amount_threshold` OU dont une ligne
-- dépasse `discount_threshold` (en %) doit être validé par un Manager avant
-- d'être marqué "communiqué" au client. Le manager reçoit un email.
-- =============================================================================

-- ── 1. Nouvelles colonnes de validation sur pdr_documents + sav_documents ──

alter table public.pdr_documents
  add column if not exists validation_status text not null default 'not_required'
    check (validation_status in ('not_required','pending','approved','rejected')),
  add column if not exists validation_requested_at timestamptz,
  add column if not exists validation_decided_at timestamptz,
  add column if not exists validation_decided_by text,
  add column if not exists validation_note text;

alter table public.sav_documents
  add column if not exists validation_status text not null default 'not_required'
    check (validation_status in ('not_required','pending','approved','rejected')),
  add column if not exists validation_requested_at timestamptz,
  add column if not exists validation_decided_at timestamptz,
  add column if not exists validation_decided_by text,
  add column if not exists validation_note text;

create index if not exists idx_pdr_documents_validation_status
  on public.pdr_documents (validation_status)
  where validation_status in ('pending','rejected');

create index if not exists idx_sav_documents_validation_status
  on public.sav_documents (validation_status)
  where validation_status in ('pending','rejected');

-- ── 2. Triggers : auto-stamp les timestamps de validation ──────────────────

create or replace function public.set_pdr_validation_timestamps()
returns trigger as $$
begin
  if new.validation_status <> old.validation_status then
    if new.validation_status = 'pending' then
      new.validation_requested_at := now();
      new.validation_decided_at := null;
      new.validation_decided_by := null;
    elsif new.validation_status in ('approved','rejected') then
      new.validation_decided_at := coalesce(new.validation_decided_at, now());
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists pdr_validation_ts_trigger on public.pdr_documents;
create trigger pdr_validation_ts_trigger
  before update on public.pdr_documents
  for each row execute function public.set_pdr_validation_timestamps();

create or replace function public.set_sav_validation_timestamps()
returns trigger as $$
begin
  if new.validation_status <> old.validation_status then
    if new.validation_status = 'pending' then
      new.validation_requested_at := now();
      new.validation_decided_at := null;
      new.validation_decided_by := null;
    elsif new.validation_status in ('approved','rejected') then
      new.validation_decided_at := coalesce(new.validation_decided_at, now());
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists sav_validation_ts_trigger on public.sav_documents;
create trigger sav_validation_ts_trigger
  before update on public.sav_documents
  for each row execute function public.set_sav_validation_timestamps();

-- ── 3. Table approval_settings (seuils configurables par portail) ──────────

create table if not exists public.approval_settings (
  kind text primary key check (kind in ('pdr','sav')),
  amount_threshold numeric not null default 10000,   -- ex : 10 000 € / $
  discount_threshold numeric not null default 15,    -- ex : 15 %
  manager_email text,                                -- destinataire des demandes de validation
  updated_at timestamptz not null default now()
);

-- Seed 2 rows si pas déjà là
insert into public.approval_settings (kind, amount_threshold, discount_threshold, manager_email)
values
  ('pdr', 10000, 15, null),
  ('sav', 10000, 15, null)
on conflict (kind) do nothing;

create or replace function public.touch_approval_settings()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists approval_settings_touch on public.approval_settings;
create trigger approval_settings_touch
  before update on public.approval_settings
  for each row execute function public.touch_approval_settings();

-- ── 4. RLS ────────────────────────────────────────────────────────────────

alter table public.approval_settings enable row level security;

drop policy if exists "auth_all_approval_settings" on public.approval_settings;
create policy "auth_all_approval_settings" on public.approval_settings
  for all to authenticated using (true) with check (true);
