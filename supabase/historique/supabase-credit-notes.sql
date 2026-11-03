-- =============================================================================
-- VEMAT — Phase 4 : Circuit avoirs (Hassan spec 11/08/2026)
-- À coller dans Supabase → SQL Editor → RUN. Idempotent.
--
-- Un avoir (credit note) est créé à partir d'une facture. Il nécessite une
-- double approbation : Manager SAV d'abord, puis Direction Financière.
-- Motif obligatoire dès la création. Blocage tant que non entièrement approuvé.
-- =============================================================================

-- ── 1. Étendre le type CHECK pour accepter 'avoir' ─────────────────────────

alter table public.pdr_documents drop constraint if exists pdr_documents_type_check;
alter table public.pdr_documents add constraint pdr_documents_type_check
  check (type in (
    'devis', 'bon_commande', 'commande_fournisseur',
    'bon_reception', 'bon_livraison', 'facture', 'avoir'
  ));

alter table public.sav_documents drop constraint if exists sav_documents_type_check;
alter table public.sav_documents add constraint sav_documents_type_check
  check (type in ('devis','bon_commande','bon_livraison','facture','avoir'));

-- ── 2. Colonnes du workflow avoir (identiques sur pdr + sav) ───────────────

alter table public.pdr_documents
  add column if not exists avoir_reason text,
  add column if not exists avoir_manager_status text
    check (avoir_manager_status is null or avoir_manager_status in ('pending','approved','rejected')),
  add column if not exists avoir_manager_decided_at timestamptz,
  add column if not exists avoir_manager_decided_by text,
  add column if not exists avoir_manager_note text,
  add column if not exists avoir_finance_status text
    check (avoir_finance_status is null or avoir_finance_status in ('pending','approved','rejected')),
  add column if not exists avoir_finance_decided_at timestamptz,
  add column if not exists avoir_finance_decided_by text,
  add column if not exists avoir_finance_note text;

alter table public.sav_documents
  add column if not exists avoir_reason text,
  add column if not exists avoir_manager_status text
    check (avoir_manager_status is null or avoir_manager_status in ('pending','approved','rejected')),
  add column if not exists avoir_manager_decided_at timestamptz,
  add column if not exists avoir_manager_decided_by text,
  add column if not exists avoir_manager_note text,
  add column if not exists avoir_finance_status text
    check (avoir_finance_status is null or avoir_finance_status in ('pending','approved','rejected')),
  add column if not exists avoir_finance_decided_at timestamptz,
  add column if not exists avoir_finance_decided_by text,
  add column if not exists avoir_finance_note text;

-- Index pour retrouver les avoirs en attente (dashboard)
create index if not exists idx_pdr_documents_avoir_pending
  on public.pdr_documents (avoir_manager_status, avoir_finance_status)
  where type = 'avoir'
    and (avoir_manager_status = 'pending' or avoir_finance_status = 'pending');

create index if not exists idx_sav_documents_avoir_pending
  on public.sav_documents (avoir_manager_status, avoir_finance_status)
  where type = 'avoir'
    and (avoir_manager_status = 'pending' or avoir_finance_status = 'pending');

-- ── 3. Triggers : auto-stamp les timestamps de décision ────────────────────

create or replace function public.set_pdr_avoir_timestamps()
returns trigger as $$
begin
  if new.avoir_manager_status is distinct from old.avoir_manager_status
     and new.avoir_manager_status in ('approved','rejected') then
    new.avoir_manager_decided_at := coalesce(new.avoir_manager_decided_at, now());
  end if;
  if new.avoir_finance_status is distinct from old.avoir_finance_status
     and new.avoir_finance_status in ('approved','rejected') then
    new.avoir_finance_decided_at := coalesce(new.avoir_finance_decided_at, now());
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists pdr_avoir_ts_trigger on public.pdr_documents;
create trigger pdr_avoir_ts_trigger
  before update on public.pdr_documents
  for each row execute function public.set_pdr_avoir_timestamps();

create or replace function public.set_sav_avoir_timestamps()
returns trigger as $$
begin
  if new.avoir_manager_status is distinct from old.avoir_manager_status
     and new.avoir_manager_status in ('approved','rejected') then
    new.avoir_manager_decided_at := coalesce(new.avoir_manager_decided_at, now());
  end if;
  if new.avoir_finance_status is distinct from old.avoir_finance_status
     and new.avoir_finance_status in ('approved','rejected') then
    new.avoir_finance_decided_at := coalesce(new.avoir_finance_decided_at, now());
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists sav_avoir_ts_trigger on public.sav_documents;
create trigger sav_avoir_ts_trigger
  before update on public.sav_documents
  for each row execute function public.set_sav_avoir_timestamps();

-- ── 4. finance_email dans approval_settings ────────────────────────────────

alter table public.approval_settings
  add column if not exists finance_email text;

-- ── 5. Update reference generator to include 'avoir' → 'CN-YYYY-XXXX' ──────

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
        when 'avoir'                then 'CN'
        else 'DOC'
      end) || '-' || to_char(now(), 'YYYY') || '-'
        || lpad(nextval('public.pdr_ref_seq')::text, 4, '0');
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- SAV reference generator: same treatment
create or replace function public.set_sav_reference()
returns trigger as $$
begin
  if new.reference is null then
    if new.type = 'devis' then
      new.reference := 'DE' || nextval('public.sav_offer_seq')::text;
    else
      new.reference := (case new.type
        when 'bon_commande'  then 'PO'
        when 'bon_livraison' then 'DN'
        when 'facture'       then 'INV'
        when 'avoir'         then 'CN'
        else 'DOC'
      end) || '-' || to_char(now(), 'YYYY') || '-'
        || lpad(nextval('public.sav_ref_seq')::text, 4, '0');
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;
