/**
 * Registre des demandes de devis (Vemat Westchase — Nigeria).
 *
 * Une ligne du registre = une demande client (`quotation_requests`).
 * Le devis lié (PDR pour les pièces, SAV pour intervention/formation) porte le montant,
 * l'approbation du DG, la date d'envoi et le statut commercial : le registre les lit
 * via la vue `quotation_register` (aucune double saisie).
 *
 * Partagé par les portails PDR et SAV : toutes les fonctions prennent un SupabaseClient.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CellValue } from "exceljs";

export type RequestType = "spare_parts" | "field_service" | "training";
export type RequestPriority = "high" | "medium" | "low";
export type ReceivedVia = "phone" | "email" | "visit" | "website" | "social" | "other";
export type WaitingOn = "client" | "lagos" | "costing" | "dg" | "supplier";
export type EventType = "note" | "info_requested" | "info_received" | "follow_up" | "status";

export type RegisterStage =
  | "closed" | "info_missing" | "to_cost" | "costing" | "pending_gm" | "revision_requested"
  | "ready_to_send" | "sent" | "negotiation" | "won" | "lost" | "cancelled" | "no_follow_up";

export type GmStatus = "not_required" | "pending" | "approved" | "rejected";

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  spare_parts: "Spare Parts",
  field_service: "Field Service & Diagnostic",
  training: "Training",
};

/** Training and field service go through the SAV portal, spare parts through PDR. */
export const REQUEST_TYPE_PORTAL: Record<RequestType, "pdr" | "sav"> = {
  spare_parts: "pdr",
  field_service: "sav",
  training: "sav",
};

export const PRIORITY_LABEL: Record<RequestPriority, string> = { high: "High", medium: "Medium", low: "Low" };
export const PRIORITY_COLOR: Record<RequestPriority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-zinc-100 text-zinc-600",
};

export const RECEIVED_VIA_LABEL: Record<ReceivedVia, string> = {
  phone: "Phone", email: "Email", visit: "Visit", website: "Website", social: "Social media", other: "Other",
};

export const WAITING_ON_LABEL: Record<WaitingOn, string> = {
  client: "Client", lagos: "Lagos office", costing: "Costing (Casablanca)", dg: "DG", supplier: "Supplier",
};

export const EVENT_LABEL: Record<EventType, string> = {
  note: "Note", info_requested: "Information requested", info_received: "Information received",
  follow_up: "Follow-up", status: "Status",
};

export const STAGE_LABEL: Record<RegisterStage, string> = {
  closed: "Closed",
  info_missing: "Information missing",
  to_cost: "To be costed",
  costing: "Quote in preparation",
  pending_gm: "Waiting for DG approval",
  revision_requested: "Revision requested",
  ready_to_send: "Approved — ready to send",
  sent: "Sent to client",
  negotiation: "Under negotiation",
  won: "Won",
  lost: "Lost",
  cancelled: "Cancelled",
  no_follow_up: "No follow-up",
};

export const STAGE_COLOR: Record<RegisterStage, string> = {
  closed: "bg-zinc-200 text-zinc-600",
  info_missing: "bg-red-100 text-red-700",
  to_cost: "bg-amber-100 text-amber-700",
  costing: "bg-sky-100 text-sky-700",
  pending_gm: "bg-amber-100 text-amber-800",
  revision_requested: "bg-orange-100 text-orange-700",
  ready_to_send: "bg-teal-100 text-teal-700",
  sent: "bg-indigo-100 text-indigo-700",
  negotiation: "bg-violet-100 text-violet-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
  cancelled: "bg-zinc-200 text-zinc-600",
  no_follow_up: "bg-zinc-100 text-zinc-600",
};

/** Stages where a request is still being worked (not finished one way or the other). */
export const OPEN_STAGES: RegisterStage[] = [
  "info_missing", "to_cost", "costing", "pending_gm", "revision_requested", "ready_to_send", "sent", "negotiation",
];
/** Sent to the client and still undecided = the commercial pipeline. */
export const PIPELINE_STAGES: RegisterStage[] = ["sent", "negotiation"];

export const GM_LABEL: Record<GmStatus, string> = {
  not_required: "—",
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Revision Requested",
};

