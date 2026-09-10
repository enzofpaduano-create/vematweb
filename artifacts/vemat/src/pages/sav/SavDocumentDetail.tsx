import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, AlertCircle, FileDown, ArrowRight, Check, Loader2, Pencil, Package, ExternalLink, Files, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { SavGuard } from "./SavGuard";
import { SavLayout } from "./SavLayout";
import {
  getSavDocument, getSavChain, getSavChildrenByType, updateSavDocument, canEditSavDocument,
  createPdrRequestFromSav, convertSavDocument, computeSavTotals, partLineTotal,
  DOC_LABEL, DOC_LABEL_SHORT, nextSteps, formatMoney, formatNaira,
  type SavDocument, type SavDocType,
} from "@/lib/savDocuments";
import {
  getApprovalSettings, docNeedsValidation, isSendBlocked,
  requestValidation, approveValidation, rejectValidation, clearValidation,
  VALIDATION_STATUS_LABEL, VALIDATION_STATUS_COLOR,
  type ApprovalSettings,
} from "@/lib/approval";
import { supabaseSav } from "@/lib/supabase";
import { useSavAuth } from "@/contexts/SavAuthContext";
import { sendValidationRequestEmail, sendValidationDecisionEmail } from "@/lib/emailService";

const STATUS_OPTIONS = ["brouillon", "envoye", "accepte", "refuse", "en_cours", "termine"];
const STATUS_LABEL: Record<string, string> = {
  brouillon: "Draft", envoye: "Sent", accepte: "Accepted", refuse: "Rejected", en_cours: "In progress", termine: "Completed",
};

