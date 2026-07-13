import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, AlertCircle, FileDown, ArrowRight, Check, Loader2 } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import {
  getDocument, getChain, convertDocument, updateDocument,
  computeTotals, lineDiscountedUnit, lineTotal,
  DOC_LABEL, DOC_LABEL_SHORT, NEXT_STEPS, formatMoney, formatNaira, templateModel,
  type PdrDocument,
} from "@/lib/pdrDocuments";

const STATUS_OPTIONS = ["brouillon", "envoye", "accepte", "refuse", "en_cours", "termine"];
const STATUS_LABEL: Record<string, string> = {
  brouillon: "Brouillon", envoye: "Envoyé", accepte: "Accepté",
  refuse: "Refusé", en_cours: "En cours", termine: "Terminé",
};

export default function PdrDocumentDetail() {
  const [, params] = useRoute<{ id: string }>("/espace-pdr/document/:id");
  const [, navigate] = useLocation();
  const id = params?.id;

  const [doc, setDoc] = useState<PdrDocument | null>(null);
  const [chain, setChain] = useState<PdrDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);

  const reload = async () => {
    if (!id) return;
    try {
      const d = await getDocument(id);
      if (!d) { setError("Document introuvable."); setLoading(false); return; }
      setDoc(d);
      setChain(await getChain(d));
      setLoading(false);
    } catch (e) { setError((e as Error).message); setLoading(false); }
  };

  useEffect(() => { setLoading(true); reload(); }, [id]);

  const [genWord, setGenWord] = useState(false);
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

  async function handleConvert(toType: PdrDocument["type"]) {
    if (!doc) return;
    setConverting(toType);
    try {
      const child = await convertDocument(doc, toType);
      navigate(`/espace-pdr/document/${child.id}`);
    } catch (e) { setError((e as Error).message); setConverting(null); }
  }

  async function handleStatus(status: string) {
    if (!doc) return;
    await updateDocument(doc.id, { status });
    setDoc({ ...doc, status });
  }

  const totals = doc ? computeTotals(doc) : null;

  return (
    <PdrGuard>
      <PdrLayout>
        <div className="p-6 lg:p-10 max-w-4xl mx-auto">
          <button onClick={() => navigate("/espace-pdr/documents")} className="text-xs text-zinc-500 hover:text-sky-600 inline-flex items-center gap-1 mb-4 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Tous les documents
          </button>

          {loading && <p className="text-zinc-400 text-sm py-20 text-center animate-pulse">Chargement…</p>}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" /><p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {doc && totals && (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black text-sky-600 mb-1">{DOC_LABEL[doc.type]}</p>
                  <h1 className="text-3xl font-black text-zinc-950 font-mono">{doc.reference}</h1>
                  <p className="text-zinc-500 text-sm mt-1">{new Date(doc.created_at).toLocaleDateString("fr-FR")} · modèle Word {templateModel(doc.currency, totals.hasCustoms)} · {doc.currency}{totals.hasCustoms ? " + NAIRA" : ""}{doc.apply_vat ? ` · TVA ${doc.vat_rate}%` : ""}</p>
                </div>
                <select value={doc.status} onChange={(e) => handleStatus(e.target.value)} className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 focus:outline-none focus:border-sky-400">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>)}
                </select>
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

              {/* Client */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-3">Client</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm">
                  <p><span className="text-zinc-500">Société :</span> <span className="font-semibold text-zinc-900">{doc.client_company || "—"}</span></p>
                  <p><span className="text-zinc-500">À l'attention de :</span> <span className="font-semibold text-zinc-900">{doc.attention || "—"}</span></p>
                  <p><span className="text-zinc-500">Machine :</span> <span className="font-semibold text-zinc-900">{doc.machine || "—"}</span></p>
                  <p><span className="text-zinc-500">Code client :</span> <span className="font-semibold text-zinc-900">{doc.client_code || "—"}</span></p>
                  <p><span className="text-zinc-500">Contact :</span> <span className="font-semibold text-zinc-900">{doc.client_name || "—"}</span></p>
                  <p><span className="text-zinc-500">Email :</span> <span className="font-semibold text-zinc-900">{doc.client_email || "—"}</span></p>
                  {doc.client_address && <p className="sm:col-span-2"><span className="text-zinc-500">Adresse :</span> <span className="font-semibold text-zinc-900 whitespace-pre-line">{doc.client_address}</span></p>}
                </div>
              </section>

              {/* Lignes */}
              <section className="bg-white rounded-2xl border border-zinc-200 overflow-hidden mb-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left font-bold px-4 py-3">Réf.</th>
                        <th className="text-left font-bold px-4 py-3">Désignation</th>
                        <th className="text-right font-bold px-4 py-3">Qté</th>
                        <th className="text-left font-bold px-4 py-3">Dispo</th>
                        <th className="text-right font-bold px-4 py-3">P.U.</th>
                        <th className="text-right font-bold px-4 py-3">Rem.</th>
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
                  <div className="flex justify-between"><span className="text-zinc-500">Sous-total {doc.currency}</span><span className="font-semibold text-zinc-900">{formatMoney(totals.mainSubtotal, doc.currency)}</span></div>
                  {doc.apply_vat && <div className="flex justify-between"><span className="text-zinc-500">TVA {doc.vat_rate}%</span><span className="font-semibold text-zinc-900">{formatMoney(totals.mainVat, doc.currency)}</span></div>}
                  <div className="flex justify-between pt-1.5 border-t border-zinc-100 text-base"><span className="font-black text-zinc-950">Total {doc.currency}</span><span className="font-black text-sky-600">{formatMoney(totals.mainTotal, doc.currency)}</span></div>
                  {totals.hasCustoms && (
                    <>
                      <div className="flex justify-between pt-3"><span className="text-zinc-500">{doc.customs_label || "Douane"} ₦</span><span className="font-semibold text-zinc-900">{formatNaira(totals.nairaSubtotal)}</span></div>
                      {doc.apply_vat && <div className="flex justify-between"><span className="text-zinc-500">TVA {doc.vat_rate}%</span><span className="font-semibold text-zinc-900">{formatNaira(totals.nairaVat)}</span></div>}
                      <div className="flex justify-between pt-1.5 border-t border-zinc-100 text-base"><span className="font-black text-zinc-950">Total ₦</span><span className="font-black text-amber-600">{formatNaira(totals.nairaTotal)}</span></div>
                    </>
                  )}
                </div>
              </section>

              {/* Conditions */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-3">Conditions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm">
                  <p><span className="text-zinc-500">Payment terms :</span> <span className="font-semibold text-zinc-900">{doc.payment_terms || "—"}</span></p>
                  <p><span className="text-zinc-500">Validity :</span> <span className="font-semibold text-zinc-900">{doc.validity || "—"}</span></p>
                  <p><span className="text-zinc-500">Delivery terms :</span> <span className="font-semibold text-zinc-900">{doc.delivery_terms || "—"}</span></p>
                  {doc.incoterms_note && <p className="sm:col-span-2"><span className="text-zinc-500">Incoterms :</span> <span className="font-semibold text-zinc-900">{doc.incoterms_note}</span></p>}
                  {doc.notes && <p className="sm:col-span-2"><span className="text-zinc-500">Notes :</span> <span className="font-semibold text-zinc-900 whitespace-pre-line">{doc.notes}</span></p>}
                </div>
              </section>

              {/* Documents */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-4">Générer le document</h2>
                <button onClick={handleWord} disabled={genWord}
                  className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                  {genWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Télécharger l'offre Word (.docx)
                </button>
                <p className="text-xs text-zinc-400 mt-3">Génère ton modèle Word rempli (design identique). Pour un PDF : ouvre le fichier dans Word → Fichier → Enregistrer sous → PDF.</p>
              </section>

              {/* Actions circuit */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                <h2 className="font-black text-zinc-950 mb-4">Étape suivante</h2>
                <div className="flex flex-wrap gap-3">
                  {NEXT_STEPS[doc.type].map((step) => (
                    <button key={step.type} onClick={() => handleConvert(step.type)} disabled={converting !== null}
                      className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                      {converting === step.type ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}{step.label}
                    </button>
                  ))}
                </div>
                {NEXT_STEPS[doc.type].length === 0 && <p className="text-sm text-zinc-500">Fin de la chaîne — ce document est une facture.</p>}
              </section>
            </>
          )}
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
