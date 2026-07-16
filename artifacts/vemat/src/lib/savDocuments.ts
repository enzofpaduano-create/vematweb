/**
 * Portail SAV — modèle de données et logique.
 *
 * Facturation en 3 blocs :
 *   - Labour  : jours × taux journalier, ou forfait
 *   - Travel  : km × €/km + heures × €/h + repas + hôtel + divers
 *   - Parts   : lignes de pièces (lien vers l'inbox PDR)
 *
 * Chaîne : Offer → PO → Invoice (paiement d'avance) | → Delivery Note → Invoice
 */

import { supabaseSav } from "@/lib/supabase";

export type SavDocType = "devis" | "bon_commande" | "bon_livraison" | "facture";
export type Currency = "EUR" | "USD";
export type LabourMode = "daily" | "fixed";
export type PaymentMode = "advance" | "after";

export interface SavPart {
  reference: string;
  designation: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
}

export interface SavSettings {
  labour_daily_rate: number;
  travel_km_rate: number;
  travel_hour_rate: number;
  meal_rate: number;
  hotel_rate: number;
  default_currency: Currency;
  default_vat_rate: number;
}

export interface SavDocument {
  id: string;
  type: SavDocType;
  reference: string | null;
  parent_id: string | null;
  source_form_intervention_id: string | null;
  pdr_request_id: string | null;

  client_company: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  attention: string | null;
  machine: string | null;
  client_code: string | null;
  location: string | null;

  intervention_description: string | null;
  intervention_date: string | null;

  labour_mode: LabourMode;
  labour_days: number;
  labour_daily_rate: number;
  labour_fixed_amount: number;
  labour_description: string | null;

  travel_km: number;
  travel_km_rate: number;
  travel_hours: number;
  travel_hour_rate: number;
  travel_meals: number;
  travel_hotel: number;
  travel_other: number;

  parts: SavPart[];

  currency: Currency;
  apply_vat: boolean;
  vat_rate: number;
  customs_naira: number;
  customs_label: string | null;
  total_amount: number;

  payment_mode: PaymentMode;

