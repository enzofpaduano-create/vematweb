-- Annule 2026-11-05_securite-rls.sql (remet l'état précédent, y compris les failles)
alter table public.form_devis drop constraint if exists form_devis_status_check;
alter table public.form_devis add constraint form_devis_status_check check (status = any (array['nouveau','traite','converti']));
alter view public.pdr_agents_used        set (security_invoker = false);
alter view public.equipment_history_360  set (security_invoker = false);
grant all on public.pdr_agents_used, public.equipment_history_360 to anon;
grant execute on function public.register_client(uuid,text,text,text,text,text,text,text,text,text,text) to public, anon, authenticated;
grant execute on function public.notify_admin_on_devis(), public.notify_admin_on_repair() to public, anon, authenticated;
revoke update (first_name, last_name, phone) on public.profiles from authenticated;
grant insert, update, delete on public.profiles to authenticated;
create policy users_own_profile on public.profiles for all to public using (auth.uid() = id);
grant all on public.commercials, public.profiles, public.technicians to anon;
drop policy if exists commercials_select_internal on public.commercials;
drop policy if exists commercials_admin_all on public.commercials;
alter table public.commercials disable row level security;
alter table public.profiles    disable row level security;
alter table public.technicians disable row level security;