export const COMMERCIAL_LABEL: Record<string, string> = {
  en_cours: "Pending",
  negociation: "Under Negotiation",
  gagne: "Won",
  perdu: "Lost",
  sans_suite: "No follow-up",
  annule: "Cancelled",
};

export interface RegisterRow {
  id: string;
  request_id: string;              // VW-2026-001
  date_received: string;           // yyyy-mm-dd
  client_name: string;
  location_site: string | null;
  equipment: string | null;
  serial_number: string | null;
  request_type: RequestType;
  priority: RequestPriority;
  quotation_ref: string | null;    // DE26xxx
  date_prepared: string | null;
  total_quote_amount: number | null;
  currency: string | null;
  gm_approval_status: GmStatus | null;
  date_approved: string | null;
  sent_to_client_at: string | null;
  commercial_status: string | null;
  po_wo_no: string | null;
  remarks: string | null;
  entity: string;
  received_via: ReceivedVia | null;
  logged_by: string | null;
  costing_owner: string | null;
  contact_name: string | null;
  contact_email: string | null;
  request_details: string | null;
  missing_info: string | null;
  waiting_on: WaitingOn | null;
  next_follow_up_at: string | null;
  closed_at: string | null;
  closed_note: string | null;
  client_id: string;
  equipment_id: string | null;
  pdr_document_id: string | null;
  sav_document_id: string | null;
  communication_status: string | null;
  validation_requested_at: string | null;
  doc_status: string | null;
  stage: RegisterStage;
  is_blocked: boolean;
  is_overdue: boolean;
  days_open: number;
  days_to_prepare: number | null;
  days_to_approve: number | null;
  days_to_send: number | null;
  days_total: number | null;
  last_event_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestEvent {
  id: string;
  request_id: string;
  event_type: EventType;
  body: string | null;
  author: string | null;
  created_at: string;
}

export interface NewRequestInput {
  client_id: string;
  request_type: RequestType;
  priority?: RequestPriority;
  received_at?: string;
  received_via?: ReceivedVia | null;
  logged_by?: string | null;
  costing_owner?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  site?: string | null;
  equipment_id?: string | null;
  request_details?: string | null;
  missing_info?: string | null;
  waiting_on?: WaitingOn | null;
  next_follow_up_at?: string | null;
  notes?: string | null;
}

export type RequestPatch = Partial<Omit<NewRequestInput, "client_id">> & {
  client_po_ref?: string | null;
  closed_at?: string | null;
  closed_note?: string | null;
  pdr_document_id?: string | null;
  sav_document_id?: string | null;
};

// ── Lecture ─────────────────────────────────────────────────────────────────

export async function listRegister(sb: SupabaseClient): Promise<RegisterRow[]> {
  const { data, error } = await sb
    .from("quotation_register")
    .select("*")
    .order("date_received", { ascending: false })
    .order("request_id", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegisterRow[];
}

export async function listEvents(sb: SupabaseClient, requestId: string): Promise<RequestEvent[]> {
  const { data, error } = await sb
    .from("quotation_request_events")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RequestEvent[];
}

// ── Écriture ────────────────────────────────────────────────────────────────

/** Le numéro VW-AAAA-NNN est attribué par la base (chronologique, jamais modifiable). */
export async function createRequest(sb: SupabaseClient, input: NewRequestInput): Promise<{ id: string; request_no: string }> {
  const { data, error } = await sb
    .from("quotation_requests")
    .insert({
      client_id: input.client_id,
      request_type: input.request_type,
      priority: input.priority ?? "medium",
      ...(input.received_at ? { received_at: input.received_at } : {}),
      received_via: input.received_via ?? null,
      logged_by: input.logged_by ?? null,
      costing_owner: input.costing_owner ?? null,
      contact_name: input.contact_name ?? null,
      contact_email: input.contact_email ?? null,
      site: input.site ?? null,
      equipment_id: input.equipment_id ?? null,
      request_details: input.request_details ?? null,
      missing_info: input.missing_info ?? null,
      waiting_on: input.waiting_on ?? null,
      next_follow_up_at: input.next_follow_up_at ?? null,
      notes: input.notes ?? null,
      request_no: "",
    })
    .select("id, request_no")
    .single();
  if (error) throw new Error(error.message);
  return data as { id: string; request_no: string };
}

export async function updateRequest(sb: SupabaseClient, id: string, patch: RequestPatch): Promise<void> {
  const { error } = await sb.from("quotation_requests").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteRequest(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("quotation_requests").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addEvent(
  sb: SupabaseClient,
  requestId: string,
  eventType: EventType,
  body: string,
  author: string | null,
): Promise<void> {
  const { error } = await sb
    .from("quotation_request_events")
    .insert({ request_id: requestId, event_type: eventType, body, author });
  if (error) throw new Error(error.message);
}

/** Lie le devis officiel (PDR pour les pièces, SAV sinon) à la demande. */
export async function linkQuote(
  sb: SupabaseClient,
  request: Pick<RegisterRow, "id" | "request_type">,
  docId: string,
): Promise<void> {
  const field = request.request_type === "spare_parts" ? "pdr_document_id" : "sav_document_id";
  await updateRequest(sb, request.id, { [field]: docId });
}

// ── Indicateurs ─────────────────────────────────────────────────────────────

export interface RegisterKpis {
  total: number;
  toCost: number;          // à chiffrer (y compris informations manquantes)
  pendingDg: number;       // en attente d'approbation du DG
  sent: number;            // envoyés et encore ouverts (envoi + négociation)
  won: number;
  blocked: number;
  overdue: number;
  pipeline: Record<string, number>;   // montant du pipeline par devise
  conversion: number | null;          // gagnés / envoyés au client (%)
  avgDaysToSend: number | null;
}

export function computeRegisterKpis(rows: RegisterRow[]): RegisterKpis {
  const pipeline: Record<string, number> = {};
  let sentEver = 0, won = 0, daysSum = 0, daysN = 0;
  for (const r of rows) {
    if (PIPELINE_STAGES.includes(r.stage) && r.total_quote_amount != null) {
      const c = r.currency ?? "USD";
      pipeline[c] = (pipeline[c] ?? 0) + Number(r.total_quote_amount);
    }
    if (r.sent_to_client_at) sentEver += 1;
    if (r.stage === "won") won += 1;
    if (r.days_total != null && r.sent_to_client_at) { daysSum += r.days_total; daysN += 1; }
  }
  return {
    total: rows.length,
    toCost: rows.filter((r) => r.stage === "to_cost" || r.stage === "info_missing" || r.stage === "costing").length,
    pendingDg: rows.filter((r) => r.stage === "pending_gm").length,
    sent: rows.filter((r) => PIPELINE_STAGES.includes(r.stage)).length,
    won,
    blocked: rows.filter((r) => r.is_blocked).length,
    overdue: rows.filter((r) => r.is_overdue).length,
    pipeline,
    conversion: sentEver > 0 ? Math.round((won / sentEver) * 100) : null,
    avgDaysToSend: daysN > 0 ? Math.round((daysSum / daysN) * 10) / 10 : null,
  };
}

/** Why is this request not moving? Plain-language sentence for the "blocking point" column. */
export function blockingReason(r: RegisterRow): string | null {
  if (r.closed_at) return null;
  if (r.missing_info?.trim()) return `Missing information: ${r.missing_info.trim()}`;
  if (r.stage === "revision_requested") return "DG asked for a revision of the quote";
  if (r.stage === "pending_gm") return "Waiting for the DG's approval";
  if (r.stage === "to_cost") return "No quote prepared yet";
  if (r.stage === "ready_to_send") return "Approved — to be sent to the client";
  return null;
}

// ── Export Excel (mise en page du registre d'origine) ───────────────────────

const BLOCKS: Array<{ title: string; cols: Array<{ header: string; width: number; value: (r: RegisterRow) => string | number | Date | null }> }> = [
  {
    title: "1 · INTAKE & CLIENT",
    cols: [
      { header: "Request ID", width: 14, value: (r) => r.request_id },
      { header: "Date Received", width: 14, value: (r) => (r.date_received ? new Date(r.date_received) : null) },
      { header: "Client Name", width: 28, value: (r) => r.client_name },
      { header: "Location / Site", width: 22, value: (r) => r.location_site },
    ],
  },
  {
    title: "2 · TECHNICAL SCOPE",
    cols: [
      { header: "Equipment / Machine Details", width: 28, value: (r) => r.equipment },
      { header: "Serial Number", width: 18, value: (r) => r.serial_number },
      { header: "Request Type", width: 24, value: (r) => REQUEST_TYPE_LABEL[r.request_type] },
    ],
  },
  { title: "3 · PRIORITY", cols: [{ header: "Priority Level", width: 12, value: (r) => PRIORITY_LABEL[r.priority] }] },
  {
    title: "4 · COSTING",
    cols: [
      { header: "Quotation Ref No.", width: 16, value: (r) => r.quotation_ref },
      { header: "Date Prepared", width: 14, value: (r) => (r.date_prepared ? new Date(r.date_prepared) : null) },
      { header: "Total Quote Amount (USD)", width: 20, value: (r) => (r.total_quote_amount != null ? Number(r.total_quote_amount) : null) },
    ],
  },
  {
    title: "5 · MANAGEMENT REVIEW (DG)",
    cols: [
      { header: "GM Approval Status", width: 20, value: (r) => (r.gm_approval_status ? GM_LABEL[r.gm_approval_status] : null) },
      { header: "Date Approved", width: 14, value: (r) => (r.date_approved ? new Date(r.date_approved) : null) },
    ],
  },
  {
    title: "6 · COMMERCIAL",
    cols: [
      { header: "Sent to Client Date", width: 16, value: (r) => (r.sent_to_client_at ? new Date(r.sent_to_client_at) : null) },
      { header: "Commercial Status", width: 18, value: (r) => (r.commercial_status ? COMMERCIAL_LABEL[r.commercial_status] ?? r.commercial_status : null) },
      { header: "PO / WO No.", width: 16, value: (r) => r.po_wo_no },
    ],
  },
  { title: "7 · REMARKS", cols: [{ header: "Remarks", width: 36, value: (r) => r.remarks }] },
];

export async function exportRegisterXlsx(rows: RegisterRow[]): Promise<void> {
  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([import("exceljs"), import("file-saver")]);
  const wb = new ExcelJS.Workbook();
  wb.creator = "Vemat";
  const ws = wb.addWorksheet("Quotation Register", { views: [{ state: "frozen", ySplit: 3, xSplit: 3 }] });

  const flat = BLOCKS.flatMap((b) => b.cols);
  ws.columns = flat.map((c) => ({ width: c.width }));

  const BLUE = "FF3C5E8F", BAND = "FFD9E2F8";
  // Ligne 1 : titre
  ws.mergeCells(1, 1, 1, flat.length);
  const t = ws.getCell(1, 1);
  t.value = "Vemat Westchase — Quotation Tracking Register";
  t.font = { name: "Montserrat", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
  t.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(1).height = 26;

  // Ligne 2 : blocs
  let col = 1;
  for (const b of BLOCKS) {
    const end = col + b.cols.length - 1;
    if (end > col) ws.mergeCells(2, col, 2, end);
    const c = ws.getCell(2, col);
    c.value = b.title;
    c.font = { name: "Roboto", size: 9, bold: true, color: { argb: BLUE } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAND } };
    c.alignment = { vertical: "middle", horizontal: "center" };
    col = end + 1;
  }
  ws.getRow(2).height = 18;

  // Ligne 3 : en-têtes
  flat.forEach((c, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = c.header;
    cell.font = { name: "Roboto", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  ws.getRow(3).height = 32;

  // Lignes de données
  rows.forEach((r, ri) => {
    const row = ws.getRow(4 + ri);
    flat.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      const v = c.value(r);
      cell.value = v as CellValue;
      cell.font = { name: "Roboto", size: 10 };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = { bottom: { style: "thin", color: { argb: "FFD9D9D9" } } };
      if (v instanceof Date) cell.numFmt = "dd/mm/yyyy";
      if (c.header.startsWith("Total Quote")) cell.numFmt = "#,##0.00";
      if (r.stage === "won") cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF8F1" } };
      else if (r.stage === "revision_requested") cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF8E0" } };
      if (c.header === "Priority Level" && r.priority === "high") {
        cell.font = { name: "Roboto", size: 10, bold: true, color: { argb: "FFC5211F" } };
      }
    });
    row.height = 20;
  });
  ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: flat.length } };

  const buf = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `Vemat-Westchase-Quotation-Register-${stamp}.xlsx`);
}
