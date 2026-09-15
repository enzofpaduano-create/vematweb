/**
 * Vemat entities — Phase 7 (inter-company flows).
 * A document knows which Vemat entity issued it (issuing_entity), and — for
 * inter-company flows — which entity is on the receiving side (client_entity_id).
 *
 * Ids match the offices.ts registry so we can reuse city/country labels.
 */

export type VematEntityId =
  | "casablanca"
  | "dubai"
  | "lagos"
  | "port-harcourt"
  | "nouadhibou";

export interface VematEntity {
  id: VematEntityId;
  label: string;      // Short human label ("Casablanca (HQ)")
  city: string;
  country: string;
  currency: string;   // Default invoicing currency for that entity
  role: "hq" | "branch";
}

export const VEMAT_ENTITIES: VematEntity[] = [
  { id: "casablanca",    label: "Casablanca (HQ)",   city: "Casablanca",    country: "Maroc",      currency: "MAD", role: "hq" },
  { id: "dubai",         label: "Dubaï",             city: "Dubaï",         country: "UAE",        currency: "USD", role: "branch" },
  { id: "lagos",         label: "Lagos",             city: "Lagos",         country: "Nigeria",    currency: "USD", role: "branch" },
  { id: "port-harcourt", label: "Port Harcourt",     city: "Port Harcourt", country: "Nigeria",    currency: "USD", role: "branch" },
  { id: "nouadhibou",    label: "Nouadhibou",        city: "Nouadhibou",    country: "Mauritanie", currency: "USD", role: "branch" },
];

export const VEMAT_ENTITY_BY_ID: Record<VematEntityId, VematEntity> =
  Object.fromEntries(VEMAT_ENTITIES.map((e) => [e.id, e])) as Record<VematEntityId, VematEntity>;

export function getEntity(id: string | null | undefined): VematEntity | null {
  if (!id) return null;
  return VEMAT_ENTITY_BY_ID[id as VematEntityId] ?? null;
}

export function getEntityLabel(id: string | null | undefined): string {
  return getEntity(id)?.label ?? "—";
}

/** True when this document is an inter-company flow (Vemat → another Vemat). */
export function isInterCompany(doc: { issuing_entity?: string | null; client_entity_id?: string | null }): boolean {
  return !!(doc.client_entity_id && doc.client_entity_id !== doc.issuing_entity);
}
