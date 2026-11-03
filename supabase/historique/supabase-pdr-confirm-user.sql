-- Confirm the PDR portal login (email confirmation pending after Auth signup).
-- Supabase → SQL Editor → Run once.
-- Email: vemat.pdr@vematgroup.com
--
-- NB : si tu crées le compte via Dashboard → Authentication → Add user en
-- cochant "Auto Confirm User", ce script est inutile.

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where email = 'vemat.pdr@vematgroup.com';

-- Optionnel : supprimer l'ancien compte de test créé par erreur
-- delete from auth.users where email = 'pdr@vematgroup.com';
