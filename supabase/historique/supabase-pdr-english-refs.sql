-- =============================================================================
-- VEMAT — English document prefixes (BC→PO, CF→SO, BR→GR, BL→DN, FAC→INV)
-- Supabase → SQL Editor → Run once
-- =============================================================================

create or replace function public.set_pdr_reference()
returns trigger as $$
begin
  if new.reference is null then
    if new.type = 'devis' then
      new.reference := 'DE' || nextval('public.pdr_offer_seq')::text;
    else
      new.reference := (case new.type
        when 'bon_commande'         then 'PO'
        when 'commande_fournisseur' then 'SO'
        when 'bon_reception'        then 'GR'
        when 'bon_livraison'        then 'DN'
        when 'facture'              then 'INV'
        else 'DOC'
      end) || '-' || to_char(now(), 'YYYY') || '-'
        || lpad(nextval('public.pdr_ref_seq')::text, 4, '0');
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- Optional: rename existing French-prefixed refs still in DB
update public.pdr_documents set reference = replace(reference, 'BC-', 'PO-') where type = 'bon_commande' and reference like 'BC-%';
update public.pdr_documents set reference = replace(reference, 'CF-', 'SO-') where type = 'commande_fournisseur' and reference like 'CF-%';
update public.pdr_documents set reference = replace(reference, 'BR-', 'GR-') where type = 'bon_reception' and reference like 'BR-%';
update public.pdr_documents set reference = replace(reference, 'BL-', 'DN-') where type = 'bon_livraison' and reference like 'BL-%';
update public.pdr_documents set reference = replace(reference, 'FAC-', 'INV-') where type = 'facture' and reference like 'FAC-%';