export default function SavDocumentDetail() {
  const [, params] = useRoute<{ id: string }>("/espace-sav/document/:id");
  const [, navigate] = useLocation();
  const id = params?.id;

  const [doc, setDoc] = useState<SavDocument | null>(null);
  const [chain, setChain] = useState<SavDocument[]>([]);
  const [childrenByType, setChildrenByType] = useState<Partial<Record<SavDocType, SavDocument>>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);
  const [genWord, setGenWord] = useState(false);
  const [genZip, setGenZip] = useState(false);
  const [pdrLoading, setPdrLoading] = useState(false);
  const [approvalSettings, setApprovalSettings] = useState<ApprovalSettings | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [busyValidation, setBusyValidation] = useState(false);
  const { user } = useSavAuth();

  useEffect(() => {
    let cancelled = false;
    getApprovalSettings(supabaseSav, "sav")
      .then((s) => { if (!cancelled) setApprovalSettings(s); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const reload = async () => {
    if (!id) return;
    try {
      const d = await getSavDocument(id);
      if (!d) { setError("Document not found."); setLoading(false); return; }
      setDoc(d);
      const [ch, kids] = await Promise.all([getSavChain(d), getSavChildrenByType(d.id)]);
      setChain(ch); setChildrenByType(kids); setLoading(false);
    } catch (e) { setError((e as Error).message); setLoading(false); }
  };
  useEffect(() => { setLoading(true); reload(); }, [id]);

  async function handleConvert(toType: SavDocType) {
    if (!doc) return;
    if (childrenByType[toType]) { navigate(`/espace-sav/document/${childrenByType[toType]!.id}`); return; }
    setConverting(toType);
    try {
      const child = await convertSavDocument(doc, toType);
      navigate(`/espace-sav/document/${child.id}`);
    } catch (e) { setError((e as Error).message); setConverting(null); }
  }

  async function handleWord() {
    if (!doc) return;
    setGenWord(true);
    try { const { generateSavDocx } = await import("@/lib/savOfferDocx"); await generateSavDocx(doc); }
    catch (e) { setError((e as Error).message); }
    finally { setGenWord(false); }
  }
  async function handleZip() {
    if (chain.length === 0) return;
    setGenZip(true);
    try { const { downloadSavChainZip } = await import("@/lib/savOfferDocx"); await downloadSavChainZip(chain); }
    catch (e) { setError((e as Error).message); }
    finally { setGenZip(false); }
  }

  async function handlePdrRequest() {
    if (!doc) return;
    setPdrLoading(true); setError(null); setNotice(null);
    try {
      await createPdrRequestFromSav(doc);
      setNotice("Parts request sent to the PDR desk (visible in the PDR portal inbox).");
      await reload();
    } catch (e) { setError((e as Error).message); }
    finally { setPdrLoading(false); }
  }

  async function handleStatus(status: string) {
    if (!doc) return;
    // Business rule: cannot mark 'envoye'/'accepte' when validation is pending or rejected.
    if ((status === "envoye" || status === "accepte") && isSendBlocked(doc.validation_status)) {
      setError("Cannot mark as Sent/Accepted — this document is waiting for Manager validation.");
      return;
    }
    await updateSavDocument(doc.id, { status });
    setDoc({ ...doc, status });
  }

  const validationCheck = doc && approvalSettings
    ? docNeedsValidation({ total_amount: doc.total_amount, parts: doc.parts }, approvalSettings)
    : { needsValidation: false, reasons: [] };

  async function handleRequestValidation() {
    if (!doc || !approvalSettings) return;
    setBusyValidation(true);
    try {
      await requestValidation(supabaseSav, "sav_documents", doc.id);
      const fresh = await getSavDocument(doc.id);
      if (fresh) setDoc(fresh);
      if (approvalSettings.manager_email) {
        await sendValidationRequestEmail({
          portal: "SAV",
          reference: doc.reference,
          clientName: doc.client_company || doc.client_name || "—",
          totalAmount: doc.total_amount,
          currency: doc.currency,
          reasons: validationCheck.reasons,
          requestedBy: user?.email ?? undefined,
          managerEmail: approvalSettings.manager_email,
          docUrl: typeof window !== "undefined" ? `${window.location.origin}/espace-sav/document/${doc.id}` : undefined,
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
      await approveValidation(supabaseSav, "sav_documents", doc.id, decidedBy);
      const fresh = await getSavDocument(doc.id);
      if (fresh) setDoc(fresh);
      await sendValidationDecisionEmail({
        portal: "SAV",
        reference: doc.reference,
        clientName: doc.client_company || doc.client_name || "—",
        decision: "approved",
        decidedBy,
        docUrl: typeof window !== "undefined" ? `${window.location.origin}/espace-sav/document/${doc.id}` : undefined,
      });
    } catch (e) { setError((e as Error).message); }
    finally { setBusyValidation(false); }
  }

  async function handleReject() {
    if (!doc) return;
    if (!rejectNote.trim()) { setError("A reason is required to reject."); return; }
    setBusyValidation(true);
    try {
      const decidedBy = user?.email ?? "manager";
      await rejectValidation(supabaseSav, "sav_documents", doc.id, decidedBy, rejectNote.trim());
      const fresh = await getSavDocument(doc.id);
      if (fresh) setDoc(fresh);
      setRejectMode(false); setRejectNote("");
      await sendValidationDecisionEmail({
        portal: "SAV",
        reference: doc.reference,
        clientName: doc.client_company || doc.client_name || "—",
        decision: "rejected",
        decidedBy,
        note: rejectNote.trim(),
        docUrl: typeof window !== "undefined" ? `${window.location.origin}/espace-sav/document/${doc.id}` : undefined,
      });
    } catch (e) { setError((e as Error).message); }
    finally { setBusyValidation(false); }
  }

  async function handleClearValidation() {
    if (!doc) return;
    setBusyValidation(true);
    try {
      await clearValidation(supabaseSav, "sav_documents", doc.id);
      const fresh = await getSavDocument(doc.id);
      if (fresh) setDoc(fresh);
    } catch (e) { setError((e as Error).message); }
    finally { setBusyValidation(false); }
  }

  const totals = doc ? computeSavTotals(doc) : null;
  const hasKids = Object.keys(childrenByType).length > 0;
  const editable = doc ? canEditSavDocument(doc, hasKids) : false;

  return (
    <SavGuard>
      <SavLayout>
        <div className="p-6 lg:p-10 max-w-4xl mx-auto">
          <button onClick={() => navigate("/espace-sav/documents")} className="text-xs text-zinc-500 hover:text-emerald-600 inline-flex items-center gap-1 mb-4 transition-colors">
            <ArrowLeft className="h-3 w-3" /> All documents
          </button>

          {loading && <p className="text-zinc-400 text-sm py-20 text-center animate-pulse">Loading…</p>}
          {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3 mb-4"><AlertCircle className="h-5 w-5 text-red-500 shrink-0" /><p className="text-sm text-red-600">{error}</p></div>}
          {notice && <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 mb-4"><Check className="h-5 w-5 text-emerald-600 shrink-0" /><p className="text-sm text-emerald-700">{notice}</p></div>}

          {doc && totals && (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black text-emerald-600 mb-1">{DOC_LABEL[doc.type]}</p>
                  <h1 className="text-3xl font-black text-zinc-950 font-mono">{doc.reference}</h1>
                  <p className="text-zinc-500 text-sm mt-1">{new Date(doc.created_at).toLocaleDateString("en-GB")} · {doc.currency}{totals.hasCustoms ? " + NAIRA" : ""}{doc.apply_vat ? ` · VAT ${doc.vat_rate}%` : ""} · {doc.payment_mode === "advance" ? "advance" : "after delivery"}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {editable && (
                    <Link href={`/espace-sav/document/${doc.id}/edit`}>
                      <span className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 hover:border-emerald-300 text-zinc-700 font-bold text-sm px-3 py-2 rounded-xl transition-colors cursor-pointer">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </span>
                    </Link>
                  )}
                  <select value={doc.status} onChange={(e) => handleStatus(e.target.value)} className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 focus:outline-none focus:border-emerald-400">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>)}
                  </select>
                </div>
              </div>

              {chain.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-6 bg-white rounded-2xl border border-zinc-200 p-3">
                  {chain.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-1.5">
                      {i > 0 && <ArrowRight className="w-3 h-3 text-zinc-300" />}
                      <Link href={`/espace-sav/document/${c.id}`}>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${c.id === doc.id ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>{DOC_LABEL_SHORT[c.type]}</span>
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
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
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
                      <button onClick={handleRequestValidation} disabled={busyValidation || !approvalSettings?.manager_email}
                        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl disabled:opacity-60">
                        {busyValidation ? "Requesting…" : "Request Manager validation"}
                      </button>
                      {!approvalSettings?.manager_email && (
                        <p className="text-xs text-red-600 mt-2">⚠ No manager email in <Link href="/espace-sav/reglages" className="underline">Settings</Link>.</p>
                      )}
                    </>
                  )}

                  {doc.validation_status === "pending" && (
                    <>
                      <p className="text-sm text-zinc-700 mb-3">
                        Requested {doc.validation_requested_at ? new Date(doc.validation_requested_at).toLocaleString("en-GB") : "—"}. Sending is blocked until approval.
                      </p>
                      {!rejectMode && (
                        <div className="flex flex-wrap gap-2">
                          <button onClick={handleApprove} disabled={busyValidation} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl disabled:opacity-60">
                            <ShieldCheck className="w-4 h-4" /> Approve
                          </button>
                          <button onClick={() => setRejectMode(true)} disabled={busyValidation} className="inline-flex items-center gap-2 bg-white border border-red-300 hover:border-red-500 text-red-700 font-bold text-sm px-4 py-2.5 rounded-xl disabled:opacity-60">
                            <ShieldAlert className="w-4 h-4" /> Reject
                          </button>
                          <button onClick={handleClearValidation} disabled={busyValidation} className="text-xs text-zinc-500 hover:text-zinc-800 px-2">Cancel request</button>
                        </div>
                      )}
                      {rejectMode && (
                        <div className="border border-red-200 rounded-xl p-3 bg-white">
                          <label className="block text-xs font-bold text-zinc-500 mb-1.5">Reason for rejection (required)</label>
                          <textarea className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 min-h-[60px] mb-2" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Why is this quote being rejected?" />
                          <div className="flex gap-2">
                            <button onClick={handleReject} disabled={busyValidation || !rejectNote.trim()} className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg disabled:opacity-60">Confirm reject</button>
                            <button onClick={() => { setRejectMode(false); setRejectNote(""); }} className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 px-2">Cancel</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {doc.validation_status === "approved" && (
                    <p className="text-sm text-emerald-800">
                      ✓ Approved by <strong>{doc.validation_decided_by ?? "manager"}</strong>
                      {doc.validation_decided_at && ` on ${new Date(doc.validation_decided_at).toLocaleString("en-GB")}`}.
                    </p>
                  )}

                  {doc.validation_status === "rejected" && (
                    <>
                      <p className="text-sm text-red-800 mb-2">
                        ✗ Rejected by <strong>{doc.validation_decided_by ?? "manager"}</strong>
                        {doc.validation_decided_at && ` on ${new Date(doc.validation_decided_at).toLocaleString("en-GB")}`}.
                      </p>
                      {doc.validation_note && <p className="text-sm text-red-700 mb-3 bg-white border border-red-200 rounded-lg p-3 italic">Manager note: "{doc.validation_note}"</p>}
                      <button onClick={handleRequestValidation} disabled={busyValidation || !approvalSettings?.manager_email} className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl disabled:opacity-60">
                        {busyValidation ? "Resubmitting…" : "Resubmit for validation"}
                      </button>
                    </>
                  )}
                </section>
              )}

              {/* Client */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-3">Client &amp; machine</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm">
                  <p><span className="text-zinc-500">Company:</span> <span className="font-semibold text-zinc-900">{doc.client_company || "—"}</span></p>
                  <p><span className="text-zinc-500">Attention:</span> <span className="font-semibold text-zinc-900">{doc.attention || "—"}</span></p>
                  <p><span className="text-zinc-500">Machine:</span> <span className="font-semibold text-zinc-900">{doc.machine || "—"}</span></p>
                  <p><span className="text-zinc-500">Site:</span> <span className="font-semibold text-zinc-900">{doc.location || "—"}</span></p>
                  <p><span className="text-zinc-500">Contact:</span> <span className="font-semibold text-zinc-900">{doc.client_name || "—"}</span></p>
                  <p><span className="text-zinc-500">Phone:</span> <span className="font-semibold text-zinc-900">{doc.client_phone || "—"}</span></p>
                  {doc.intervention_description && <p className="sm:col-span-2"><span className="text-zinc-500">Intervention:</span> <span className="font-semibold text-zinc-900">{doc.intervention_description}</span></p>}
                </div>
              </section>

              {/* Breakdown */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-3">Billing breakdown</h2>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-600">Labour {doc.labour_mode === "daily" ? `(${doc.labour_days} d × ${formatMoney(doc.labour_daily_rate, doc.currency)})` : "(fixed)"}</span><span className="font-bold text-zinc-900">{formatMoney(totals.labour, doc.currency)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-600">Travel {doc.travel_km ? `(${doc.travel_km} km` : ""}{doc.travel_hours ? `, ${doc.travel_hours} h)` : doc.travel_km ? ")" : ""}</span><span className="font-bold text-zinc-900">{formatMoney(totals.travel, doc.currency)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-600">Parts ({doc.parts.length})</span><span className="font-bold text-zinc-900">{formatMoney(totals.parts, doc.currency)}</span></div>
                </div>
                {doc.parts.length > 0 && (
                  <div className="mt-4 border-t border-zinc-100 pt-3">
                    <table className="w-full text-sm">
                      <thead className="text-zinc-400 text-xs uppercase"><tr><th className="text-left font-bold py-1">Ref.</th><th className="text-left font-bold py-1">Designation</th><th className="text-right font-bold py-1">Qty</th><th className="text-right font-bold py-1">Total</th></tr></thead>
                      <tbody className="divide-y divide-zinc-50">
                        {doc.parts.map((it, i) => (
                          <tr key={i}><td className="py-1.5 font-mono text-xs text-zinc-500">{it.reference || "—"}</td><td className="py-1.5 text-zinc-800">{it.designation}</td><td className="py-1.5 text-right text-zinc-600">{it.quantity}</td><td className="py-1.5 text-right font-semibold text-zinc-900">{formatMoney(partLineTotal(it), doc.currency)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-4 border-t border-zinc-100 pt-3 space-y-1.5 text-sm max-w-xs ml-auto">
                  <div className="flex justify-between"><span className="text-zinc-500">Subtotal</span><span className="font-semibold text-zinc-900">{formatMoney(totals.subtotal, doc.currency)}</span></div>
                  {doc.apply_vat && <div className="flex justify-between"><span className="text-zinc-500">VAT {doc.vat_rate}%</span><span className="font-semibold text-zinc-900">{formatMoney(totals.vat, doc.currency)}</span></div>}
                  <div className="flex justify-between text-base pt-1.5 border-t border-zinc-100"><span className="font-black text-zinc-950">Total {doc.currency}</span><span className="font-black text-emerald-600">{formatMoney(totals.total, doc.currency)}</span></div>
                  {totals.hasCustoms && <div className="flex justify-between pt-2"><span className="font-black text-zinc-950">Customs ₦</span><span className="font-black text-amber-600">{formatNaira(totals.nairaTotal)}</span></div>}
                </div>
              </section>

              {/* PDR link */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-3">Spare parts request (PDR)</h2>
                {doc.pdr_request_id ? (
                  <p className="text-sm text-emerald-700 inline-flex items-center gap-1.5"><Check className="w-4 h-4" /> A parts request has already been sent to the PDR desk for this document.</p>
                ) : doc.parts.length === 0 ? (
                  <p className="text-sm text-zinc-500">Add parts to this offer to be able to send a request to the PDR desk.</p>
                ) : (
                  <>
                    <p className="text-sm text-zinc-500 mb-3">Send these {doc.parts.length} part(s) to the PDR desk — a request appears in the PDR portal inbox, ready to be quoted.</p>
                    <button onClick={handlePdrRequest} disabled={pdrLoading} className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                      {pdrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />} Send parts request to PDR
                    </button>
                  </>
                )}
                <Link href="/espace-pdr/tableau">
                  <span className="inline-flex items-center gap-1.5 text-sky-600 hover:underline text-sm font-semibold mt-3 cursor-pointer"><ExternalLink className="w-3.5 h-3.5" /> Open PDR portal</span>
                </Link>
              </section>

              {/* Documents */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-4">Document</h2>
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleWord} disabled={genWord} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                    {genWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Download Word (.docx)
                  </button>
                  {chain.length > 1 && (
                    <button onClick={handleZip} disabled={genZip} className="inline-flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                      {genZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <Files className="w-4 h-4" />} Whole chain (ZIP)
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-3">For a PDF: open the Word file → File → Save as → PDF.</p>
              </section>

              {/* Actions */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                <h2 className="font-black text-zinc-950 mb-4">Next step</h2>
                <div className="flex flex-wrap gap-3">
                  {nextSteps(doc).map((step) => {
                    const existing = childrenByType[step.type];
                    return (
                      <button key={step.type} onClick={() => handleConvert(step.type)} disabled={converting !== null}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                        {converting === step.type ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        {existing ? `Open ${DOC_LABEL_SHORT[step.type]}` : step.label}
                      </button>
                    );
                  })}
                </div>
                {nextSteps(doc).length === 0 && <p className="text-sm text-zinc-500">End of the chain — this document is an invoice.</p>}
              </section>
            </>
          )}
        </div>
      </SavLayout>
    </SavGuard>
  );
}
