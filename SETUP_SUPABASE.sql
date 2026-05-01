-- =============================================================================
-- VEMAT GROUP - Schema Supabase pour le Portail Client
-- Coller ce SQL dans Supabase → SQL Editor → New query → Run
-- =============================================================================

-- 1. Companies (sociétés clientes)
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rc text,
  ice text,
  address text,
  city text,
  country text default 'Maroc',
  phone text,
  created_at timestamptz default now()
);

-- 2. Profiles (étend auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id),
  first_name text,
  last_name text,
  phone text,
  role text default 'client' check (role in ('client', 'vemat_admin')),
  created_at timestamptz default now()
);

-- 3. Chantiers
create table if not exists chantiers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  address text,
  city text,
  gps_lat numeric,
  gps_lng numeric,
  contact_name text,
  contact_phone text,
  active boolean default true,
  created_at timestamptz default now()
);

-- 4. Techniciens
create table if not exists technicians (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  available boolean default true,
  color text default '#6366f1'
);

-- Insérer les 3 techniciens par défaut
insert into technicians (name, email, phone, color) values
  ('Tech 1', 'tech1@vemat.ma', '+212 6XX XXX XX1', '#6366f1'),
  ('Tech 2', 'tech2@vemat.ma', '+212 6XX XXX XX2', '#f59e0b'),
  ('Tech 3', 'tech3@vemat.ma', '+212 6XX XXX XX3', '#10b981')
on conflict do nothing;

-- 5. Séquence pour les références
create sequence if not exists reference_seq start 1000;

-- 6. Demandes de devis (pièces de rechange)
create table if not exists devis_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  reference text unique,
  status text default 'en_traitement' check (status in ('en_traitement', 'devis_envoye', 'commande_payee', 'en_livraison', 'livree', 'annulee')),
  chantier_id uuid references chantiers(id),
  items jsonb default '[]',
  notes text,
  quote_pdf_url text,
  quote_amount numeric,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-référence PDR-YYYY-XXXX
create or replace function set_devis_reference()
returns trigger as $$
begin
  if new.reference is null then
    new.reference := 'PDR-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('reference_seq')::text, 4, '0');
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists devis_reference_trigger on devis_requests;
create trigger devis_reference_trigger
  before insert on devis_requests
  for each row execute function set_devis_reference();

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists devis_updated_at on devis_requests;
create trigger devis_updated_at
  before update on devis_requests
  for each row execute function update_updated_at();

-- 7. Demandes de réparation
create table if not exists repair_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  chantier_id uuid references chantiers(id),
  reference text unique,
  equipment_type text not null,
  equipment_brand text,
  equipment_model text,
  equipment_serial text,
  description text not null,
  priority text default 'normale' check (priority in ('normale', 'urgente')),
  status text default 'en_attente' check (status in ('en_attente', 'planifiee', 'en_cours', 'terminee', 'annulee')),
  technician_id uuid references technicians(id),
  scheduled_date date,
  completed_date date,
  technician_notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-référence REP-YYYY-XXXX
create or replace function set_repair_reference()
returns trigger as $$
begin
  if new.reference is null then
    new.reference := 'REP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('reference_seq')::text, 4, '0');
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists repair_reference_trigger on repair_requests;
create trigger repair_reference_trigger
  before insert on repair_requests
  for each row execute function set_repair_reference();

drop trigger if exists repair_updated_at on repair_requests;
create trigger repair_updated_at
  before update on repair_requests
  for each row execute function update_updated_at();

-- 8. Historique des statuts
create table if not exists status_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text check (entity_type in ('devis', 'reparation')),
  entity_id uuid not null,
  old_status text,
  new_status text not null,
  note text,
  changed_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 9. Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text,
  read boolean default false,
  type text,
  link text,
  created_at timestamptz default now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table companies enable row level security;
alter table profiles enable row level security;
alter table chantiers enable row level security;
alter table devis_requests enable row level security;
alter table repair_requests enable row level security;
alter table status_history enable row level security;
alter table notifications enable row level security;
alter table technicians enable row level security;

-- Helper: is current user a vemat admin?
create or replace function is_vemat_admin()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'vemat_admin');
$$ language sql security definer;

