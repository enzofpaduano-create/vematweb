-- Annulation de 2026-11-11_documents-techniques.sql (vider le bucket depuis l'interface Supabase avant).
drop policy if exists "documents_techniques_select" on storage.objects;
drop policy if exists "documents_techniques_insert" on storage.objects;
drop policy if exists "documents_techniques_delete" on storage.objects;
drop table if exists public.shared_documents;
delete from storage.buckets where id = 'documents-techniques';
