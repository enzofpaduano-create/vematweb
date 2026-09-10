import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, AlertCircle, FileDown, ArrowRight, Check, Loader2, Pencil, Eye, FileText, Users, Wrench, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import {
  getDocument, getChain, updateDocument, getChildrenByType, canEditDocument,
  computeTotals, lineDiscountedUnit, lineTotal,
  DOC_LABEL, DOC_LABEL_SHORT, NEXT_STEPS, formatMoney, formatNaira, templateModel,
  SOURCE_LABEL, COMM_STATUS_LABEL, COMM_STATUS_COLOR,
  COMMERCIAL_STATUS_LABEL, COMMERCIAL_STATUS_COLOR,
  type PdrDocument, type PdrDocType,
  type PdrCommStatus, type PdrCommercialStatus,
} from "@/lib/pdrDocuments";
import {
  getApprovalSettings, docNeedsValidation, isSendBlocked,
  requestValidation, approveValidation, rejectValidation, clearValidation,
  VALIDATION_STATUS_LABEL, VALIDATION_STATUS_COLOR,
  type ApprovalSettings,
} from "@/lib/approval";
import { supabasePdr } from "@/lib/supabase";
import { usePdrAuth } from "@/contexts/PdrAuthContext";
import { sendValidationRequestEmail, sendValidationDecisionEmail } from "@/lib/emailService";

const STATUS_OPTIONS = ["brouillon", "envoye", "accepte", "refuse", "en_cours", "termine"];
const STATUS_LABEL: Record<string, string> = {
  brouillon: "Draft", envoye: "Sent", accepte: "Accepted",
  refuse: "Rejected", en_cours: "In progress", termine: "Completed",
};

