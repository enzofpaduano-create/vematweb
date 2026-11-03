-- =============================================================================
-- VEMAT PDR — Quote tracking (Hassan's spec, 08/01/2026)
-- Adds source / assigned_agent / communication_status / sent_at / commercial_status
-- to pdr_documents so the commercial team can track the full lifecycle
-- from request intake to won/lost outcome.
--
-- À coller dans Supabase → SQL Editor → Run.
-- Idempotent — safe to run multiple times.
-- =============================================================================

-- 1. New columns ---------------------------------------------------------------

alter table public.pdr_documents
  add column if not exists source text
    check (source is null or source in ('phone','email','visit','website','social','other')),
  add column if not exists assigned_agent text,
  add column if not exists communication_status text not null default 'non_communique'
    check (communication_status in ('non_communique','en_attente_validation','communique')),
  add column if not exists sent_at timestamptz,
  add column if not exists commercial_status text not null default 'en_cours'
    check (commercial_status in ('en_cours','gagne','perdu','sans_suite'));

-- 2. Auto-stamp sent_at when the document is marked as communicated ----------

create or replace function public.set_pdr_sent_at()
returns trigger as $$
begin
  if new.communication_status = 'communique'
     and (old.communication_status is null or old.communication_status <> 'communique')
     and new.sent_at is null
  then
    new.sent_at := now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists pdr_documents_sent_at_trigger on public.pdr_documents;
create trigger pdr_documents_sent_at_trigger
  before update on public.pdr_documents
  for each row execute function public.set_pdr_sent_at();

-- 3. Indexes for dashboard KPI queries ---------------------------------------

create index if not exists idx_pdr_documents_source
  on public.pdr_documents (source) where source is not null;

create index if not exists idx_pdr_documents_comm_status_created
  on public.pdr_documents (communication_status, created_at desc);

create index if not exists idx_pdr_documents_commercial_status
  on public.pdr_documents (commercial_status);

create index if not exists idx_pdr_documents_assigned_agent
  on public.pdr_documents (assigned_agent) where assigned_agent is not null;

-- 4. Distinct agents view — used by the form's autocomplete ------------------

create or replace view public.pdr_agents_used as
  select assigned_agent as name, count(*) as usage_count, max(created_at) as last_used
  from public.pdr_documents
  where assigned_agent is not null and length(trim(assigned_agent)) > 0
  group by assigned_agent
  order by max(created_at) desc;
