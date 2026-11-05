-- 2026-11-05 · Sécurité base de données (revue du 5 novembre)
-- Annulation : 2026-11-05_securite-rls_annuler.sql

-- S1. RLS sur les trois tables exposées + retrait des droits du rôle public « anon »
alter table public.commercials enable row level security;
alter table public.profiles    enable row level security;
alter table public.technicians enable row level security;

drop policy if exists commercials_select_internal on public.commercials;
drop policy if exists commercials_admin_all on public.commercials;
create policy commercials_select_internal on public.commercials for select to authenticated
  using (public.is_vemat_admin() or public.auth_is_dg() or user_id = auth.uid());
create policy commercials_admin_all on public.commercials for all to authenticated
  using (public.is_vemat_admin()) with check (public.is_vemat_admin());

revoke all on public.commercials from anon;
revoke all on public.profiles    from anon;
revoke all on public.technicians from anon;

-- S1bis. Escalade de privilège : un utilisateur connecté pouvait modifier son propre rôle
drop policy if exists users_own_profile on public.profiles;
revoke insert, delete, update on public.profiles from authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;

-- S2. Fonctions SECURITY DEFINER inutiles côté API
revoke execute on function public.register_client(uuid,text,text,text,text,text,text,text,text,text,text) from public, anon, authenticated;
revoke execute on function public.notify_admin_on_devis()  from public, anon, authenticated;
revoke execute on function public.notify_admin_on_repair() from public, anon, authenticated;

-- S3. Vues : respecter la RLS de l'utilisateur qui interroge
alter view public.pdr_agents_used        set (security_invoker = true);
alter view public.equipment_history_360  set (security_invoker = true);
revoke all on public.pdr_agents_used       from anon;
revoke all on public.equipment_history_360 from anon;

-- S7. search_path fixé sur les fonctions listées par l'audit
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'set_devis_reference','update_updated_at','set_repair_reference','is_vemat_admin','register_client',
      'notify_admin_on_repair','notify_admin_on_devis','auth_is_dg','set_pdr_reference','set_sav_reference',
      'set_client_status_changed','set_equipment_updated_at','set_pdr_validation_timestamps',
      'set_sav_validation_timestamps','set_pdr_accounting_timestamps','set_sav_accounting_timestamps','set_pdr_sent_at')
  loop
    execute format('alter function %s set search_path = public, pg_temp', r.sig);
  end loop;
end $$;

-- Bug « Ignorer » du tableau de bord PDR : statut accepté par la base
alter table public.form_devis drop constraint if exists form_devis_status_check;
alter table public.form_devis add constraint form_devis_status_check
  check (status = any (array['nouveau','traite','converti','ignore']));