export default function PdrDocumentDetail() {
  const [, params] = useRoute<{ id: string }>("/espace-pdr/document/:id");
  const [, navigate] = useLocation();
  const id = params?.id;

  const [doc, setDoc] = useState<PdrDocument | null>(null);
  const [chain, setChain] = useState<PdrDocument[]>([]);
  const [childrenByType, setChildrenByType] = useState<Partial<Record<PdrDocType, PdrDocument>>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmType, setConfirmType] = useState<PdrDocType | null>(null);
  const [approvalSettings, setApprovalSettings] = useState<ApprovalSettings | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [busyValidation, setBusyValidation] = useState(false);
  const { user } = usePdrAuth();

  const reload = async () => {
    if (!id) return;
    try {
      const d = await getDocument(id);
      if (!d) { setError("Document not found."); setLoading(false); return; }
      setDoc(d);
      const [ch, kids] = await Promise.all([getChain(d), getChildrenByType(d.id)]);
      setChain(ch);
      setChildrenByType(kids);
      setLoading(false);
    } catch (e) { setError((e as Error).message); setLoading(false); }
  };

  useEffect(() => { setLoading(true); reload(); }, [id]);

  useEffect(() => {
    let cancelled = false;
    getApprovalSettings(supabasePdr, "pdr")
      .then((s) => { if (!cancelled) setApprovalSettings(s); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const [genWord, setGenWord] = useState(false);
  const [genZip, setGenZip] = useState(false);
  const [genPdf, setGenPdf] = useState(false);
  const [genXlsx, setGenXlsx] = useState(false);
  const busy = genWord || genZip || genPdf || genXlsx;

  async function handleWord() {
    if (!doc) return;
    setGenWord(true);
    try {
      const { generateOfferDocx } = await import("@/lib/pdrOfferDocx");
      await generateOfferDocx(doc);
    }
    catch (e) { setError((e as Error).message); }
    finally { setGenWord(false); }
  }

  async function handlePdfView() {
    if (!doc) return;
    setGenPdf(true);
    try {
      const { viewPdrPdf } = await import("@/lib/pdrOfferPdf");
      await viewPdrPdf(doc);
    } catch (e) { setError((e as Error).message); }
    finally { setGenPdf(false); }
  }

  async function handlePdfDownload() {
    if (!doc) return;
    setGenPdf(true);
    try {
      const { downloadPdrPdf } = await import("@/lib/pdrOfferPdf");
      await downloadPdrPdf(doc);
    } catch (e) { setError((e as Error).message); }
    finally { setGenPdf(false); }
  }

  async function handleExcel() {
    if (!doc) return;
    setGenXlsx(true);
    try {
      const { downloadPdrXlsx } = await import("@/lib/pdrOfferXlsx");
      await downloadPdrXlsx(doc);
    } catch (e) { setError((e as Error).message); }
    finally { setGenXlsx(false); }
  }

  async function handleChainZip() {
    if (chain.length === 0) return;
    setGenZip(true);
    try {
      const { downloadPdrChainZip } = await import("@/lib/pdrOfferDocx");
      await downloadPdrChainZip(chain);
    } catch (e) { setError((e as Error).message); }
    finally { setGenZip(false); }
  }

  function goConvert(toType: PdrDocType) {
    if (!doc) return;
    const existing = childrenByType[toType];
    if (existing) {
      setConfirmType(toType);
      return;
    }
    navigate(`/espace-pdr/document/${doc.id}/convert/${toType}`);
  }

  async function handleStatus(status: string) {
    if (!doc) return;
    await updateDocument(doc.id, { status });
    setDoc({ ...doc, status });
  }

  async function handleCommStatus(next: PdrCommStatus) {
    if (!doc) return;
    // Business rule: cannot mark as 'communique' if validation is pending or rejected.
    if (next === "communique" && isSendBlocked(doc.validation_status)) {
      setError("Cannot mark as Sent — this document is waiting for Manager validation.");
      return;
    }
    await updateDocument(doc.id, { communication_status: next });
    const fresh = await getDocument(doc.id);
    if (fresh) setDoc(fresh);
  }

  async function handleCommercialStatus(next: PdrCommercialStatus) {
    if (!doc) return;
    await updateDocument(doc.id, { commercial_status: next });
    setDoc({ ...doc, commercial_status: next });
  }

  const validationCheck = doc && approvalSettings
    ? docNeedsValidation(doc, approvalSettings)
    : { needsValidation: false, reasons: [] };
  const sendBlocked = doc ? isSendBlocked(doc.validation_status) : false;

  async function handleRequestValidation() {
    if (!doc || !approvalSettings) return;
    setBusyValidation(true);
    try {
      await requestValidation(supabasePdr, "pdr_documents", doc.id);
      const fresh = await getDocument(doc.id);
      if (fresh) setDoc(fresh);
      if (approvalSettings.manager_email) {
        await sendValidationRequestEmail({
          portal: "PDR",
          reference: doc.reference,
          clientName: doc.client_company || doc.client_name || "—",
          totalAmount: doc.total_amount,
          currency: doc.currency,
          reasons: validationCheck.reasons,
          requestedBy: user?.email ?? doc.assigned_agent ?? undefined,
          managerEmail: approvalSettings.manager_email,
          docUrl: typeof window !== "undefined" ? `${window.location.origin}/espace-pdr/document/${doc.id}` : undefined,
        });
      }
    } catch (e) { setError((e as Error).message); }
    finally { setBusyValidation(false); }
  }

  async function handleApprove() {
    if (!doc) return;
    setBusyValidation(true);
    try {
      const decidedBy = user?.email ?? "manager";
      await approveValidation(supabasePdr, "pdr_documents", doc.id, decidedBy);
      const fresh = await getDocument(doc.id);
      if (fresh) setDoc(fresh);
      if (doc.assigned_agent) {
        await sendValidationDecisionEmail({
          portal: "PDR",
          reference: doc.reference,
          clientName: doc.client_company || doc.client_name || "—",
          decision: "approved",
          decidedBy,
          requesterEmail: doc.assigned_agent.includes("@") ? doc.assigned_agent : undefined,
          docUrl: typeof window !== "undefined" ? `${window.location.origin}/espace-pdr/document/${doc.id}` : undefined,
        });
      }
    } catch (e) { setError((e as Error).message); }
    finally { setBusyValidation(false); }
  }

  async function handleReject() {
    if (!doc) return;
    if (!rejectNote.trim()) { setError("A reason is required to reject."); return; }
    setBusyValidation(true);
    try {
      const decidedBy = user?.email ?? "manager";
      await rejectValidation(supabasePdr, "pdr_documents", doc.id, decidedBy, rejectNote.trim());
      const fresh = await getDocument(doc.id);
      if (fresh) setDoc(fresh);
      setRejectMode(false); setRejectNote("");
      if (doc.assigned_agent) {
        await sendValidationDecisionEmail({
          portal: "PDR",
          reference: doc.reference,
          clientName: doc.client_company || doc.client_name || "—",
          decision: "rejected",
          decidedBy,
          note: rejectNote.trim(),
          requesterEmail: doc.assigned_agent.includes("@") ? doc.assigned_agent : undefined,
          docUrl: typeof window !== "undefined" ? `${window.location.origin}/espace-pdr/document/${doc.id}` : undefined,
        });
      }
    } catch (e) { setError((e as Error).message); }
    finally { setBusyValidation(false); }
  }

  async function handleClearValidation() {
    if (!doc) return;
    setBusyValidation(true);
    try {
      await clearValidation(supabasePdr, "pdr_documents", doc.id);
      const fresh = await getDocument(doc.id);
      if (fresh) setDoc(fresh);
    } catch (e) { setError((e as Error).message); }
    finally { setBusyValidation(false); }
  }

  const totals = doc ? computeTotals(doc) : null;
  const hasKids = Object.keys(childrenByType).length > 0;
  const editable = doc ? canEditDocument(doc, hasKids) : false;

  return (
    <PdrGuard>
      <PdrLayout>
        <div className="p-6 lg:p-10 max-w-4xl mx-auto">
          <button onClick={() => navigate("/espace-pdr/documents")} className="text-xs text-zinc-500 hover:text-sky-600 inline-flex items-center gap-1 mb-4 transition-colors">
            <ArrowLeft className="h-3 w-3" /> All documents
          </button>

          {loading && <p className="text-zinc-400 text-sm py-20 text-center animate-pulse">Loading…</p>}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" /><p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {doc && totals && (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black text-sky-600 mb-1">{DOC_LABEL[doc.type]}</p>
                  <h1 className="text-3xl font-black text-zinc-950 font-mono">{doc.reference}</h1>
                  <p className="text-zinc-500 text-sm mt-1">{new Date(doc.created_at).toLocaleDateString("en-GB")} · Word template {templateModel(doc.currency, totals.hasCustoms)} · {doc.currency}{totals.hasCustoms ? " + NAIRA" : ""}{doc.apply_vat ? ` · VAT ${doc.vat_rate}%` : ""}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {editable && (
                    <Link href={`/espace-pdr/document/${doc.id}/edit`}>
                      <span className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 hover:border-sky-300 text-zinc-700 font-bold text-sm px-3 py-2 rounded-xl transition-colors cursor-pointer">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </span>
                    </Link>
                  )}
                  <select value={doc.status} onChange={(e) => handleStatus(e.target.value)} className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 focus:outline-none focus:border-sky-400">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>)}
                  </select>
                </div>
              </div>

              {chain.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-6 bg-white rounded-2xl border border-zinc-200 p-3">
                  {chain.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-1.5">
                      {i > 0 && <ArrowRight className="w-3 h-3 text-zinc-300" />}
                      <Link href={`/espace-pdr/document/${c.id}`}>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${c.id === doc.id ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>{DOC_LABEL_SHORT[c.type]}</span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {/* Manager validation workflow (Hassan Phase 3) */}
              {(validationCheck.needsValidation || doc.validation_status !== "not_required") && (
                <section className={`rounded-2xl border p-6 mb-5 ${
                  doc.validation_status === "approved" ? "bg-emerald-50 border-emerald-200"
                  : doc.validation_status === "rejected" ? "bg-red-50 border-red-200"
                  : doc.validation_status === "pending" ? "bg-amber-50 border-amber-200"
                  : "bg-white border-zinc-200"
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {doc.validation_status === "approved" && <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                    {doc.validation_status === "rejected" && <ShieldAlert className="w-5 h-5 text-red-600" />}
                    {doc.validation_status === "pending" && <ShieldQuestion className="w-5 h-5 text-amber-600" />}
                    {doc.validation_status === "not_required" && <ShieldQuestion className="w-5 h-5 text-zinc-500" />}
                    <h2 className="font-black text-zinc-950">Manager validation</h2>
                    <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded ${VALIDATION_STATUS_COLOR[doc.validation_status]}`}>
                      {VALIDATION_STATUS_LABEL[doc.validation_status]}
                    </span>
                  </div>

                  {validationCheck.needsValidation && doc.validation_status === "not_required" && (
                    <>
                      <p className="text-sm text-zinc-700 mb-1">This document meets the criteria for Manager approval:</p>
                      <ul className="text-sm text-zinc-700 mb-3 pl-4 list-disc">
                        {validationCheck.reasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                      <p className="text-xs text-zinc-500 mb-3">Once submitted, the document cannot be sent to the client until the Manager approves it.</p>
                      <button
                        onClick={handleRequestValidation}
                        disabled={busyValidation || !approvalSettings?.manager_email}
                        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                      >
                        {busyValidation ? "Requesting…" : "Request Manager validation"}
                      </button>
                      {!approvalSettings?.manager_email && (
                        <p className="text-xs text-red-600 mt-2">
                          ⚠ No manager email configured in <Link href="/espace-pdr/reglages" className="underline">Settings</Link>. Set one before requesting validation.
                        </p>
                      )}
                    </>
                  )}

                  {doc.validation_status === "pending" && (
                    <>
                      <p className="text-sm text-zinc-700 mb-3">
                        Requested {doc.validation_requested_at ? new Date(doc.validation_requested_at).toLocaleString("en-GB") : "—"}.
                        Sending to client is blocked until approval.
                      </p>
                      {!rejectMode && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={handleApprove}
                            disabled={busyValidation}
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl disabled:opacity-60"
                          >
                            <ShieldCheck className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => setRejectMode(true)}
                            disabled={busyValidation}
                            className="inline-flex items-center gap-2 bg-white border border-red-300 hover:border-red-500 text-red-700 font-bold text-sm px-4 py-2.5 rounded-xl disabled:opacity-60"
                          >
                            <ShieldAlert className="w-4 h-4" /> Reject
                          </button>
                          <button
                            onClick={handleClearValidation}
                            disabled={busyValidation}
                            className="text-xs text-zinc-500 hover:text-zinc-800 px-2"
                          >
                            Cancel request
                          </button>
                        </div>
                      )}
                      {rejectMode && (
                        <div className="border border-red-200 rounded-xl p-3 bg-white">
                          <label className="block text-xs font-bold text-zinc-500 mb-1.5">Reason for rejection (required)</label>
                          <textarea
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 min-h-[60px] mb-2"
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="Why is this quote being rejected? What should be changed?"
                          />
                          <div className="flex gap-2">
                            <button onClick={handleReject} disabled={busyValidation || !rejectNote.trim()} className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg disabled:opacity-60">Confirm reject</button>
                            <button onClick={() => { setRejectMode(false); setRejectNote(""); }} className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 px-2">Cancel</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {doc.validation_status === "approved" && (
                    <>
                      <p className="text-sm text-emerald-800 mb-2">
                        ✓ Approved by <strong>{doc.validation_decided_by ?? "manager"}</strong>
                        {doc.validation_decided_at && ` on ${new Date(doc.validation_decided_at).toLocaleString("en-GB")}`}.
                        You can now mark this document as Sent below.
                      </p>
                      {doc.validation_note && <p className="text-xs text-emerald-700 italic">"{doc.validation_note}"</p>}
                    </>
                  )}

                  {doc.validation_status === "rejected" && (
                    <>
                      <p className="text-sm text-red-800 mb-2">
                        ✗ Rejected by <strong>{doc.validation_decided_by ?? "manager"}</strong>
                        {doc.validation_decided_at && ` on ${new Date(doc.validation_decided_at).toLocaleString("en-GB")}`}.
                      </p>
                      {doc.validation_note && (
                        <p className="text-sm text-red-700 mb-3 bg-white border border-red-200 rounded-lg p-3 italic">
                          Manager note: "{doc.validation_note}"
                        </p>
                      )}
                      <button
                        onClick={handleRequestValidation}
                        disabled={busyValidation || !approvalSettings?.manager_email}
                        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl disabled:opacity-60"
                      >
                        {busyValidation ? "Resubmitting…" : "Resubmit for validation"}
                      </button>
                    </>
                  )}
                </section>
              )}

              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-4">Tracking</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 mb-1.5">Source / channel</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {doc.source ? SOURCE_LABEL[doc.source] : <span className="text-zinc-400 font-normal">Not set</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 mb-1.5">Assigned agent</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {doc.assigned_agent || <span className="text-zinc-400 font-normal">Not assigned</span>}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1.5">Communication status</label>
                    <select
                      value={doc.communication_status}
                      onChange={(e) => handleCommStatus(e.target.value as PdrCommStatus)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    >
                      {(Object.keys(COMM_STATUS_LABEL) as PdrCommStatus[]).map((s) => (
                        <option key={s} value={s}>{COMM_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded ${COMM_STATUS_COLOR[doc.communication_status]}`}>
                        {COMM_STATUS_LABEL[doc.communication_status]}
                      </span>
                      {doc.sent_at && (
                        <span className="text-[11px] text-zinc-500">
                          Sent {new Date(doc.sent_at).toLocaleString("en-GB")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1.5">Commercial outcome</label>
                    <select
                      value={doc.commercial_status}
                      onChange={(e) => handleCommercialStatus(e.target.value as PdrCommercialStatus)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    >
                      {(Object.keys(COMMERCIAL_STATUS_LABEL) as PdrCommercialStatus[]).map((s) => (
                        <option key={s} value={s}>{COMMERCIAL_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded ${COMMERCIAL_STATUS_COLOR[doc.commercial_status]}`}>
                        {COMMERCIAL_STATUS_LABEL[doc.commercial_status]}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {(doc.client_id || doc.equipment_id) && (
                <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                  <h2 className="font-black text-zinc-950 mb-3">Linked to</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {doc.client_id && (
                      <Link href={`/espace-pdr/client/${doc.client_id}`}>
                        <span className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-sm px-3 py-2 rounded-xl cursor-pointer transition-colors">
                          <Users className="w-4 h-4" /> Client sheet
                        </span>
                      </Link>
                    )}
                    {doc.equipment_id && (
                      <Link href={`/espace-pdr/equipment/${doc.equipment_id}`}>
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-sm px-3 py-2 rounded-xl cursor-pointer transition-colors">
                          <Wrench className="w-4 h-4" /> Equipment 360°
                        </span>
                      </Link>
                    )}
                  </div>
                </section>
              )}

              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-3">Client</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm">
                  <p><span className="text-zinc-500">Company:</span> <span className="font-semibold text-zinc-900">{doc.client_company || "—"}</span></p>
                  <p><span className="text-zinc-500">Attention:</span> <span className="font-semibold text-zinc-900">{doc.attention || "—"}</span></p>
                  <p><span className="text-zinc-500">Machine:</span> <span className="font-semibold text-zinc-900">{doc.machine || "—"}</span></p>
                  <p><span className="text-zinc-500">Client code:</span> <span className="font-semibold text-zinc-900">{doc.client_code || "—"}</span></p>
                  <p><span className="text-zinc-500">Contact:</span> <span className="font-semibold text-zinc-900">{doc.client_name || "—"}</span></p>
                  <p><span className="text-zinc-500">Email:</span> <span className="font-semibold text-zinc-900">{doc.client_email || "—"}</span></p>
                  {doc.client_address && <p className="sm:col-span-2"><span className="text-zinc-500">Address:</span> <span className="font-semibold text-zinc-900 whitespace-pre-line">{doc.client_address}</span></p>}
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-zinc-200 overflow-hidden mb-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left font-bold px-4 py-3">Ref.</th>
                        <th className="text-left font-bold px-4 py-3">Description</th>
                        <th className="text-right font-bold px-4 py-3">Qty</th>
                        <th className="text-left font-bold px-4 py-3">Avail</th>
                        <th className="text-right font-bold px-4 py-3">Unit</th>
                        <th className="text-right font-bold px-4 py-3">Disc.</th>
                        <th className="text-right font-bold px-4 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {doc.items.map((it, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 font-mono text-xs text-zinc-500">{it.reference || "—"}</td>
                          <td className="px-4 py-3 font-semibold text-zinc-900">{it.designation}</td>
                          <td className="px-4 py-3 text-right text-zinc-700">{it.quantity}</td>
                          <td className="px-4 py-3 text-zinc-500">{it.avail || "—"}</td>
                          <td className="px-4 py-3 text-right text-zinc-700">{formatMoney(it.unit_price, doc.currency)}{it.discount_pct > 0 && <span className="block text-[11px] text-zinc-400">→ {formatMoney(lineDiscountedUnit(it), doc.currency)}</span>}</td>
                          <td className="px-4 py-3 text-right text-zinc-500">{it.discount_pct > 0 ? `${it.discount_pct}%` : "—"}</td>
                          <td className="px-4 py-3 text-right font-bold text-zinc-900">{formatMoney(lineTotal(it), doc.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-4 border-t border-zinc-100 space-y-1.5 text-sm max-w-sm ml-auto">
                  <div className="flex justify-between"><span className="text-zinc-500">Subtotal {doc.currency}</span><span className="font-semibold text-zinc-900">{formatMoney(totals.mainSubtotal, doc.currency)}</span></div>
                  {doc.apply_vat && <div className="flex justify-between"><span className="text-zinc-500">VAT {doc.vat_rate}%</span><span className="font-semibold text-zinc-900">{formatMoney(totals.mainVat, doc.currency)}</span></div>}
                  <div className="flex justify-between pt-1.5 border-t border-zinc-100 text-base"><span className="font-black text-zinc-950">Total {doc.currency}</span><span className="font-black text-sky-600">{formatMoney(totals.mainTotal, doc.currency)}</span></div>
                  {totals.hasCustoms && (
                    <>
                      <div className="flex justify-between pt-3"><span className="text-zinc-500">{doc.customs_label || "Customs"} ₦</span><span className="font-semibold text-zinc-900">{formatNaira(totals.nairaSubtotal)}</span></div>
                      {doc.apply_vat && <div className="flex justify-between"><span className="text-zinc-500">VAT {doc.vat_rate}%</span><span className="font-semibold text-zinc-900">{formatNaira(totals.nairaVat)}</span></div>}
                      <div className="flex justify-between pt-1.5 border-t border-zinc-100 text-base"><span className="font-black text-zinc-950">Total ₦</span><span className="font-black text-amber-600">{formatNaira(totals.nairaTotal)}</span></div>
                    </>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-3">Terms</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm">
                  <p><span className="text-zinc-500">Payment terms:</span> <span className="font-semibold text-zinc-900">{doc.payment_terms || "—"}</span></p>
                  <p><span className="text-zinc-500">Validity:</span> <span className="font-semibold text-zinc-900">{doc.validity || "—"}</span></p>
                  <p><span className="text-zinc-500">Delivery terms:</span> <span className="font-semibold text-zinc-900">{doc.delivery_terms || "—"}</span></p>
                  {doc.incoterms_note && <p className="sm:col-span-2"><span className="text-zinc-500">Incoterms:</span> <span className="font-semibold text-zinc-900">{doc.incoterms_note}</span></p>}
                  {doc.notes && <p className="sm:col-span-2"><span className="text-zinc-500">Notes:</span> <span className="font-semibold text-zinc-900 whitespace-pre-line">{doc.notes}</span></p>}
                </div>
              </section>

              {doc.logistics && Object.keys(doc.logistics).length > 0 && (
                <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                  <h2 className="font-black text-zinc-950 mb-3">Logistics</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm">
                    {doc.logistics.branch && <p><span className="text-zinc-500">Branch:</span> <span className="font-semibold text-zinc-900">{doc.logistics.branch === "stock" ? "Stock delivery" : "Factory order"}</span></p>}
                    {doc.logistics.warehouse && <p><span className="text-zinc-500">Warehouse:</span> <span className="font-semibold text-zinc-900">{doc.logistics.warehouse}</span></p>}
                    {doc.logistics.supplier_name && <p><span className="text-zinc-500">Supplier:</span> <span className="font-semibold text-zinc-900">{doc.logistics.supplier_name}</span></p>}
                    {doc.logistics.factory_ref && <p><span className="text-zinc-500">Factory ref:</span> <span className="font-semibold text-zinc-900">{doc.logistics.factory_ref}</span></p>}
                    {doc.logistics.eta && <p><span className="text-zinc-500">ETA:</span> <span className="font-semibold text-zinc-900">{doc.logistics.eta}</span></p>}
                    {doc.logistics.delivery_date && <p><span className="text-zinc-500">Delivery date:</span> <span className="font-semibold text-zinc-900">{doc.logistics.delivery_date}</span></p>}
                    {doc.logistics.carrier && <p><span className="text-zinc-500">Carrier:</span> <span className="font-semibold text-zinc-900">{doc.logistics.carrier}</span></p>}
                    {doc.logistics.received_date && <p><span className="text-zinc-500">Received:</span> <span className="font-semibold text-zinc-900">{doc.logistics.received_date}</span></p>}
                  </div>
                </section>
              )}

              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-4">Generate document</h2>
                <div className="flex flex-wrap gap-3">
                  <button onClick={handlePdfView} disabled={busy}
                    className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                    {genPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    View PDF
                  </button>
                  <button onClick={handlePdfDownload} disabled={busy}
                    className="inline-flex items-center gap-2 bg-white border border-zinc-200 hover:border-sky-300 text-zinc-800 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                    {genPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Download PDF
                  </button>
                  <button onClick={handleExcel} disabled={busy}
                    className="inline-flex items-center gap-2 bg-white border border-zinc-200 hover:border-sky-300 text-zinc-800 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                    {genXlsx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    Download Excel (.xlsx)
                  </button>
                  <button onClick={handleWord} disabled={busy}
                    className="inline-flex items-center gap-2 bg-white border border-zinc-200 hover:border-sky-300 text-zinc-800 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                    {genWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    Download Word (.docx)
                  </button>
                  {chain.length > 1 && (
                    <button onClick={handleChainZip} disabled={busy}
                      className="inline-flex items-center gap-2 bg-white border border-zinc-200 hover:border-sky-300 text-zinc-800 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                      {genZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                      Full chain (ZIP)
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-3">
                  File: <span className="font-mono text-zinc-500">{doc.reference} - {doc.client_company || doc.client_name || "Client"}</span>
                  {" "}(.pdf / .xlsx / .docx)
                  {chain.length > 1 && " · ZIP folders: Offers, PO, DN, Invoices…"}
                  {" · Excel = Westchase offer template (max 8 lines)"}
                </p>
              </section>

              <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                <h2 className="font-black text-zinc-950 mb-4">Next step</h2>
                {doc.type === "bon_commande" && NEXT_STEPS[doc.type].length > 0 && (
                  <p className="text-sm text-zinc-500 mb-4">
                    Choose a path: <strong>Deliver (stock)</strong> if parts are available locally, or <strong>Order from factory</strong> if they must be sourced.
                  </p>
                )}
                {confirmType && childrenByType[confirmType] && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm">
                    <p className="text-amber-800 font-semibold mb-2">
                      A {DOC_LABEL[confirmType].toLowerCase()} already exists ({childrenByType[confirmType]!.reference}).
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/espace-pdr/document/${childrenByType[confirmType]!.id}`}>
                        <span className="inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-900 font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer">
                          Open existing
                        </span>
                      </Link>
                      <button type="button" onClick={() => { setConfirmType(null); navigate(`/espace-pdr/document/${doc.id}/convert/${confirmType}`); }}
                        className="inline-flex items-center gap-1.5 bg-amber-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg">
                        Create another anyway
                      </button>
                      <button type="button" onClick={() => setConfirmType(null)}
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 px-2">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {NEXT_STEPS[doc.type].map((step) => {
                    const existing = childrenByType[step.type];
                    if (existing) {
                      return (
                        <Link key={step.type} href={`/espace-pdr/document/${existing.id}`}>
                          <span className="inline-flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer">
                            <Check className="w-4 h-4 text-emerald-600" />
                            {DOC_LABEL_SHORT[step.type]} already created — open
                          </span>
                        </Link>
                      );
                    }
                    return (
                      <button key={step.type} onClick={() => goConvert(step.type)}
                        className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
                        <ArrowRight className="w-4 h-4" />{step.label}
                      </button>
                    );
                  })}
                </div>
                {NEXT_STEPS[doc.type].length === 0 && <p className="text-sm text-zinc-500">End of the chain — this document is an invoice.</p>}
              </section>
            </>
          )}
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
