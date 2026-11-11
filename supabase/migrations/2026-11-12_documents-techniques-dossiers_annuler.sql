drop index if exists public.shared_documents_folder_idx;
alter table public.shared_documents drop column if exists folder;
