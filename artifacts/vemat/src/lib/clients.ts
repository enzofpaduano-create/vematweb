/**
 * Shared client management library (PDR + SAV).
 * Functions take a SupabaseClient as first argument so both portals
 * can call them with their own auth session.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type PaymentTerms = "comptant" | "30j" | "60j" | "lcr";
export type ClientStatus = "actif" | "bloque" | "litige";
export type Currency = "EUR" | "USD";

export const PAYMENT_TERMS_LABEL: Record<PaymentTerms, string> = {
  comptant: "Cash",
  "30j": "30 days net",
  "60j": "60 days net",
  lcr: "Letter of credit",
};

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  actif: "Active",
  bloque: "Blocked",
  litige: "Dispute",
};

export const CLIENT_STATUS_COLOR: Record<ClientStatus, string> = {
  actif: "bg-emerald-100 text-emerald-700",
  bloque: "bg-red-100 text-red-700",
  litige: "bg-amber-100 text-amber-700",
};

export interface Client {
  id: string;
  code_unique: string | null;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  payment_terms: PaymentTerms;
  credit_limit: number;
  currency: Currency;
  status: ClientStatus;
  status_reason: string | null;
  status_changed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NewClientInput = Omit<Client, "id" | "created_at" | "updated_at" | "status_changed_at">;

/** Business rule: cannot create billable/paid docs if client is blocked or in dispute. */
export function isClientLocked(client: Client | null | undefined): boolean {
  return !!client && (client.status === "bloque" || client.status === "litige");
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function listClients(sb: SupabaseClient): Promise<Client[]> {
  const { data, error } = await sb
    .from("clients")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export async function getClient(sb: SupabaseClient, id: string): Promise<Client | null> {
  const { data, error } = await sb.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Client | null) ?? null;
}

export async function createClient(sb: SupabaseClient, input: Partial<NewClientInput> & { name: string }): Promise<Client> {
  const { data, error } = await sb
    .from("clients")
    .insert({
      name: input.name,
      code_unique: input.code_unique ?? null,
      contact_name: input.contact_name ?? null,
      contact_email: input.contact_email ?? null,
      contact_phone: input.contact_phone ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      country: input.country ?? null,
      payment_terms: input.payment_terms ?? "comptant",
      credit_limit: input.credit_limit ?? 0,
      currency: input.currency ?? "EUR",
      status: input.status ?? "actif",
      status_reason: input.status_reason ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Client;
}

export async function updateClient(sb: SupabaseClient, id: string, patch: Partial<Client>): Promise<void> {
  // Never let callers overwrite immutable columns
  const {
    id: _id, created_at: _c, updated_at: _u, status_changed_at: _sc, ...clean
  } = patch;
  void _id; void _c; void _u; void _sc;
  const { error } = await sb.from("clients").update(clean).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteClient(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
