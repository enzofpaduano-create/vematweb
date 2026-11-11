-- Sous-dossiers dans « Document technique partagé avec vous » (ex. « Manuels/RT 780 »). Vide = racine.
alter table public.shared_documents
  add column if not exists folder text not null default '' check (char_length(folder) <= 300);

create index if not exists shared_documents_folder_idx on public.shared_documents (folder);
