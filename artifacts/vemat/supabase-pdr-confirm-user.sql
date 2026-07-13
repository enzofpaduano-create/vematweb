-- Confirm the PDR portal login (email confirmation pending after Auth signup).
-- Supabase → SQL Editor → Run once.
-- Email: pdr@vematgroup.com

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where email = 'pdr@vematgroup.com';
