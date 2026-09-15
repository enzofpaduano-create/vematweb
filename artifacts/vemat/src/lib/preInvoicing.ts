/**
 * Pre-invoicing consistency checks — Hassan Phase 6.
 * Shared PDR + SAV. Each portal calls validate*Invoice() before marking
 * an invoice as "ready for accounting".
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountingStatus = "draft" | "ready" | "transferred";

export const ACCOUNTING_STATUS_LABEL: Record<AccountingStatus, string> = {
  draft: "Draft",
  ready: "Ready for accounting",
  transferred: "Transferred",
};

export const ACCOUNTING_STATUS_COLOR: Record<AccountingStatus, string> = {
  draft: "bg-zinc-100 text-zinc-600",
  ready: "bg-amber-100 text-amber-700",
  transferred: "bg-emerald-100 text-emerald-700",
};

export interface CheckIssue {
  code: string;
  label: string;
}

export interface CheckResult {
  errors: CheckIssue[];    // blocking — cannot mark ready
  warnings: CheckIssue[];  // non-blocking — override with a note
}

// ── PDR checks ──────────────────────────────────────────────────────────────
// Minimal invoice contract:
//  - has a client company
//  - has at least one line with quantity + price
//  - total_amount > 0

interface PdrInvoiceMinimum {
  client_company: string | null;
  client_email: string | null;
  client_phone: string | null;
  items: Array<{ designation?: string; reference?: string; quantity?: number; unit_price?: number }>;
  total_amount: number;
  equipment_id: string | null;
  notes: string | null;
}

export function validatePdrInvoice(doc: PdrInvoiceMinimum): CheckResult {
  const errors: CheckIssue[] = [];
  const warnings: CheckIssue[] = [];

  if (!doc.client_company || !doc.client_company.trim()) {
    errors.push({ code: "client", label: "Client company is missing" });
  }
  const validLines = doc.items.filter((l) =>
    (Number(l.quantity ?? 0) > 0) && (Number(l.unit_price ?? 0) > 0)
  );
  if (validLines.length === 0) {
    errors.push({ code: "lines", label: "No valid line (quantity + price)" });
  }
  if (!(doc.total_amount > 0)) {
    errors.push({ code: "total", label: "Total amount is zero" });
  }

  if (!doc.client_email || !doc.client_email.trim()) {
    warnings.push({ code: "email", label: "Client email is missing (invoice PDF cannot be emailed)" });
  }
  if (!doc.client_phone || !doc.client_phone.trim()) {
    warnings.push({ code: "phone", label: "Client phone is missing" });
  }
  if (!doc.equipment_id) {
    warnings.push({ code: "equipment", label: "No equipment (S/N) linked — 360° history won't include this doc" });
  }
  if (!doc.notes || !doc.notes.trim()) {
    warnings.push({ code: "notes", label: "No internal notes (recommended for accounting audit)" });
  }

  return { errors, warnings };
}

// ── SAV checks — adds labour / travel / intervention consistency ────────────

interface SavInvoiceMinimum {
  client_company: string | null;
  client_email: string | null;
  client_phone: string | null;
  total_amount: number;
  equipment_id: string | null;
  intervention_description: string | null;
  intervention_date: string | null;
  labour_mode: "daily" | "fixed";
  labour_days: number;
  labour_fixed_amount: number;
  travel_km: number;
  travel_hours: number;
  travel_meals: number;
  travel_hotel: number;
  travel_other: number;
  parts: Array<{ designation?: string; quantity?: number; unit_price?: number }>;
}

export function validateSavInvoice(doc: SavInvoiceMinimum): CheckResult {
  const errors: CheckIssue[] = [];
  const warnings: CheckIssue[] = [];

  if (!doc.client_company || !doc.client_company.trim()) {
    errors.push({ code: "client", label: "Client company is missing" });
  }
  if (!doc.intervention_description || !doc.intervention_description.trim()) {
    errors.push({ code: "intervention", label: "Intervention description is missing" });
  }
  if (!(doc.total_amount > 0)) {
    errors.push({ code: "total", label: "Total amount is zero" });
  }

  // Labour
  const labourAmount = doc.labour_mode === "fixed"
    ? Number(doc.labour_fixed_amount ?? 0)
    : Number(doc.labour_days ?? 0) * 1; // days > 0 is what matters
  if (labourAmount === 0) {
    warnings.push({ code: "labour", label: "No labour billed (days = 0 or fixed = 0)" });
  }

  // Travel — only warn if intervention_date is set but no travel entered
  const travelAmount =
    Number(doc.travel_km ?? 0) + Number(doc.travel_hours ?? 0)
    + Number(doc.travel_meals ?? 0) + Number(doc.travel_hotel ?? 0)
    + Number(doc.travel_other ?? 0);
  if (doc.intervention_date && travelAmount === 0) {
    warnings.push({ code: "travel", label: "Intervention date set but no travel expenses entered" });
  }

  // Parts — warn if none (some interventions really don't need parts)
  const validParts = doc.parts.filter((p) => Number(p.quantity ?? 0) > 0 && Number(p.unit_price ?? 0) > 0);
  if (validParts.length === 0 && (doc.parts.length ?? 0) === 0) {
    warnings.push({ code: "parts", label: "No parts billed (may be intentional for labour-only)" });
  }

  if (!doc.client_email || !doc.client_email.trim()) {
    warnings.push({ code: "email", label: "Client email is missing" });
  }
  if (!doc.equipment_id) {
    warnings.push({ code: "equipment", label: "No equipment (S/N) linked — 360° history won't include this doc" });
  }
  if (!doc.intervention_date) {
    warnings.push({ code: "intervention_date", label: "No intervention date set" });
  }

  return { errors, warnings };
}

// ── State transitions ─────────────────────────────────────────────────────

type DocumentsTable = "pdr_documents" | "sav_documents";

async function updateAccountingStatus(
  sb: SupabaseClient, table: DocumentsTable, id: string, patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await sb.from(table).update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Move draft → ready. Optional override note when warnings exist. */
export async function markInvoiceReady(
  sb: SupabaseClient, table: DocumentsTable, id: string, decidedBy: string, note?: string,
): Promise<void> {
  return updateAccountingStatus(sb, table, id, {
    accounting_status: "ready",
    accounting_ready_by: decidedBy,
    accounting_note: note ?? null,
  });
}

/** Move ready → transferred (accountant confirmed receipt). */
export async function markInvoiceTransferred(
  sb: SupabaseClient, table: DocumentsTable, id: string, decidedBy: string, note?: string,
): Promise<void> {
  return updateAccountingStatus(sb, table, id, {
    accounting_status: "transferred",
    accounting_transferred_by: decidedBy,
    accounting_note: note ?? null,
  });
}

/** Any → draft (reopen for corrections). */
export async function resetInvoiceAccounting(
  sb: SupabaseClient, table: DocumentsTable, id: string,
): Promise<void> {
  return updateAccountingStatus(sb, table, id, {
    accounting_status: "draft",
    accounting_note: null,
  });
}

/** True when the invoice is locked from editing (transferred to accounting). */
export function isInvoiceLocked(accountingStatus: AccountingStatus): boolean {
  return accountingStatus === "transferred";
}
