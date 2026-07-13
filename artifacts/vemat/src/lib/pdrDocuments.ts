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

/** Branch-specific logistics (stock delivery vs factory order). */
export interface PdrLogistics {
  branch?: "stock" | "factory";
  warehouse?: string;
  supplier_name?: string;
  factory_ref?: string;
  eta?: string;
  delivery_date?: string;
  carrier?: string;
  received_date?: string;
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
  logistics: PdrLogistics;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const DOC_LABEL: Record<PdrDocType, string> = {
  devis: "Offer / Quote",
  bon_commande: "Purchase Order",
  commande_fournisseur: "Supplier Order",
  bon_reception: "Goods Receipt",
  bon_livraison: "Delivery Note",
  facture: "Invoice",
};

export const DOC_LABEL_SHORT: Record<PdrDocType, string> = {
  devis: "Offer",
  bon_commande: "PO",
  commande_fournisseur: "Supplier",
  bon_reception: "Receipt",
  bon_livraison: "DN",
  facture: "Invoice",
};

export interface NextStep {
  type: PdrDocType;
  label: string;
}

export const NEXT_STEPS: Record<PdrDocType, NextStep[]> = {
  devis: [{ type: "bon_commande", label: "Convert to purchase order" }],
  bon_commande: [
    { type: "bon_livraison", label: "Deliver (stock)" },
    { type: "commande_fournisseur", label: "Order from factory" },
  ],
  commande_fournisseur: [{ type: "bon_reception", label: "Create goods receipt" }],
  bon_reception: [{ type: "bon_livraison", label: "Create delivery note" }],
  bon_livraison: [{ type: "facture", label: "Invoice" }],
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
  return `${(Number(amount) || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
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
  return ((data ?? []) as PdrDocument[]).map((d) => normalizeDoc(d)!);
}

export async function getDocument(id: string): Promise<PdrDocument | null> {
  const { data, error } = await supabasePdr.from("pdr_documents").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return normalizeDoc(data as PdrDocument | null);
}

function normalizeDoc(doc: PdrDocument | null): PdrDocument | null {
  if (!doc) return null;
  let reference = doc.reference;
  if (reference) {
    reference = reference
      .replace(/^BC-/, "PO-")
      .replace(/^CF-/, "SO-")
      .replace(/^BR-/, "GR-")
      .replace(/^BL-/, "DN-")
      .replace(/^FAC-/, "INV-");
  }
  return {
    ...doc,
    reference,
    logistics: (doc.logistics && typeof doc.logistics === "object") ? doc.logistics : {},
  };
}

const TYPE_ORDER: PdrDocType[] = [
  "devis", "bon_commande", "commande_fournisseur",
  "bon_reception", "bon_livraison", "facture",
];

function sortChainDocs(docs: PdrDocument[]): PdrDocument[] {
  return [...docs].sort((a, b) => {
    const ta = TYPE_ORDER.indexOf(a.type);
    const tb = TYPE_ORDER.indexOf(b.type);
    if (ta !== tb) return ta - tb;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/** Documents liés dans la même chaîne (racine + descendants), triés par type. */
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
  return sortChainDocs(chain);
}

/** One folder = one commercial chain (root offer/PO + all converted children). */
export interface PdrFolder {
  id: string;
  root: PdrDocument;
  docs: PdrDocument[];
  client: string;
  latestAt: string;
}

/** Group a flat document list into folders by parent_id chain. Newest folders first. */
export function groupIntoFolders(docs: PdrDocument[]): PdrFolder[] {
  if (docs.length === 0) return [];
  const byId = new Map(docs.map((d) => [d.id, d]));
  const findRoot = (d: PdrDocument): PdrDocument => {
    let cur = d;
    while (cur.parent_id && byId.has(cur.parent_id)) cur = byId.get(cur.parent_id)!;
    return cur;
  };
  const buckets = new Map<string, PdrDocument[]>();
  for (const d of docs) {
    const root = findRoot(d);
    const list = buckets.get(root.id) ?? [];
    list.push(d);
    buckets.set(root.id, list);
  }
  const folders: PdrFolder[] = [];
  for (const [id, list] of buckets) {
    const sorted = sortChainDocs(list);
    const root = byId.get(id)!;
    const latestAt = list.reduce(
      (max, d) => (d.updated_at > max ? d.updated_at : max),
      list[0]!.created_at,
    );
    folders.push({
      id,
      root,
      docs: sorted,
      client: root.client_company || root.client_name || "—",
      latestAt,
    });
  }
  return folders.sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
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
  const payload: Partial<PdrDocument> = { ...patch };
  if (patch.items !== undefined || patch.apply_vat !== undefined || patch.vat_rate !== undefined || patch.customs_naira !== undefined) {
    const current = await getDocument(id);
    if (!current) throw new Error("Document not found.");
    const merged = {
      items: patch.items ?? current.items,
      apply_vat: patch.apply_vat ?? current.apply_vat,
      vat_rate: patch.vat_rate ?? current.vat_rate,
      customs_naira: patch.customs_naira ?? current.customs_naira,
    };
    payload.total_amount = computeTotals(merged).mainTotal;
  }
  const { error } = await supabasePdr.from("pdr_documents").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

/** True si un document enfant existe déjà dans la chaîne. */
export async function hasChildDocuments(id: string): Promise<boolean> {
  const { count, error } = await supabasePdr
    .from("pdr_documents")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

/** Enfants directs groupés par type (pour éviter les doublons de conversion). */
export async function getChildrenByType(id: string): Promise<Partial<Record<PdrDocType, PdrDocument>>> {
  const { data, error } = await supabasePdr
    .from("pdr_documents")
    .select("*")
    .eq("parent_id", id)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const map: Partial<Record<PdrDocType, PdrDocument>> = {};
  for (const row of (data ?? []) as PdrDocument[]) {
    if (!map[row.type]) map[row.type] = row;
  }
  return map;
}

export function canEditDocument(doc: PdrDocument, hasChildren: boolean): boolean {
  return !hasChildren && doc.status === "brouillon";
}

/** Crée le document suivant en recopiant les données du parent (+ logistics). */
export interface ConvertOptions {
  logistics?: PdrLogistics;
  notes?: string | null;
  markParentStatus?: string;
}

export async function convertDocument(
  parent: PdrDocument,
  toType: PdrDocType,
  options: ConvertOptions = {},
): Promise<PdrDocument> {
  const logistics: PdrLogistics = {
    ...(parent.logistics ?? {}),
    ...(options.logistics ?? {}),
  };
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
    notes: options.notes !== undefined ? options.notes : parent.notes,
    logistics,
    created_by: parent.created_by,
  };
  const created = await createDocument(child);
  const parentStatus = options.markParentStatus ?? "en_cours";
  if (parent.status !== parentStatus) {
    await updateDocument(parent.id, { status: parentStatus });
  }
  return created;
}

// ── Mémoire des pièces (autocomplétion) ─────────────────────────────────────

export interface PdrPart {
  reference: string;
  designation: string | null;
  last_unit_price: number | null;
  currency: string | null;
  updated_at: string;
}

// Catalogue de pièces déjà présent sur le site (Vemat stock + Terex + JLG),
// chargé une seule fois côté navigateur pour l'autocomplétion — pas d'import.
let catalogCache: Array<{ reference: string; designation: string }> | null = null;
let catalogPromise: Promise<void> | null = null;

async function ensureCatalog(): Promise<void> {
  if (catalogCache) return;
  if (!catalogPromise) {
    catalogPromise = fetch(`${import.meta.env.BASE_URL}pdr-parts-index.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then((arr: [string, string][]) => {
        catalogCache = arr.map(([reference, designation]) => ({ reference, designation }));
      })
      .catch(() => { catalogCache = []; });
  }
  await catalogPromise;
}

