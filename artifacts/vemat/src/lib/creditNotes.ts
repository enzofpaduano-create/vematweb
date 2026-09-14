/**
 * Credit note (avoir) 2-stage approval workflow — Hassan Phase 4.
 *
 * Flow:
 *   Draft (no approvals yet)
 *     → Manager pending (auto on creation with required reason)
 *       → Manager rejected → dead-end (requester must revise or scrap)
 *       → Manager approved → Finance pending
 *         → Finance rejected → dead-end
 *         → Finance approved → Fully approved (avoir can be sent to client)
 *
 * Both approvals are required — no shortcuts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type AvoirStatus = "pending" | "approved" | "rejected";
export type AvoirStage = "manager" | "finance";

export const AVOIR_STATUS_LABEL: Record<AvoirStatus, string> = {
  pending: "Pending decision",
  approved: "Approved",
  rejected: "Rejected",
};

export const AVOIR_STATUS_COLOR: Record<AvoirStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

/** Minimal shape of an avoir needed for state checks (both PDR + SAV compat). */
export interface AvoirState {
  avoir_reason: string | null;
  avoir_manager_status: AvoirStatus | null;
  avoir_finance_status: AvoirStatus | null;
}

/** Which stage is currently blocking? Null once fully decided. */
export function currentAvoirStage(doc: AvoirState): AvoirStage | null {
  if (!doc.avoir_manager_status || doc.avoir_manager_status === "pending") return "manager";
  if (doc.avoir_manager_status === "rejected") return null; // dead-end
  if (!doc.avoir_finance_status || doc.avoir_finance_status === "pending") return "finance";
  return null; // finance decided (approved or rejected)
}

/** True once BOTH manager and finance have approved. */
export function isAvoirFullyApproved(doc: AvoirState): boolean {
  return doc.avoir_manager_status === "approved" && doc.avoir_finance_status === "approved";
}

/** True if any stage is rejected — the avoir cannot proceed. */
export function isAvoirRejected(doc: AvoirState): boolean {
  return doc.avoir_manager_status === "rejected" || doc.avoir_finance_status === "rejected";
}

/**
 * The avoir is "issued" (sendable to the client) only once fully approved.
 * Until then the commercial team must not communicate it.
 */
export function canIssueAvoir(doc: AvoirState): boolean {
  return isAvoirFullyApproved(doc);
}

// ── Persistence helpers ────────────────────────────────────────────────────

type DocumentsTable = "pdr_documents" | "sav_documents";

async function patch(sb: SupabaseClient, table: DocumentsTable, id: string, body: Record<string, unknown>): Promise<void> {
  const { error } = await sb.from(table).update(body).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Called right after creating a new avoir document. Kicks off the manager stage. */
export async function initAvoirWorkflow(
  sb: SupabaseClient, table: DocumentsTable, id: string, reason: string,
): Promise<void> {
  if (!reason.trim()) throw new Error("A reason is required to create a credit note.");
  return patch(sb, table, id, {
    avoir_reason: reason.trim(),
    avoir_manager_status: "pending",
    avoir_manager_decided_at: null,
    avoir_manager_decided_by: null,
    avoir_manager_note: null,
    avoir_finance_status: null,
    avoir_finance_decided_at: null,
    avoir_finance_decided_by: null,
    avoir_finance_note: null,
  });
}

export async function decideAvoirManager(
  sb: SupabaseClient, table: DocumentsTable, id: string,
  decision: "approved" | "rejected", decidedBy: string, note?: string,
): Promise<void> {
  if (decision === "rejected" && !(note ?? "").trim()) {
    throw new Error("A note is required when rejecting.");
  }
  const body: Record<string, unknown> = {
    avoir_manager_status: decision,
    avoir_manager_decided_by: decidedBy,
    avoir_manager_note: note ?? null,
  };
  // Approving manager stage auto-opens the finance stage.
  if (decision === "approved") body.avoir_finance_status = "pending";
  return patch(sb, table, id, body);
}

export async function decideAvoirFinance(
  sb: SupabaseClient, table: DocumentsTable, id: string,
  decision: "approved" | "rejected", decidedBy: string, note?: string,
): Promise<void> {
  if (decision === "rejected" && !(note ?? "").trim()) {
    throw new Error("A note is required when rejecting.");
  }
  return patch(sb, table, id, {
    avoir_finance_status: decision,
    avoir_finance_decided_by: decidedBy,
    avoir_finance_note: note ?? null,
  });
}
