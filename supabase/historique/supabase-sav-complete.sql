-- =============================================================================
-- VEMAT GROUP — Portail SAV (service / interventions) — à coller UNE FOIS
-- Supabase → SQL Editor → New query → Run
--
-- Facturation en 3 blocs : Labour (taux journalier ou forfait) + Travel
-- (km, temps de trajet, repas, hôtel) + Spare parts (lié au portail PDR).
-- Chaîne : Offer → PO → Invoice (paiement d'avance) | → DN → Invoice (après)
-- =============================================================================

-- ── 1. Réglages (taux) — une seule ligne ────────────────────────────────────
create table if not exists public.sav_settings (
  id boolean primary key default true check (id),   -- force une ligne unique
  labour_daily_rate numeric not null default 0,     -- taux journalier main d'œuvre
  travel_km_rate    numeric not null default 0,     -- prix par km
  travel_hour_rate  numeric not null default 0,     -- prix par heure de trajet
  meal_rate         numeric not null default 0,     -- forfait repas / jour
  hotel_rate        numeric not null default 0,     -- forfait hôtel / nuit
  default_currency  text    not null default 'EUR' check (default_currency in ('EUR','USD')),
  default_vat_rate  numeric not null default 7.5,
  updated_at        timestamptz not null default now()
);
insert into public.sav_settings (id) values (true) on conflict (id) do nothing;

-- ── 2. Documents SAV ────────────────────────────────────────────────────────
create sequence if not exists public.sav_ref_seq start 1;

create table if not exists public.sav_documents (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('devis','bon_commande','bon_livraison','facture')),
  reference text unique,
  parent_id uuid references public.sav_documents(id) on delete set null,
  source_form_intervention_id uuid references public.form_interventions(id) on delete set null,
  pdr_request_id uuid references public.form_devis(id) on delete set null,  -- demande pièces créée côté PDR

  -- Client / machine
  client_company text,
  client_name text,
  client_email text,
  client_phone text,
  client_address text,
  attention text,
  machine text,
  client_code text,
  location text,

  -- Intervention
  intervention_description text,
  intervention_date date,

  -- Labour : 'daily' (jours × taux) ou 'fixed' (forfait)
  labour_mode text not null default 'daily' check (labour_mode in ('daily','fixed')),
  labour_days numeric not null default 0,
  labour_daily_rate numeric not null default 0,
  labour_fixed_amount numeric not null default 0,
  labour_description text,

  -- Travel
  travel_km numeric not null default 0,
  travel_km_rate numeric not null default 0,
  travel_hours numeric not null default 0,
  travel_hour_rate numeric not null default 0,
  travel_meals numeric not null default 0,
  travel_hotel numeric not null default 0,
  travel_other numeric not null default 0,

  -- Spare parts : [{reference, designation, quantity, unit_price, discount_pct}]
  parts jsonb not null default '[]',

  -- Montants / taxes (mêmes règles que le PDR)
  currency text not null default 'EUR' check (currency in ('EUR','USD')),
  apply_vat boolean not null default false,
  vat_rate numeric not null default 7.5,
  customs_naira numeric not null default 0,
  customs_label text,
  total_amount numeric not null default 0,

  -- Paiement : 'advance' → PO devient Invoice ; 'after' → PO → DN → Invoice
  payment_mode text not null default 'advance' check (payment_mode in ('advance','after')),

  -- Conditions
  payment_terms text default 'Advance payment',
  validity text default '30 Days',
  delivery_terms text,
  incoterms_note text,

  status text not null default 'brouillon',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sav_documents_type    on public.sav_documents(type);
create index if not exists idx_sav_documents_status  on public.sav_documents(status);
create index if not exists idx_sav_documents_created on public.sav_documents(created_at desc);
create index if not exists idx_sav_documents_parent  on public.sav_documents(parent_id);

-- ── 3. Références : SAV- / SPO- / SDN- / SINV- YYYY-NNNN ────────────────────
create or replace function public.set_sav_reference()
returns trigger as $$
begin
  if new.reference is null then
    new.reference := (case new.type
      when 'devis'         then 'SAV'
      when 'bon_commande'  then 'SPO'
      when 'bon_livraison' then 'SDN'
      when 'facture'       then 'SINV'
      else 'SDOC'
    end) || '-' || to_char(now(), 'YYYY') || '-'
      || lpad(nextval('public.sav_ref_seq')::text, 4, '0');
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_sav_reference on public.sav_documents;
create trigger trg_set_sav_reference
  before insert or update on public.sav_documents
  for each row execute function public.set_sav_reference();

-- ── 4. RLS : réservé au personnel connecté ──────────────────────────────────
alter table public.sav_documents enable row level security;
drop policy if exists "sav_documents_auth_all" on public.sav_documents;
create policy "sav_documents_auth_all"
  on public.sav_documents for all to authenticated using (true) with check (true);

alter table public.sav_settings enable row level security;
drop policy if exists "sav_settings_auth_all" on public.sav_settings;
create policy "sav_settings_auth_all"
  on public.sav_settings for all to authenticated using (true) with check (true);

-- ── 5. Inbox SAV + FERMETURE D'UNE FAILLE DE CONFIDENTIALITÉ ───────────────
--
-- ⚠️ IMPORTANT : `supabase-forms.sql` avait DÉSACTIVÉ la RLS sur form_devis et
-- form_interventions. Sans RLS, la clé anon (publique, présente dans le JS du
-- site) permet de LIRE toutes les demandes clients (noms, emails, téléphones).
-- On réactive la RLS ici, en gardant l'insertion publique des formulaires.
--
-- Rollback si un formulaire public cassait :
--   alter table public.form_interventions disable row level security;
--   alter table public.form_devis          disable row level security;

-- ── form_interventions (demandes SAV du site) ──
alter table public.form_interventions enable row level security;
grant insert on public.form_interventions to anon;
grant select, insert, update, delete on public.form_interventions to authenticated;

-- Le formulaire public /demande-intervention insère (sans relecture) → anon INSERT suffit
drop policy if exists "form_interventions_insert_anon" on public.form_interventions;
create policy "form_interventions_insert_anon"
  on public.form_interventions for insert to anon with check (true);

drop policy if exists "form_interventions_select_auth" on public.form_interventions;
create policy "form_interventions_select_auth"
  on public.form_interventions for select to authenticated using (true);

drop policy if exists "form_interventions_update_auth" on public.form_interventions;
create policy "form_interventions_update_auth"
  on public.form_interventions for update to authenticated using (true) with check (true);

drop policy if exists "form_interventions_delete_auth" on public.form_interventions;
create policy "form_interventions_delete_auth"
  on public.form_interventions for delete to authenticated using (true);

-- ── form_devis (demandes de devis du site + inbox PDR) ──
alter table public.form_devis enable row level security;
grant insert on public.form_devis to anon;
grant select, insert, update, delete on public.form_devis to authenticated;

-- Le formulaire public /demande-devis insère (sans relecture) → anon INSERT suffit
drop policy if exists "form_devis_insert_anon" on public.form_devis;
create policy "form_devis_insert_anon"
  on public.form_devis for insert to anon with check (true);

-- Le SAV crée des demandes de pièces dans l'inbox PDR
drop policy if exists "form_devis_insert_auth" on public.form_devis;
create policy "form_devis_insert_auth"
  on public.form_devis for insert to authenticated with check (true);

-- (les policies select/update/delete `is_spare_parts` viennent de supabase-pdr-complete.sql)