function searchCatalog(q: string, limit: number): PdrPart[] {
  if (!catalogCache) return [];
  const ql = q.toLowerCase();
  const out: PdrPart[] = [];
  for (const p of catalogCache) {
    if (p.reference.toLowerCase().includes(ql) || p.designation.toLowerCase().includes(ql)) {
      out.push({ reference: p.reference, designation: p.designation, last_unit_price: null, currency: null, updated_at: "" });
      if (out.length >= limit) break;
    }
  }
  return out;
}

/**
 * Autocomplétion pièces : fusionne les pièces déjà utilisées (mémoire Supabase,
 * avec prix rappelé) puis le catalogue du site (Vemat/Terex/JLG). Max 8.
 */
export async function searchParts(query: string): Promise<PdrPart[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const pattern = `%${q}%`;
  const [remembered] = await Promise.all([
    supabasePdr
      .from("pdr_parts")
      .select("*")
      .or(`reference.ilike.${pattern},designation.ilike.${pattern}`)
      .order("updated_at", { ascending: false })
      .limit(8)
      .then(({ data, error }) => (error ? [] : ((data ?? []) as PdrPart[]))),
    ensureCatalog(),
  ]);

  const seen = new Set(remembered.map((r) => r.reference));
  const result = [...remembered];
  for (const c of searchCatalog(q, 30)) {
    if (seen.has(c.reference)) continue;
    result.push(c);
    seen.add(c.reference);
    if (result.length >= 8) break;
  }
  return result.slice(0, 8);
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
