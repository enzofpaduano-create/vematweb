/**
 * Portail PDR — modèle de données et logique de la chaîne de documents.
 *
 * Un document = une ligne de `pdr_documents`. La chaîne (offre/devis -> bon de
 * commande -> ... -> facture) est modélisée par `parent_id`. Convertir un
 * document = créer le suivant en recopiant les données du parent.
 *
 * Les offres suivent le format réel Vemat Nigeria : pièces + transport dans une
 * devise principale (EUR/USD), douane éventuelle facturée en NAIRA, remise par
 * ligne, TVA 7,5% optionnelle.
 */

import { supabasePdr } from "@/lib/supabase";

export type PdrDocType =
  | "devis"
  | "bon_commande"
  | "commande_fournisseur"
  | "bon_reception"
  | "bon_livraison"
  | "facture";

export type Currency = "EUR" | "USD";

export interface PdrItem {
  reference: string;
  designation: string;
  quantity: number;
  avail: string;         // "Imm", "10D", "2mo", texte libre
  unit_price: number;
  discount_pct: number;  // 0-100
}

export interface PdrDocument {
  id: string;
  type: PdrDocType;
  reference: string | null;
  parent_id: string | null;
  source_form_devis_id: string | null;
  // Client
  client_company: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  attention: string | null;
  machine: string | null;
  client_code: string | null;
  // Montants
  currency: Currency;
  items: PdrItem[];
  apply_vat: boolean;
  vat_rate: number;
  customs_naira: number;
  customs_label: string | null;
  total_amount: number;
  // Termes
  payment_terms: string | null;
  validity: string | null;
  delivery_terms: string | null;
  incoterms_note: string | null;
  // Workflow
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const DOC_LABEL: Record<PdrDocType, string> = {
  devis: "Offre / Devis",
  bon_commande: "Bon de commande",
  commande_fournisseur: "Commande fournisseur",
  bon_reception: "Bon de réception",
  bon_livraison: "Bon de livraison",
  facture: "Facture",
};

export const DOC_LABEL_SHORT: Record<PdrDocType, string> = {
  devis: "Offre",
  bon_commande: "BC",
  commande_fournisseur: "CF usine",
  bon_reception: "Réception",
  bon_livraison: "BL",
  facture: "Facture",
};

export interface NextStep {
  type: PdrDocType;
  label: string;
}

export const NEXT_STEPS: Record<PdrDocType, NextStep[]> = {
  devis: [{ type: "bon_commande", label: "Convertir en bon de commande" }],
  bon_commande: [
    { type: "bon_livraison", label: "Livrer (pièces en stock)" },
    { type: "commande_fournisseur", label: "Commander à l'usine" },
  ],
  commande_fournisseur: [{ type: "bon_reception", label: "Créer le bon de réception" }],
  bon_reception: [{ type: "bon_livraison", label: "Créer le bon de livraison" }],
  bon_livraison: [{ type: "facture", label: "Facturer" }],
  facture: [],
};

/** Modèle Word 1 à 4 : devise (EUR/USD) × douane (non/oui). */
export function templateModel(currency: Currency, hasCustoms: boolean): 1 | 2 | 3 | 4 {
  if (!hasCustoms) return currency === "EUR" ? 1 : 2;
  return currency === "EUR" ? 3 : 4;
}

// ── Calculs ─────────────────────────────────────────────────────────────────

export function lineDiscountedUnit(it: PdrItem): number {
  return (Number(it.unit_price) || 0) * (1 - (Number(it.discount_pct) || 0) / 100);
}
export function lineTotal(it: PdrItem): number {
  return lineDiscountedUnit(it) * (Number(it.quantity) || 0);
}
export function itemsTotal(items: PdrItem[]): number {
  return items.reduce((s, it) => s + lineTotal(it), 0);
}

export interface DocTotals {
  mainSubtotal: number;
  mainVat: number;
  mainTotal: number;
  hasCustoms: boolean;
  nairaSubtotal: number;
  nairaVat: number;
  nairaTotal: number;
}

export function computeTotals(doc: {
  items: PdrItem[]; apply_vat: boolean; vat_rate: number; customs_naira: number;
}): DocTotals {
  const mainSubtotal = itemsTotal(doc.items);
  const vr = doc.apply_vat ? (Number(doc.vat_rate) || 0) / 100 : 0;
  const mainVat = mainSubtotal * vr;
  const nairaSubtotal = Number(doc.customs_naira) || 0;
  const nairaVat = nairaSubtotal * vr;
  return {
    mainSubtotal, mainVat, mainTotal: mainSubtotal + mainVat,
    hasCustoms: nairaSubtotal > 0,
    nairaSubtotal, nairaVat, nairaTotal: nairaSubtotal + nairaVat,
  };
}

export function currencySymbol(c: Currency): string {
  return c === "EUR" ? "€" : "$";
}
export function formatAmount(amount: number, symbol: string): string {
  return `${(Number(amount) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
}
export function formatMoney(amount: number, currency: Currency): string {
  return formatAmount(amount, currencySymbol(currency));
}
export function formatNaira(amount: number): string {
  return formatAmount(amount, "₦");
}

// ── Accès données ────────────────────────────────────────────────────────────

export async function listDocuments(): Promise<PdrDocument[]> {
  const { data, error } = await supabasePdr
    .from("pdr_documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PdrDocument[];
}

export async function getDocument(id: string): Promise<PdrDocument | null> {
  const { data, error } = await supabasePdr.from("pdr_documents").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PdrDocument) ?? null;
}

/** Documents liés dans la même chaîne (racine + descendants), triés par date. */
export async function getChain(doc: PdrDocument): Promise<PdrDocument[]> {
  const all = await listDocuments();
  const byId = new Map(all.map((d) => [d.id, d]));
  let root = doc;
  while (root.parent_id && byId.has(root.parent_id)) root = byId.get(root.parent_id)!;
  const chain: PdrDocument[] = [];
  const visit = (node: PdrDocument) => {
    chain.push(node);
    for (const d of all) if (d.parent_id === node.id) visit(d);
  };
  visit(root);
  return chain;
}

export type NewDocumentInput = Omit<
  PdrDocument,
  "id" | "reference" | "created_at" | "updated_at" | "total_amount"
> & { total_amount?: number };

export async function createDocument(input: NewDocumentInput): Promise<PdrDocument> {
  const total_amount = computeTotals(input).mainTotal;
  const { data, error } = await supabasePdr
    .from("pdr_documents")
    .insert({ ...input, total_amount })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as PdrDocument;
}

export async function updateDocument(id: string, patch: Partial<PdrDocument>): Promise<void> {
  const { error } = await supabasePdr.from("pdr_documents").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Crée le document suivant en recopiant les données du parent. */
export async function convertDocument(parent: PdrDocument, toType: PdrDocType): Promise<PdrDocument> {
  const child: NewDocumentInput = {
    type: toType,
    parent_id: parent.id,
    source_form_devis_id: parent.source_form_devis_id,
    client_company: parent.client_company,
    client_name: parent.client_name,
    client_email: parent.client_email,
    client_phone: parent.client_phone,
    client_address: parent.client_address,
    attention: parent.attention,
    machine: parent.machine,
    client_code: parent.client_code,
    currency: parent.currency,
    items: parent.items,
    apply_vat: parent.apply_vat,
    vat_rate: parent.vat_rate,
    customs_naira: parent.customs_naira,
    customs_label: parent.customs_label,
    payment_terms: parent.payment_terms,
    validity: parent.validity,
    delivery_terms: parent.delivery_terms,
    incoterms_note: parent.incoterms_note,
    status: "brouillon",
    notes: parent.notes,
    created_by: parent.created_by,
  };
  return createDocument(child);
}

// ── Mémoire des pièces (autocomplétion) ─────────────────────────────────────

export interface PdrPart {
  reference: string;
  designation: string | null;
  last_unit_price: number | null;
  currency: string | null;
  updated_at: string;
}

export async function searchParts(query: string): Promise<PdrPart[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const pattern = `%${q}%`;
  const { data, error } = await supabasePdr
    .from("pdr_parts")
    .select("*")
    .or(`reference.ilike.${pattern},designation.ilike.${pattern}`)
    .order("updated_at", { ascending: false })
    .limit(8);
  if (error) return [];
  return (data ?? []) as PdrPart[];
}

export async function rememberParts(items: PdrItem[], currency: Currency): Promise<void> {
  const rows = items
    .filter((it) => it.reference.trim() !== "")
    .map((it) => ({
      reference: it.reference.trim(),
      designation: it.designation.trim() || null,
      last_unit_price: it.unit_price || null,
      currency,
      updated_at: new Date().toISOString(),
    }));
  if (rows.length === 0) return;
  await supabasePdr.from("pdr_parts").upsert(rows, { onConflict: "reference" });
}
