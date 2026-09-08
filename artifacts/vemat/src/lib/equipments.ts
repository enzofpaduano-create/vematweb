/**
 * Shared equipment (parc machine) library (PDR + SAV).
 * Each equipment is owned by exactly one client (client_id FK).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type EquipmentStatus = "actif" | "hors_service" | "vendu" | "ferraille";

export const EQUIPMENT_STATUS_LABEL: Record<EquipmentStatus, string> = {
  actif: "In service",
  hors_service: "Out of service",
  vendu: "Sold",
  ferraille: "Scrapped",
};

export const EQUIPMENT_STATUS_COLOR: Record<EquipmentStatus, string> = {
  actif: "bg-emerald-100 text-emerald-700",
  hors_service: "bg-amber-100 text-amber-700",
  vendu: "bg-zinc-100 text-zinc-600",
  ferraille: "bg-red-100 text-red-700",
};

export interface ClientEquipment {
  id: string;
  client_id: string;
  serial_number: string | null;
  brand: string | null;
  model: string | null;
  machine_type: string | null;
  year_manufacture: number | null;
  purchase_date: string | null;
  hour_meter: number | null;
  hour_meter_updated_at: string | null;
  status: EquipmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EquipmentHistoryEntry {
  source: "pdr" | "sav";
  id: string;
  type: string;
  reference: string | null;
  equipment_id: string;
  client_id: string | null;
  total_amount: number;
  currency: string;
  created_at: string;
  communication_status: string | null;
  commercial_status: string | null;
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function listEquipmentsByClient(sb: SupabaseClient, clientId: string): Promise<ClientEquipment[]> {
  const { data, error } = await sb
    .from("client_equipments")
    .select("*")
    .eq("client_id", clientId)
    .order("brand", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientEquipment[];
}

export async function listAllEquipments(sb: SupabaseClient): Promise<ClientEquipment[]> {
  const { data, error } = await sb
    .from("client_equipments")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientEquipment[];
}

export async function getEquipment(sb: SupabaseClient, id: string): Promise<ClientEquipment | null> {
  const { data, error } = await sb
    .from("client_equipments").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ClientEquipment | null) ?? null;
}

export async function createEquipment(
  sb: SupabaseClient,
  input: Partial<Omit<ClientEquipment, "id" | "created_at" | "updated_at" | "hour_meter_updated_at">> & { client_id: string },
): Promise<ClientEquipment> {
  const { data, error } = await sb
    .from("client_equipments")
    .insert({
      client_id: input.client_id,
      serial_number: input.serial_number ?? null,
      brand: input.brand ?? null,
      model: input.model ?? null,
      machine_type: input.machine_type ?? null,
      year_manufacture: input.year_manufacture ?? null,
      purchase_date: input.purchase_date ?? null,
      hour_meter: input.hour_meter ?? null,
      status: input.status ?? "actif",
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ClientEquipment;
}

export async function updateEquipment(sb: SupabaseClient, id: string, patch: Partial<ClientEquipment>): Promise<void> {
  const {
    id: _id, created_at: _c, updated_at: _u, hour_meter_updated_at: _hu, ...clean
  } = patch;
  void _id; void _c; void _u; void _hu;
  const { error } = await sb.from("client_equipments").update(clean).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteEquipment(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("client_equipments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── 360° history for one equipment (docs across PDR + SAV) ─────────────────

export async function getEquipmentHistory(sb: SupabaseClient, equipmentId: string): Promise<EquipmentHistoryEntry[]> {
  const { data, error } = await sb
    .from("equipment_history_360")
    .select("*")
    .eq("equipment_id", equipmentId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as EquipmentHistoryEntry[];
}