-- Helper: get current user's company_id
create or replace function my_company_id()
returns uuid as $$
  select company_id from profiles where id = auth.uid();
$$ language sql security definer;

-- Profiles
drop policy if exists "users_own_profile" on profiles;
create policy "users_own_profile" on profiles for all using (auth.uid() = id);
drop policy if exists "admin_all_profiles" on profiles;
create policy "admin_all_profiles" on profiles for all using (is_vemat_admin());

-- Companies
drop policy if exists "users_own_company" on companies;
create policy "users_own_company" on companies for all using (id = my_company_id());
drop policy if exists "admin_all_companies" on companies;
create policy "admin_all_companies" on companies for all using (is_vemat_admin());

-- Chantiers
drop policy if exists "users_own_chantiers" on chantiers;
create policy "users_own_chantiers" on chantiers for all using (company_id = my_company_id());
drop policy if exists "admin_all_chantiers" on chantiers;
create policy "admin_all_chantiers" on chantiers for all using (is_vemat_admin());

-- Devis requests
drop policy if exists "users_own_devis" on devis_requests;
create policy "users_own_devis" on devis_requests for select using (company_id = my_company_id());
drop policy if exists "users_create_devis" on devis_requests;
create policy "users_create_devis" on devis_requests for insert with check (company_id = my_company_id());
drop policy if exists "admin_all_devis" on devis_requests;
create policy "admin_all_devis" on devis_requests for all using (is_vemat_admin());

-- Repair requests
drop policy if exists "users_own_repairs" on repair_requests;
create policy "users_own_repairs" on repair_requests for select using (company_id = my_company_id());
drop policy if exists "users_create_repairs" on repair_requests;
create policy "users_create_repairs" on repair_requests for insert with check (company_id = my_company_id());
drop policy if exists "admin_all_repairs" on repair_requests;
create policy "admin_all_repairs" on repair_requests for all using (is_vemat_admin());

-- Technicians (lecture pour tous les authentifiés, écriture admin only)
drop policy if exists "read_technicians" on technicians;
create policy "read_technicians" on technicians for select to authenticated using (true);
drop policy if exists "admin_manage_technicians" on technicians;
create policy "admin_manage_technicians" on technicians for all using (is_vemat_admin());

-- Status history
drop policy if exists "users_own_history" on status_history;
create policy "users_own_history" on status_history for select using (
  (entity_type = 'devis' and entity_id in (select id from devis_requests where company_id = my_company_id()))
  or
  (entity_type = 'reparation' and entity_id in (select id from repair_requests where company_id = my_company_id()))
);
drop policy if exists "admin_all_history" on status_history;
create policy "admin_all_history" on status_history for all using (is_vemat_admin());

-- Notifications
drop policy if exists "users_own_notifs" on notifications;
create policy "users_own_notifs" on notifications for all using (user_id = auth.uid());

-- =============================================================================
-- STORAGE BUCKET pour les devis PDF
-- =============================================================================
insert into storage.buckets (id, name, public) values ('quotes', 'quotes', false)
on conflict do nothing;

drop policy if exists "admin_upload_quotes" on storage.objects;
create policy "admin_upload_quotes" on storage.objects
  for insert to authenticated with check (bucket_id = 'quotes' and is_vemat_admin());

drop policy if exists "clients_download_quotes" on storage.objects;
create policy "clients_download_quotes" on storage.objects
  for select to authenticated using (
    bucket_id = 'quotes' and (
      is_vemat_admin()
      or (storage.foldername(name))[1]::text = my_company_id()::text
    )
  );

-- =============================================================================
-- COMPTE ADMIN VEMAT (à faire manuellement dans Supabase Dashboard)
-- =============================================================================
-- 1. Aller dans Authentication → Users → "Create new user"
-- 2. Email: admin@vemat.ma (ou votre email)
-- 3. Choisir un mot de passe fort
-- 4. Après création, noter l'UUID de l'utilisateur
-- 5. Exécuter cette requête en remplaçant 'VOTRE_UUID_ICI' par l'UUID de l'admin :
--
-- insert into profiles (id, role, first_name, last_name)
-- values ('VOTRE_UUID_ICI', 'vemat_admin', 'Admin', 'Vemat');
