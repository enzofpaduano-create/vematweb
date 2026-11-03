-- =============================================================================
-- VEMAT — Phase 6 : Pré-facturation (Hassan spec 11/08/2026)
-- À coller dans Supabase → SQL Editor → RUN. Idempotent.
--
-- Chaque facture (invoice) passe par un contrôle de cohérence avant transfert
-- comptable. Statut de comptabilité indépendant du statut commercial :
--   draft        → pas encore validée (défaut)
--   ready        → contrôlée, prête pour transfert compta
--   transferred  → transférée à la comptabilité (verrouillée en édition)
-- =============================================================================

alter table public.pdr_documents
  add column if not exists accounting_status text not null default 'draft'
    check (accounting_status in ('draft','ready','transferred')),
  add column if not exists accounting_ready_at timestamptz,
  add column if not exists accounting_ready_by text,
  add column if not exists accounting_transferred_at timestamptz,
  add column if not exists accounting_transferred_by text,
  add column if not exists accounting_note text;

alter table public.sav_documents
  add column if not exists accounting_status text not null default 'draft'
    check (accounting_status in ('draft','ready','transferred')),
  add column if not exists accounting_ready_at timestamptz,
  add column if not exists accounting_ready_by text,
  add column if not exists accounting_transferred_at timestamptz,
  add column if not exists accounting_transferred_by text,
  add column if not exists accounting_note text;

-- Index pour retrouver les factures Ready sur les dashboards
create index if not exists idx_pdr_documents_accounting_ready
  on public.pdr_documents (accounting_status, created_at desc)
  where type = 'facture' and accounting_status in ('ready','draft');

create index if not exists idx_sav_documents_accounting_ready
  on public.sav_documents (accounting_status, created_at desc)
  where type = 'facture' and accounting_status in ('ready','draft');

-- ── Triggers : auto-stamp les timestamps de transition ─────────────────────

create or replace function public.set_pdr_accounting_timestamps()
returns trigger as $$
begin
  if new.accounting_status is distinct from old.accounting_status then
    if new.accounting_status = 'ready' then
      new.accounting_ready_at := coalesce(new.accounting_ready_at, now());
    elsif new.accounting_status = 'transferred' then
      new.accounting_transferred_at := coalesce(new.accounting_transferred_at, now());
    elsif new.accounting_status = 'draft' then
      -- Reset — user reopened an already-marked doc.
      new.accounting_ready_at := null;
      new.accounting_ready_by := null;
      new.accounting_transferred_at := null;
      new.accounting_transferred_by := null;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists pdr_accounting_ts_trigger on public.pdr_documents;
create trigger pdr_accounting_ts_trigger
  before update on public.pdr_documents
  for each row execute function public.set_pdr_accounting_timestamps();

create or replace function public.set_sav_accounting_timestamps()
returns trigger as $$
begin
  if new.accounting_status is distinct from old.accounting_status then
    if new.accounting_status = 'ready' then
      new.accounting_ready_at := coalesce(new.accounting_ready_at, now());
    elsif new.accounting_status = 'transferred' then
      new.accounting_transferred_at := coalesce(new.accounting_transferred_at, now());
    elsif new.accounting_status = 'draft' then
      new.accounting_ready_at := null;
      new.accounting_ready_by := null;
      new.accounting_transferred_at := null;
      new.accounting_transferred_by := null;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists sav_accounting_ts_trigger on public.sav_documents;
create trigger sav_accounting_ts_trigger
  before update on public.sav_documents
  for each row execute function public.set_sav_accounting_timestamps();
