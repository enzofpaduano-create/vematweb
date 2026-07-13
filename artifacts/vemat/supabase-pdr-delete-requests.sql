-- =============================================================================
-- VEMAT — Allow PDR staff to DELETE spare-parts quote requests
-- Run once in Supabase → SQL Editor (if you already applied pdr-complete earlier)
-- =============================================================================

grant delete on public.form_devis to authenticated;

drop policy if exists "form_devis_delete_spare_parts" on public.form_devis;
create policy "form_devis_delete_spare_parts"
  on public.form_devis for delete to authenticated
  using (is_spare_parts = true);
