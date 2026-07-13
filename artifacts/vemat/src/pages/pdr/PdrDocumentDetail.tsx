import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, AlertCircle, FileDown, ArrowRight, Check, Loader2, Pencil, Eye, FileText } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import {
  getDocument, getChain, updateDocument, getChildrenByType, canEditDocument,
  computeTotals, lineDiscountedUnit, lineTotal,
  DOC_LABEL, DOC_LABEL_SHORT, NEXT_STEPS, formatMoney, formatNaira, templateModel,
  type PdrDocument, type PdrDocType,
} from "@/lib/pdrDocuments";

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
