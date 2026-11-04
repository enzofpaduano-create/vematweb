import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ExternalLink, FilePlus2, Loader2, Send, ShieldCheck, ShieldAlert, X } from "lucide-react";
import {
  getApprovalSettings, requestValidation, approveValidation, rejectValidation,
  isAlwaysValidated, isDgUser, type ApprovalSettings,
} from "@/lib/approval";
import { sendValidationRequestEmail, sendValidationDecisionEmail } from "@/lib/emailService";
import { updateDocument } from "@/lib/pdrDocuments";
import { updateSavDocument } from "@/lib/savDocuments";
import {
  listEvents, addEvent, updateRequest, blockingReason,
  REQUEST_TYPE_LABEL, REQUEST_TYPE_PORTAL, PRIORITY_LABEL, STAGE_LABEL, STAGE_COLOR, WAITING_ON_LABEL,
  EVENT_LABEL, COMMERCIAL_LABEL, GM_LABEL,
  type RegisterRow, type RequestEvent, type EventType, type RequestPriority, type WaitingOn,
} from "@/lib/quotationRegister";
import { INPUT_CLS, type RegisterPortal } from "./registerContext";
import { AtlascomNumberField } from "./AtlascomNumberField";
import { ATLASCOM_NUMBERING_ENTITIES } from "@/lib/vematEntities";

interface Props {
  ctx: RegisterPortal;
  row: RegisterRow;
  onClose: () => void;
  onChanged: () => void;
}