  payment_terms: string | null;
  validity: string | null;
  delivery_terms: string | null;
  incoterms_note: string | null;

  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const DOC_LABEL: Record<SavDocType, string> = {
  devis: "Service Offer",
  bon_commande: "Purchase Order",
  bon_livraison: "Delivery Note",
  facture: "Invoice",
};

export const DOC_LABEL_SHORT: Record<SavDocType, string> = {
  devis: "Offer",
  bon_commande: "PO",
  bon_livraison: "DN",
  facture: "Invoice",
};

export const DOC_FOLDER: Record<SavDocType, string> = {
  devis: "01-Service-Offers",
  bon_commande: "02-Purchase-Orders",
  bon_livraison: "03-Delivery-Notes",
  facture: "04-Invoices",
};

export interface NextStep {
  type: SavDocType;
  label: string;
}

/** Depuis un PO : facture directe si paiement d'avance, sinon BL puis facture. */
export function nextSteps(doc: Pick<SavDocument, "type" | "payment_mode">): NextStep[] {
  switch (doc.type) {
    case "devis":
      return [{ type: "bon_commande", label: "Convert to Purchase Order" }];
    case "bon_commande":
      return doc.payment_mode === "advance"
        ? [{ type: "facture", label: "Invoice (advance payment)" }]
        : [{ type: "bon_livraison", label: "Create Delivery Note" }];
    case "bon_livraison":
      return [{ type: "facture", label: "Invoice" }];
    default:
      return [];
  }
}

// ── Calculs ─────────────────────────────────────────────────────────────────

export function partLineTotal(p: SavPart): number {
  const unit = (Number(p.unit_price) || 0) * (1 - (Number(p.discount_pct) || 0) / 100);
  return unit * (Number(p.quantity) || 0);
}

export interface SavTotals {
  labour: number;
  travel: number;
  parts: number;
  subtotal: number;
  vat: number;
  total: number;
  hasCustoms: boolean;
  nairaSubtotal: number;
  nairaVat: number;
  nairaTotal: number;
}

type TotalsInput = Pick<
  SavDocument,
  | "labour_mode" | "labour_days" | "labour_daily_rate" | "labour_fixed_amount"
  | "travel_km" | "travel_km_rate" | "travel_hours" | "travel_hour_rate"
  | "travel_meals" | "travel_hotel" | "travel_other"
  | "parts" | "apply_vat" | "vat_rate" | "customs_naira"
>;

export function labourTotal(d: Pick<TotalsInput, "labour_mode" | "labour_days" | "labour_daily_rate" | "labour_fixed_amount">): number {
  return d.labour_mode === "fixed"
    ? Number(d.labour_fixed_amount) || 0
    : (Number(d.labour_days) || 0) * (Number(d.labour_daily_rate) || 0);
}

export function travelTotal(d: Pick<TotalsInput, "travel_km" | "travel_km_rate" | "travel_hours" | "travel_hour_rate" | "travel_meals" | "travel_hotel" | "travel_other">): number {
  return (Number(d.travel_km) || 0) * (Number(d.travel_km_rate) || 0)
    + (Number(d.travel_hours) || 0) * (Number(d.travel_hour_rate) || 0)
    + (Number(d.travel_meals) || 0)
    + (Number(d.travel_hotel) || 0)
    + (Number(d.travel_other) || 0);
}

export function partsTotal(parts: SavPart[]): number {
  return (parts ?? []).reduce((s, p) => s + partLineTotal(p), 0);
}

export function computeSavTotals(d: TotalsInput): SavTotals {
  const labour = labourTotal(d);
  const travel = travelTotal(d);
  const parts = partsTotal(d.parts);
  const subtotal = labour + travel + parts;
  const vr = d.apply_vat ? (Number(d.vat_rate) || 0) / 100 : 0;
  const vat = subtotal * vr;
  const nairaSubtotal = Number(d.customs_naira) || 0;
  const nairaVat = nairaSubtotal * vr;
  return {
    labour, travel, parts, subtotal, vat, total: subtotal + vat,
    hasCustoms: nairaSubtotal > 0,
    nairaSubtotal, nairaVat, nairaTotal: nairaSubtotal + nairaVat,
  };
}

export function currencySymbol(c: Currency): string { return c === "EUR" ? "€" : "$"; }
export function formatAmount(amount: number, symbol: string): string {
  return `${(Number(amount) || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
}
export function formatMoney(amount: number, currency: Currency): string {
  return formatAmount(amount, currencySymbol(currency));
}
export function formatNaira(amount: number): string { return formatAmount(amount, "₦"); }

// ── Réglages (taux) ─────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: SavSettings = {
  labour_daily_rate: 0, travel_km_rate: 0, travel_hour_rate: 0,
  meal_rate: 0, hotel_rate: 0, default_currency: "EUR", default_vat_rate: 7.5,
};

export async function getSavSettings(): Promise<SavSettings> {
  const { data, error } = await supabaseSav.from("sav_settings").select("*").eq("id", true).maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return data as SavSettings;
}

export async function saveSavSettings(s: SavSettings): Promise<void> {
  const { error } = await supabaseSav
    .from("sav_settings")
    .upsert({ ...s, id: true, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

// ── Accès données ────────────────────────────────────────────────────────────

export async function listSavDocuments(): Promise<SavDocument[]> {
  const { data, error } = await supabaseSav.from("sav_documents").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalize);
}

function normalize(d: Record<string, unknown>): SavDocument {
  return { ...(d as unknown as SavDocument), parts: Array.isArray(d.parts) ? (d.parts as SavPart[]) : [] };
}

export async function getSavDocument(id: string): Promise<SavDocument | null> {
  const { data, error } = await supabaseSav.from("sav_documents").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalize(data) : null;
}

export async function getSavChain(doc: SavDocument): Promise<SavDocument[]> {
  const all = await listSavDocuments();
  const byId = new Map(all.map((d) => [d.id, d]));
  let root = doc;
  while (root.parent_id && byId.has(root.parent_id)) root = byId.get(root.parent_id)!;
  const chain: SavDocument[] = [];
  const visit = (n: SavDocument) => { chain.push(n); for (const d of all) if (d.parent_id === n.id) visit(d); };
  visit(root);
  return chain;
}

export async function getSavChildrenByType(parentId: string): Promise<Partial<Record<SavDocType, SavDocument>>> {
  const { data } = await supabaseSav.from("sav_documents").select("*").eq("parent_id", parentId);
  const out: Partial<Record<SavDocType, SavDocument>> = {};
  for (const d of (data ?? []).map(normalize)) out[d.type] = d;
  return out;
}

export type NewSavDocument = Omit<SavDocument, "id" | "reference" | "created_at" | "updated_at" | "total_amount"> & { total_amount?: number };

export async function createSavDocument(input: NewSavDocument): Promise<SavDocument> {
  const total_amount = computeSavTotals(input).total;
  const { data, error } = await supabaseSav.from("sav_documents").insert({ ...input, total_amount }).select("*").single();
  if (error) throw new Error(error.message);
  return normalize(data);
}

export async function updateSavDocument(id: string, patch: Partial<SavDocument>): Promise<void> {
  let body: Partial<SavDocument> = { ...patch };
  // Recalcule le total si un élément de calcul change
  const touches = ["labour_mode", "labour_days", "labour_daily_rate", "labour_fixed_amount",
    "travel_km", "travel_km_rate", "travel_hours", "travel_hour_rate", "travel_meals", "travel_hotel", "travel_other",
    "parts", "apply_vat", "vat_rate", "customs_naira"] as const;
  if (touches.some((k) => patch[k] !== undefined)) {
    const current = await getSavDocument(id);
    if (current) body.total_amount = computeSavTotals({ ...current, ...patch } as TotalsInput).total;
  }
  const { error } = await supabaseSav.from("sav_documents").update(body).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Peut-on éditer ? (brouillon et sans document enfant) */
export function canEditSavDocument(doc: SavDocument, hasChildren: boolean): boolean {
  return !hasChildren && doc.status === "brouillon";
}

export async function convertSavDocument(parent: SavDocument, toType: SavDocType, overrides: Partial<NewSavDocument> = {}): Promise<SavDocument> {
  const { id, reference, created_at, updated_at, total_amount, ...rest } = parent;
  void id; void reference; void created_at; void updated_at; void total_amount;
  return createSavDocument({
    ...(rest as NewSavDocument),
    type: toType,
    parent_id: parent.id,
    status: "brouillon",
    ...overrides,
  });
}

// ── Lien vers le portail PDR ────────────────────────────────────────────────

/**
 * Crée une demande de pièces dans l'inbox PDR (table `form_devis`,
 * `is_spare_parts = true`) à partir des pièces d'un document SAV.
 * Retourne l'id de la demande créée.
 */
export async function createPdrRequestFromSav(doc: SavDocument): Promise<string> {
  const parts = doc.parts ?? [];
  if (parts.length === 0) throw new Error("No parts on this document.");

  const reference = `SAV-${doc.reference ?? ""}`;
  const cart_items = parts.map((p) => ({
    sku: p.reference,
    title: p.designation,
    quantity: p.quantity,
    unit_price: p.unit_price,
  }));

  const { data, error } = await supabaseSav
    .from("form_devis")
    .insert({
      reference,
      company_name: doc.client_company || doc.client_name || "SAV",
      contact_name: doc.client_name || doc.attention || "-",
      contact_phone: doc.client_phone || "-",
      contact_email: doc.client_email || "-",
      product_category: "Spare parts (from SAV)",
      quantity: parts.reduce((s, p) => s + (Number(p.quantity) || 0), 0) || 1,
      cart_items,
      is_spare_parts: true,
      location: doc.location || null,
      notes: `Parts requested from SAV ${doc.reference ?? ""}${doc.machine ? ` — machine: ${doc.machine}` : ""}`,
      status: "nouveau",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await updateSavDocument(doc.id, { pdr_request_id: data.id });
  return data.id as string;
}

// ── Dossiers (regroupement par chaîne) ──────────────────────────────────────

export interface SavFolder {
  id: string;
  client: string;
  root: SavDocument;
  docs: SavDocument[];
  latestAt: string;
}

export function groupSavIntoFolders(docs: SavDocument[]): SavFolder[] {
  const byId = new Map(docs.map((d) => [d.id, d]));
  const rootOf = (d: SavDocument): SavDocument => {
    let r = d;
    const seen = new Set<string>();
    while (r.parent_id && byId.has(r.parent_id) && !seen.has(r.id)) { seen.add(r.id); r = byId.get(r.parent_id)!; }
    return r;
  };
  const groups = new Map<string, SavDocument[]>();
  for (const d of docs) {
    const r = rootOf(d);
    if (!groups.has(r.id)) groups.set(r.id, []);
    groups.get(r.id)!.push(d);
  }
  const order: SavDocType[] = ["devis", "bon_commande", "bon_livraison", "facture"];
  return [...groups.entries()]
    .map(([rid, list]) => {
      const root = byId.get(rid)!;
      const sorted = [...list].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
      const latestAt = list.reduce((m, d) => (d.created_at > m ? d.created_at : m), list[0].created_at);
      return { id: rid, client: root.client_company || root.client_name || "Client", root, docs: sorted, latestAt };
    })
    .sort((a, b) => (a.latestAt < b.latestAt ? 1 : -1));
}
