-- Rapports d'inspection grue des techniciens (application mobile).
-- Table additive : aucune table existante n'est modifiée.
-- Les photos ne sont PAS stockées ici : elles partent uniquement dans l'e-mail (PDF + Excel).

create table if not exists public.inspection_reports (
  id uuid primary key,                                   -- généré par l'application (évite les doublons à l'envoi)
  user_id uuid not null default auth.uid(),              -- compte du technicien
  report_no text not null,
  technician_name text,
  client text,
  machine_serie text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error text,
  photo_count integer not null default 0,
  data jsonb not null,                                   -- saisie complète sans photos
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists inspection_reports_user_idx on public.inspection_reports (user_id, created_at desc);

alter table public.inspection_reports enable row level security;

-- Un technicien voit et crée ses propres rapports.
create policy inspection_reports_select_own on public.inspection_reports
  for select to authenticated
  using (user_id = auth.uid());

create policy inspection_reports_insert_own on public.inspection_reports
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.technicians t where t.user_id = auth.uid())
  );

create policy inspection_reports_update_own on public.inspection_reports
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- La direction (DG / admin) consulte tous les rapports.
create policy inspection_reports_select_direction on public.inspection_reports
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('vemat_dg', 'vemat_admin')));