const COMMERCIAL_OPTIONS = ["en_cours", "negociation", "gagne", "perdu", "sans_suite", "annule"] as const;

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB");
}
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function RequestPanel({ ctx, row, onClose, onChanged }: Props) {
  const { sb, portal, userEmail, base, accent } = ctx;
  const [settings, setSettings] = useState<ApprovalSettings | null>(null);
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteType, setNoteType] = useState<EventType>("note");
  const [noteText, setNoteText] = useState("");
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  // Editable follow-up fields
  const [missing, setMissing] = useState(row.missing_info ?? "");
  const [waitingOn, setWaitingOn] = useState<WaitingOn | "">(row.waiting_on ?? "");
  const [followUp, setFollowUp] = useState(row.next_follow_up_at ?? "");
  const [priority, setPriority] = useState<RequestPriority>(row.priority);
  const [poRef, setPoRef] = useState(row.po_wo_no ?? "");
  const [owner, setOwner] = useState(row.costing_owner ?? "");
  const [remarks, setRemarks] = useState(row.remarks ?? "");

  useEffect(() => {
    setMissing(row.missing_info ?? ""); setWaitingOn(row.waiting_on ?? ""); setFollowUp(row.next_follow_up_at ?? "");
    setPriority(row.priority); setPoRef(row.po_wo_no ?? ""); setOwner(row.costing_owner ?? ""); setRemarks(row.remarks ?? "");
    setRejectMode(false); setRejectNote(""); setError(null);
  }, [row.id, row.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getApprovalSettings(sb, portal).then(setSettings).catch(() => {});
  }, [sb, portal]);

  const loadEvents = useCallback(() => {
    listEvents(sb, row.id).then(setEvents).catch(() => {});
  }, [sb, row.id]);
  useEffect(loadEvents, [loadEvents, row.updated_at]);

  const quotePortal = REQUEST_TYPE_PORTAL[row.request_type];
  const sameDesk = quotePortal === portal;
  const docId = row.pdr_document_id ?? row.sav_document_id;
  const hasQuote = !!docId;
  const table = row.pdr_document_id ? "pdr_documents" : "sav_documents";
  const deskBase = quotePortal === "pdr" ? "/espace-pdr" : "/espace-sav";
  const mandatory = isAlwaysValidated(row.entity, settings);
  const iAmDg = isDgUser(userEmail, settings);
  const docUrl = docId && typeof window !== "undefined" ? `${window.location.origin}${deskBase}/document/${docId}` : undefined;
  const currency = (row.currency === "EUR" ? "EUR" : "USD") as "EUR" | "USD";

  async function run(fn: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await fn(); onChanged(); loadEvents(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const log = (type: EventType, body: string) => addEvent(sb, row.id, type, body, userEmail).catch(() => {});

  const saveFollowUp = () => run(async () => {
    await updateRequest(sb, row.id, {
      missing_info: missing.trim() || null,
      waiting_on: waitingOn || null,
      next_follow_up_at: followUp || null,
      priority,
      costing_owner: owner.trim() || null,
      notes: remarks.trim() || null,
      client_po_ref: poRef.trim() || null,
    });
    if ((row.missing_info ?? "") !== missing.trim()) {
      await log(missing.trim() ? "info_requested" : "info_received",
        missing.trim() ? `Information missing: ${missing.trim()}` : `Information received (was: ${row.missing_info})`);
    }
  });

  const addNote = () => run(async () => {
    if (!noteText.trim()) return;
    await addEvent(sb, row.id, noteType, noteText.trim(), userEmail);
    setNoteText("");
  });

  const requestDg = () => run(async () => {
    if (!docId) return;
    await requestValidation(sb, table, docId);
    if (settings?.manager_email) {
      await sendValidationRequestEmail({
        portal: portal === "pdr" ? "PDR" : "SAV",
        reference: row.quotation_ref,
        clientName: row.client_name,
        totalAmount: Number(row.total_quote_amount ?? 0),
        currency,
        reasons: mandatory ? ["DG approval is mandatory for every Westchase quote"] : [],
        requestedBy: userEmail ?? undefined,
        managerEmail: settings.manager_email,
        docUrl,
      });
    }
    await log("status", `DG approval requested for ${row.quotation_ref ?? "the quote"}`);
  });

  const decide = (decision: "approved" | "rejected") => run(async () => {
    if (!docId) return;
    const by = userEmail ?? "manager";
    if (decision === "approved") await approveValidation(sb, table, docId, by);
    else {
      if (!rejectNote.trim()) throw new Error("A reason is required to ask for a revision.");
      await rejectValidation(sb, table, docId, by, rejectNote.trim());
    }
    await sendValidationDecisionEmail({
      portal: portal === "pdr" ? "PDR" : "SAV",
      reference: row.quotation_ref,
      clientName: row.client_name,
      decision,
      decidedBy: by,
      note: decision === "rejected" ? rejectNote.trim() : undefined,
      docUrl,
    }).catch(() => {});
    await log("status", decision === "approved" ? `${row.quotation_ref} approved by ${by}` : `${row.quotation_ref}: revision requested — ${rejectNote.trim()}`);
    setRejectMode(false); setRejectNote("");
  });

  const markSent = () => run(async () => {
    if (!docId) return;
    if (portal === "pdr") await updateDocument(docId, { communication_status: "communique" });
    else await updateSavDocument(docId, { status: "envoye", communication_status: "communique" });
    await log("status", `${row.quotation_ref} sent to the client`);
  });

  const setCommercial = (value: string) => run(async () => {
    if (!docId) return;
    if (portal === "pdr") await updateDocument(docId, { commercial_status: value as never });
    else await updateSavDocument(docId, { commercial_status: value as never });
    await log("status", `Commercial status → ${COMMERCIAL_LABEL[value] ?? value}`);
  });

  const closeRequest = (close: boolean) => run(async () => {
    await updateRequest(sb, row.id, { closed_at: close ? new Date().toISOString() : null, closed_note: close ? (noteText.trim() || null) : null });
    await log("status", close ? `Request closed${noteText.trim() ? `: ${noteText.trim()}` : ""}` : "Request reopened");
    if (close) setNoteText("");
  });

  const reason = blockingReason(row);
  const label = "block text-[11px] font-bold text-zinc-500 mb-1";
  const sentAlready = row.communication_status === "communique";
  const needsAtlascomNo = hasQuote && !row.quotation_ref && ATLASCOM_NUMBERING_ENTITIES.includes(row.entity);
  const canSend = hasQuote && !sentAlready && !needsAtlascomNo && row.gm_approval_status === "approved";
  const canSendNoApproval = hasQuote && !sentAlready && !needsAtlascomNo && !mandatory && row.gm_approval_status !== "pending" && row.gm_approval_status !== "rejected";

  return (
    <aside className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white border-l border-zinc-200 shadow-2xl z-50 overflow-y-auto" aria-label="Request details">
      <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-start justify-between z-10">
        <div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{REQUEST_TYPE_LABEL[row.request_type]}</p>
          <h2 className="text-xl font-black font-mono text-zinc-950">{row.request_id}</h2>
          <p className="text-sm text-zinc-600">{row.client_name}</p>
          <span className={`inline-block mt-2 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded ${STAGE_COLOR[row.stage]}`}>{STAGE_LABEL[row.stage]}</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100" aria-label="Close"><X className="w-4 h-4" /></button>
      </div>

      <div className="p-5 space-y-5">
        {reason && (
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{reason}</p>
              {row.is_overdue && <p className="text-xs mt-0.5">Open for {row.days_open} days without being sent.</p>}
            </div>
          </div>
        )}

        {/* Résumé */}
        <section className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div><p className={label}>Received</p><p className="font-semibold">{fmtDate(row.date_received)}{row.received_via ? ` · ${row.received_via}` : ""}</p></div>
          <div><p className={label}>Priority</p><p className="font-semibold">{PRIORITY_LABEL[row.priority]}</p></div>
          <div><p className={label}>Site</p><p className="font-semibold">{row.location_site || "—"}</p></div>
          <div><p className={label}>Machine</p><p className="font-semibold">{row.equipment || "—"}{row.serial_number ? ` · s/n ${row.serial_number}` : ""}</p></div>
          <div><p className={label}>Contact</p><p className="font-semibold">{row.contact_name || "—"}</p><p className="text-xs text-zinc-500">{row.contact_email}</p></div>
          <div><p className={label}>Logged by</p><p className="font-semibold">{row.logged_by || "—"}</p></div>
          {row.request_details && <div className="col-span-2"><p className={label}>Request</p><p className="whitespace-pre-wrap">{row.request_details}</p></div>}
        </section>

        {/* Devis */}
        <section className="rounded-xl border border-zinc-200 p-4">
          <h3 className="font-black text-zinc-950 mb-2">Quote</h3>
          {!hasQuote ? (
            <>
              <p className="text-sm text-zinc-600 mb-3">No quote prepared yet. Once it is created, enter the official quote number generated by Atlascom (DE26…).</p>
              {sameDesk ? (
                <Link href={`${base}/${portal === "pdr" ? "devis/nouveau" : "offre/nouvelle"}?request=${row.id}`}>
                  <span className={`inline-flex items-center gap-2 text-sm font-bold rounded-xl px-4 py-2.5 cursor-pointer ${accent.solid}`}>
                    <FilePlus2 className="w-4 h-4" /> Create the quote
                  </span>
                </Link>
              ) : (
                <p className="text-xs text-amber-700">
                  This {REQUEST_TYPE_LABEL[row.request_type].toLowerCase()} quote is prepared in the {quotePortal.toUpperCase()} portal.
                </p>
              )}
            </>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-zinc-950">{row.quotation_ref ?? <span className="text-amber-600 font-bold text-sm">Atlascom number to enter</span>}</span>
                <Link href={`${deskBase}/document/${docId}`}>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-zinc-950 cursor-pointer">
                    Open <ExternalLink className="w-3 h-3" />
                  </span>
                </Link>
              </div>
              {ATLASCOM_NUMBERING_ENTITIES.includes(row.entity) && sameDesk && (
                <div>
                  <p className={label}>Quote number generated by Atlascom</p>
                  <AtlascomNumberField
                    ring={accent.ring}
                    value={row.quotation_ref}
                    disabled={sentAlready}
                    onSave={async (ref) => {
                      if (portal === "pdr") await updateDocument(docId!, { reference: ref });
                      else await updateSavDocument(docId!, { reference: ref });
                      await addEvent(sb, row.id, "status", ref ? `Atlascom quote number entered: ${ref}` : "Atlascom quote number cleared", userEmail).catch(() => {});
                      onChanged(); loadEvents();
                    }}
                  />
                </div>
              )}
              <p className="text-zinc-700">
                {row.total_quote_amount != null ? `${Number(row.total_quote_amount).toLocaleString("en-GB", { minimumFractionDigits: 2 })} ${row.currency ?? ""}` : "Amount not set"}
                {" · "}prepared {fmtDate(row.date_prepared)}
              </p>

              {/* Approbation du DG */}
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className={label}>DG approval</p>
                <p className="font-semibold mb-2">{row.gm_approval_status ? GM_LABEL[row.gm_approval_status] : "—"}{row.date_approved ? ` · ${fmtDate(row.date_approved)}` : ""}</p>
                {sameDesk && (row.gm_approval_status === "not_required" || row.gm_approval_status === "rejected") && (
                  <button onClick={requestDg} disabled={busy || !settings?.manager_email}
                    className="inline-flex items-center gap-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg px-3 py-2 disabled:opacity-60">
                    <ShieldAlert className="w-3.5 h-3.5" /> {row.gm_approval_status === "rejected" ? "Send back to the DG" : "Request DG approval"}
                  </button>
                )}
                {sameDesk && row.gm_approval_status === "pending" && (
                  iAmDg || !mandatory ? (
                    !rejectMode ? (
                      <div className="flex gap-2">
                        <button onClick={() => decide("approved")} disabled={busy} className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-2 disabled:opacity-60">
                          <ShieldCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => setRejectMode(true)} disabled={busy} className="text-xs font-bold border border-red-300 text-red-700 rounded-lg px-3 py-2 hover:border-red-500">
                          Ask for a revision
                        </button>
                      </div>
                    ) : (
                      <div>
                        <textarea className={`${INPUT_CLS} min-h-[56px] mb-2`} placeholder="What must be revised? (required)" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
                        <div className="flex gap-2">
                          <button onClick={() => decide("rejected")} disabled={busy || !rejectNote.trim()} className="text-xs font-bold bg-red-600 text-white rounded-lg px-3 py-2 disabled:opacity-60">Confirm</button>
                          <button onClick={() => setRejectMode(false)} className="text-xs text-zinc-500 px-2">Cancel</button>
                        </div>
                      </div>
                    )
                  ) : (
                    <p className="text-xs text-amber-700">Waiting for the DG ({settings?.manager_email}).</p>
                  )
                )}
                {!settings?.manager_email && <p className="text-xs text-red-600 mt-1">No DG e-mail configured in Settings.</p>}
              </div>

              {/* Envoi et issue commerciale */}
              {sameDesk && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className={label}>Sent to client</p>
                    {sentAlready ? (
                      <p className="font-semibold">{fmtDate(row.sent_to_client_at)}</p>
                    ) : (
                      <button onClick={markSent} disabled={busy || !(canSend || canSendNoApproval)}
                        title={canSend || canSendNoApproval ? undefined : needsAtlascomNo ? "Enter the Atlascom quote number first" : "The DG must approve the quote first"}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-lg px-3 py-2 disabled:opacity-50 ${accent.solid}`}>
                        <Send className="w-3.5 h-3.5" /> Mark as sent
                      </button>
                    )}
                  </div>
                  <div>
                    <p className={label}>Commercial status</p>
                    <select className={`${INPUT_CLS} ${accent.ring}`} value={row.commercial_status ?? "en_cours"} onChange={(e) => setCommercial(e.target.value)} disabled={busy}>
                      {COMMERCIAL_OPTIONS.map((c) => <option key={c} value={c}>{COMMERCIAL_LABEL[c]}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {!sameDesk && <p className="text-xs text-zinc-500">Approval, sending and commercial status for this quote are handled in the {quotePortal.toUpperCase()} portal.</p>}
            </div>
          )}
        </section>

        {/* Suivi */}
        <section className="rounded-xl border border-zinc-200 p-4 space-y-3">
          <h3 className="font-black text-zinc-950">Follow-up</h3>
          <div>
            <label className={label}>Missing information</label>
            <input className={`${INPUT_CLS} ${accent.ring}`} value={missing} onChange={(e) => setMissing(e.target.value)} placeholder="Empty = nothing blocks the quote" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Waiting on</label>
              <select className={`${INPUT_CLS} ${accent.ring}`} value={waitingOn} onChange={(e) => setWaitingOn(e.target.value as WaitingOn | "")}>
                <option value="">—</option>
                {(Object.keys(WAITING_ON_LABEL) as WaitingOn[]).map((w) => <option key={w} value={w}>{WAITING_ON_LABEL[w]}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Next follow-up</label>
              <input type="date" className={`${INPUT_CLS} ${accent.ring}`} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
            </div>
            <div>
              <label className={label}>Priority</label>
              <select className={`${INPUT_CLS} ${accent.ring}`} value={priority} onChange={(e) => setPriority(e.target.value as RequestPriority)}>
                {(Object.keys(PRIORITY_LABEL) as RequestPriority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Costing owner</label>
              <input className={`${INPUT_CLS} ${accent.ring}`} value={owner} onChange={(e) => setOwner(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label}>Client PO / WO number</label>
            <input className={`${INPUT_CLS} ${accent.ring}`} value={poRef} onChange={(e) => setPoRef(e.target.value)} placeholder="Filled when the client orders" />
          </div>
          <div>
            <label className={label}>Remarks</label>
            <textarea className={`${INPUT_CLS} ${accent.ring} min-h-[56px]`} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
          <button onClick={saveFollowUp} disabled={busy} className={`inline-flex items-center gap-2 text-sm font-bold rounded-xl px-4 py-2 disabled:opacity-60 ${accent.solid}`}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save
          </button>
        </section>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        {/* Journal */}
        <section>
          <h3 className="font-black text-zinc-950 mb-2">Journal</h3>
          <div className="flex gap-2 mb-2">
            <select className={`${INPUT_CLS} ${accent.ring} w-40 shrink-0`} value={noteType} onChange={(e) => setNoteType(e.target.value as EventType)}>
              {(["note", "info_requested", "info_received", "follow_up"] as EventType[]).map((t) => <option key={t} value={t}>{EVENT_LABEL[t]}</option>)}
            </select>
            <input className={`${INPUT_CLS} ${accent.ring}`} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note…"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void addNote(); } }} />
            <button onClick={addNote} disabled={busy || !noteText.trim()} className={`shrink-0 text-xs font-bold rounded-lg px-3 disabled:opacity-50 ${accent.solid}`}>Add</button>
          </div>
          <ul className="space-y-2">
            {events.length === 0 && <li className="text-xs text-zinc-400">No entry yet.</li>}
            {events.map((ev) => (
              <li key={ev.id} className="text-sm border-l-2 border-zinc-200 pl-3">
                <p className="text-[11px] text-zinc-400">{fmtDateTime(ev.created_at)} · {EVENT_LABEL[ev.event_type]}{ev.author ? ` · ${ev.author}` : ""}</p>
                <p className="text-zinc-800">{ev.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="pt-2 border-t border-zinc-100">
          {row.closed_at ? (
            <button onClick={() => closeRequest(false)} disabled={busy} className="text-xs font-bold text-zinc-600 hover:text-zinc-950 underline">Reopen this request (closed {fmtDate(row.closed_at)})</button>
          ) : (
            <button onClick={() => closeRequest(true)} disabled={busy} className="text-xs font-bold text-zinc-500 hover:text-red-600 underline" title="Closes the request without a quote (duplicate, withdrawn…). The text typed in the journal field is kept as the reason.">
              Close this request without a quote
            </button>
          )}
        </section>
      </div>
    </aside>
  );
}
