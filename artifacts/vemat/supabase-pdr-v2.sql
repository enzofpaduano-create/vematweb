-- =============================================================================
-- VEMAT GROUP — Portail PDR v2 : offres complètes (Nigeria)
-- Enrichit pdr_documents pour coller aux vraies offres : machine, code client,
-- attention, remise par ligne, TVA optionnelle, douane facturée en NAIRA.
-- Numéro d'offre au format DE26501, DE26502… (à la suite des offres actuelles).
-- À coller dans Supabase -> SQL Editor -> New query -> Run (après supabase-pdr.sql)
-- =============================================================================

-- Nouveaux champs
alter table public.pdr_documents
  add column if not exists machine        text,
  add column if not exists client_code    text,
  add column if not exists attention      text,
  add column if not exists delivery_terms text,
  add column if not exists payment_terms  text default 'Advance payment',
  add column if not exists validity       text default '30 Days',
  add column if not exists incoterms_note text,
  add column if not exists apply_vat      boolean not null default false,
  add column if not exists vat_rate       numeric not null default 7.5,
  add column if not exists customs_naira  numeric not null default 0,
  add column if not exists customs_label  text;

-- Anciens champs devenus inutiles (transport = ligne du tableau, douane = NAIRA)
alter table public.pdr_documents
  drop column if exists transport_amount,
  drop column if exists customs_amount,
  drop column if exists include_customs;

-- Séquence dédiée aux offres, démarre à DE26501
create sequence if not exists public.pdr_offer_seq start 26501;

-- Référence : devis -> DE26501… ; autres documents -> PREFIX-YYYY-NNNN
create or replace function public.set_pdr_reference()
returns trigger as $$
begin
  if new.reference is null then
    if new.type = 'devis' then
      new.reference := 'DE' || nextval('public.pdr_offer_seq')::text;
    else
      new.reference := (case new.type
        when 'bon_commande'         then 'BC'
        when 'commande_fournisseur' then 'CF'
        when 'bon_reception'        then 'BR'
        when 'bon_livraison'        then 'BL'
        when 'facture'              then 'FAC'
        else 'DOC'
      end) || '-' || to_char(now(), 'YYYY') || '-'
        || lpad(nextval('public.pdr_ref_seq')::text, 4, '0');
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;
