-- Dossier « Document technique partagé avec vous » du portail technicien.
-- Fichiers dans un bucket PRIVÉ (jamais d'URL publique) ; lecture par les techniciens et la direction, dépôt/suppression par la direction.

insert into storage.buckets (id, name, public, file_size_limit)
values ('documents-techniques', 'documents-techniques', false, 26214400) -- 25 Mo par fichier
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create table if not exists public.shared_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  file_name text not null,
  path text not null unique,
  mime text,
  size_bytes bigint not null check (size_bytes > 0),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.shared_documents enable row level security;

-- Lecture : techniciens enregistrés et direction.
create policy shared_documents_select on public.shared_documents
  for select to authenticated
  using (
    exists (select 1 from public.technicians t where t.user_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('vemat_dg', 'vemat_admin'))
  );

-- Écriture : direction uniquement.
create policy shared_documents_insert on public.shared_documents
  for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('vemat_dg', 'vemat_admin')));

create policy shared_documents_update on public.shared_documents
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('vemat_dg', 'vemat_admin')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('vemat_dg', 'vemat_admin')));

create policy shared_documents_delete on public.shared_documents
  for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('vemat_dg', 'vemat_admin')));

-- Stockage : lecture techniciens + direction, dépôt et suppression direction.
create policy "documents_techniques_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents-techniques'
    and (
      exists (select 1 from public.technicians t where t.user_id = auth.uid())
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('vemat_dg', 'vemat_admin'))
    )
  );

create policy "documents_techniques_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents-techniques'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('vemat_dg', 'vemat_admin'))
  );

create policy "documents_techniques_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents-techniques'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('vemat_dg', 'vemat_admin'))
  );
