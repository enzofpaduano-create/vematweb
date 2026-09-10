/**
 * Approval workflow (Hassan Phase 3 spec).
 *
 * A document that exceeds the amount OR discount thresholds must be validated
 * by a Manager (Manager SAV / N+1) before the commercial team can mark it as
 * "communicated" to the client.
 *
 * Shared by both PDR and SAV portals — CRUD helpers take a SupabaseClient.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type ValidationStatus = "not_required" | "pending" | "approved" | "rejected";
export type ApprovalKind = "pdr" | "sav";

export const VALIDATION_STATUS_LABEL: Record<ValidationStatus, string> = {
  not_required: "No approval needed",
  pending: "Pending validation",
  approved: "Approved",
  rejected: "Rejected — please revise",
};

export const VALIDATION_STATUS_COLOR: Record<ValidationStatus, string> = {
  not_required: "bg-zinc-100 text-zinc-600",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export interface ApprovalSettings {
  kind: ApprovalKind;
  amount_threshold: number;
  discount_threshold: number;   // percent (0-100)
  manager_email: string | null;
  updated_at: string;
}

// ── Settings CRUD ───────────────────────────────────────────────────────────

export async function getApprovalSettings(sb: SupabaseClient, kind: ApprovalKind): Promise<ApprovalSettings> {
  const { data, error } = await sb
    .from("approval_settings").select("*").eq("kind", kind).maybeSingle();
  if (error) throw new Error(error.message);
  // Return safe defaults if row missing (should not happen because seeded by SQL).
  return (data as ApprovalSettings | null) ?? {
    kind, amount_threshold: 10000, discount_threshold: 15, manager_email: null,
    updated_at: new Date().toISOString(),
  };
}

export async function saveApprovalSettings(
  sb: SupabaseClient, kind: ApprovalKind, patch: Partial<ApprovalSettings>,
): Promise<void> {
  const { error } = await sb
    .from("approval_settings")
    .update({
      amount_threshold: patch.amount_threshold,
      discount_threshold: patch.discount_threshold,
      manager_email: patch.manager_email ?? null,
    })
    .eq("kind", kind);
  if (error) throw new Error(error.message);
}

// ── Business rule: does this document need Manager approval? ────────────────

export interface DocApprovalInput {
  total_amount: number;
  items?: Array<{ discount_pct?: number }>;
  parts?: Array<{ discount_pct?: number }>;
}

export function computeMaxDiscount(doc: DocApprovalInput): number {
  const list = [...(doc.items ?? []), ...(doc.parts ?? [])];
  return list.reduce((max, it) => Math.max(max, Number(it.discount_pct ?? 0) || 0), 0);
}

export function docNeedsValidation(
  doc: DocApprovalInput,
  settings: Pick<ApprovalSettings, "amount_threshold" | "discount_threshold">,
): { needsValidation: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (doc.total_amount >= settings.amount_threshold) {
    reasons.push(`amount ${doc.total_amount.toLocaleString("en-GB")} ≥ threshold ${settings.amount_threshold.toLocaleString("en-GB")}`);
  }
  const maxDisc = computeMaxDiscount(doc);
  if (maxDisc >= settings.discount_threshold) {
    reasons.push(`max discount ${maxDisc}% ≥ threshold ${settings.discount_threshold}%`);
  }
  return { needsValidation: reasons.length > 0, reasons };
}

/** True when the doc is locked from being marked as "communicated" to the client. */
export function isSendBlocked(validation_status: ValidationStatus): boolean {
  return validation_status === "pending" || validation_status === "rejected";
}

// ── Document status transitions ─────────────────────────────────────────────

async function updateDocumentValidation(
  sb: SupabaseClient,
  table: "pdr_documents" | "sav_documents",
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await sb.from(table).update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function requestValidation(
  sb: SupabaseClient, table: "pdr_documents" | "sav_documents", id: string,
): Promise<void> {
  return updateDocumentValidation(sb, table, id, {
    validation_status: "pending",
    validation_note: null,
  });
}

export async function approveValidation(
  sb: SupabaseClient,
  table: "pdr_documents" | "sav_documents",
  id: string,
  decidedBy: string,
  note?: string,
): Promise<void> {
  return updateDocumentValidation(sb, table, id, {
    validation_status: "approved",
    validation_decided_by: decidedBy,
    validation_note: note ?? null,
  });
}

export async function rejectValidation(
  sb: SupabaseClient,
  table: "pdr_documents" | "sav_documents",
  id: string,
  decidedBy: string,
  note: string,
): Promise<void> {
  return updateDocumentValidation(sb, table, id, {
    validation_status: "rejected",
    validation_decided_by: decidedBy,
    validation_note: note,
  });
}

export async function clearValidation(
  sb: SupabaseClient, table: "pdr_documents" | "sav_documents", id: string,
): Promise<void> {
  return updateDocumentValidation(sb, table, id, {
    validation_status: "not_required",
    validation_requested_at: null,
    validation_decided_at: null,
    validation_decided_by: null,
    validation_note: null,
  });
}
