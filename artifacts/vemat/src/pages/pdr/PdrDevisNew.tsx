import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Plus, Trash2, Save, History } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import { supabasePdr } from "@/lib/supabase";
import { usePdrAuth } from "@/contexts/PdrAuthContext";
import {
  createDocument, rememberParts, searchParts, computeTotals, lineTotal,
  formatMoney, formatNaira, templateModel,
  type PdrItem, type PdrPart, type Currency,
} from "@/lib/pdrDocuments";

const emptyItem = (): PdrItem => ({ reference: "", designation: "", quantity: 1, avail: "Imm", unit_price: 0, discount_pct: 0 });

export default function PdrDevisNew() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user } = usePdrAuth();
  const fromId = useMemo(() => new URLSearchParams(search).get("from"), [search]);

  // Client
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [attention, setAttention] = useState("");
  const [machine, setMachine] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // Options
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [applyVat, setApplyVat] = useState(false);
  const [vatRate, setVatRate] = useState(7.5);
  // Lignes + douane
  const [items, setItems] = useState<PdrItem[]>([emptyItem()]);
  const [customsNaira, setCustomsNaira] = useState(0);
  const [customsLabel, setCustomsLabel] = useState("CUSTOMS CLEARING and DELIVERY");
  // Termes
  const [paymentTerms, setPaymentTerms] = useState("Advance payment");
  const [validity, setValidity] = useState("30 Days");
  const [deliveryTerms, setDeliveryTerms] = useState("CIF, Port Harcourt");
  const [incotermsNote, setIncotermsNote] = useState("");
  const [notes, setNotes] = useState("");

  const [sourceId, setSourceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateItem = (i: number, patch: Partial<PdrItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  // Autocomplétion mémoire des pièces
  const [suggestRow, setSuggestRow] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<PdrPart[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runSearch = (row: number, q: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const res = await searchParts(q);
      setSuggestRow(row);
      setSuggestions(res);
    }, 180);
  };
  const applySuggestion = (i: number, p: PdrPart) => {
    updateItem(i, { reference: p.reference, designation: p.designation ?? "", unit_price: p.last_unit_price ?? 0 });
    setSuggestRow(null);
    setSuggestions([]);
  };

  // Pré-remplissage depuis une demande du site
  useEffect(() => {
    if (!fromId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabasePdr
        .from("form_devis")
        .select("id, company_name, contact_name, contact_email, contact_phone, product_category, quantity, notes")
        .eq("id", fromId).maybeSingle();
      if (cancelled || !data) return;
      setSourceId(data.id);
      setCompany(data.company_name ?? "");
      setName(data.contact_name ?? "");
      setEmail(data.contact_email ?? "");
      setPhone(data.contact_phone ?? "");
      setNotes(data.notes ?? "");
      if (data.product_category) {
        setItems([{ ...emptyItem(), designation: data.product_category, quantity: data.quantity ?? 1 }]);
      }
    })();
    return () => { cancelled = true; };
  }, [fromId]);

  const totals = computeTotals({ items, apply_vat: applyVat, vat_rate: vatRate, customs_naira: customsNaira });
  const model = templateModel(currency, customsNaira > 0);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const clean = items.filter((it) => it.designation.trim() !== "" || it.reference.trim() !== "");
      if (clean.length === 0) throw new Error("Ajoutez au moins une ligne.");
      const doc = await createDocument({
        type: "devis",
        parent_id: null,
        source_form_devis_id: sourceId,
        client_company: company || null,
        client_name: name || null,
        client_email: email || null,
        client_phone: phone || null,
        client_address: address || null,
        attention: attention || null,
        machine: machine || null,
        client_code: clientCode || null,
        currency,
        items: clean,
        apply_vat: applyVat,
        vat_rate: vatRate,
        customs_naira: customsNaira,
        customs_label: customsNaira > 0 ? customsLabel : null,
        payment_terms: paymentTerms || null,
        validity: validity || null,
        delivery_terms: deliveryTerms || null,
        incoterms_note: incotermsNote || null,
        status: "brouillon",
        notes: notes || null,
        created_by: user?.id ?? null,
      });
      if (sourceId) await supabasePdr.from("form_devis").update({ status: "traite" }).eq("id", sourceId);
      await rememberParts(clean, currency);
      navigate(`/espace-pdr/document/${doc.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  const ic = "w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-colors";
  const lbl = "block text-xs font-bold text-zinc-500 mb-1.5";

  return (
    <PdrGuard>
      <PdrLayout>
        <div className="p-6 lg:p-10 max-w-4xl mx-auto">
          <button onClick={() => navigate("/espace-pdr/tableau")} className="text-xs text-zinc-500 hover:text-sky-600 inline-flex items-center gap-1 mb-4 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Retour
          </button>
          <h1 className="text-3xl font-black text-zinc-950 mb-1">Nouvelle offre</h1>
          <p className="text-zinc-500 text-sm mb-8">Modèle Word {model} · {currency}{customsNaira > 0 ? " + douane NAIRA" : ""}{applyVat ? ` · TVA ${vatRate}%` : ""}</p>

          {/* Client */}
          <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
            <h2 className="font-black text-zinc-950 mb-4">Client</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={lbl}>Société</label><input className={ic} value={company} onChange={(e) => setCompany(e.target.value)} /></div>
              <div><label className={lbl}>À l'attention de</label><input className={ic} placeholder="Mr. …" value={attention} onChange={(e) => setAttention(e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={lbl}>Adresse</label><textarea className={`${ic} min-h-[60px]`} value={address} onChange={(e) => setAddress(e.target.value)} /></div>
              <div><label className={lbl}>Machine (+ n° série)</label><input className={ic} placeholder="RT555 s/n 161606" value={machine} onChange={(e) => setMachine(e.target.value)} /></div>
              <div><label className={lbl}>Code client</label><input className={ic} value={clientCode} onChange={(e) => setClientCode(e.target.value)} /></div>
              <div><label className={lbl}>Contact</label><input className={ic} value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><label className={lbl}>Email</label><input className={ic} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><label className={lbl}>Téléphone</label><input className={ic} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>
          </section>

          {/* Options */}
          <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
            <h2 className="font-black text-zinc-950 mb-4">Options</h2>
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <label className={lbl}>Devise (pièces)</label>
                <div className="inline-flex rounded-xl border border-zinc-200 overflow-hidden">
                  {(["EUR", "USD"] as Currency[]).map((c) => (
                    <button key={c} type="button" onClick={() => setCurrency(c)}
                      className={`px-4 py-2 text-sm font-bold transition-colors ${currency === c ? "bg-sky-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>
                      {c === "EUR" ? "€ EUR" : "$ USD"}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input type="checkbox" checked={applyVat} onChange={(e) => setApplyVat(e.target.checked)} className="w-4 h-4 accent-sky-600" />
                <span className="text-sm font-semibold text-zinc-700">Appliquer la TVA</span>
              </label>
              {applyVat && (
                <div><label className={lbl}>Taux TVA %</label><input className={`${ic} w-24`} type="number" step="0.5" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} /></div>
              )}
            </div>
          </section>

          {/* Lignes */}
          <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-zinc-950">Pièces &amp; transport</h2>
              <button type="button" onClick={() => setItems((p) => [...p, emptyItem()])} className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 hover:text-sky-500">
                <Plus className="w-4 h-4" /> Ajouter une ligne
              </button>
            </div>
            <div className="hidden sm:grid grid-cols-12 gap-2 px-1 pb-1 text-[10px] font-black uppercase tracking-wide text-zinc-400">
              <span className="col-span-2">Référence</span><span className="col-span-3">Désignation</span><span className="col-span-1">Qté</span><span className="col-span-2">Dispo</span><span className="col-span-1">P.U.</span><span className="col-span-1">Rem.%</span><span className="col-span-1 text-right">Total</span><span className="col-span-1" />
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="relative grid grid-cols-12 gap-2 items-center">
                  <input className={`${ic} col-span-2`} placeholder="Réf." value={it.reference}
                    onChange={(e) => { updateItem(i, { reference: e.target.value }); runSearch(i, e.target.value); }}
                    onFocus={() => { if (it.reference.length >= 2) runSearch(i, it.reference); }}
                    onBlur={() => setTimeout(() => setSuggestRow((r) => (r === i ? null : r)), 150)} />
                  <input className={`${ic} col-span-3`} placeholder="Désignation" value={it.designation}
                    onChange={(e) => { updateItem(i, { designation: e.target.value }); runSearch(i, e.target.value); }}
                    onFocus={() => { if (it.designation.length >= 2) runSearch(i, it.designation); }}
                    onBlur={() => setTimeout(() => setSuggestRow((r) => (r === i ? null : r)), 150)} />
                  <input className={`${ic} col-span-1`} type="number" min="1" value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} />
                  <input className={`${ic} col-span-2`} placeholder="Imm" value={it.avail} onChange={(e) => updateItem(i, { avail: e.target.value })} />
                  <input className={`${ic} col-span-1`} type="number" min="0" step="0.01" value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })} />
                  <input className={`${ic} col-span-1`} type="number" min="0" max="100" value={it.discount_pct} onChange={(e) => updateItem(i, { discount_pct: Number(e.target.value) })} />
                  <span className="col-span-1 text-right text-sm font-bold text-zinc-900 tabular-nums">{lineTotal(it).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}</span>
                  <button type="button" onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} className="col-span-1 text-zinc-400 hover:text-red-500 flex justify-center" aria-label="Supprimer"><Trash2 className="w-4 h-4" /></button>

                  {suggestRow === i && suggestions.length > 0 && (
                    <div className="absolute z-20 top-full left-0 mt-1 w-full sm:w-2/3 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
                      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-zinc-400 px-3 pt-2 pb-1"><History className="w-3 h-3" /> Pièces déjà utilisées</p>
                      {suggestions.map((p) => (
                        <button key={p.reference} type="button" onMouseDown={(e) => { e.preventDefault(); applySuggestion(i, p); }}
                          className="w-full text-left px-3 py-2 hover:bg-sky-50 transition-colors flex items-center justify-between gap-3">
                          <span className="min-w-0"><span className="font-mono text-xs text-sky-600">{p.reference}</span>{p.designation && <span className="block text-sm text-zinc-700 truncate">{p.designation}</span>}</span>
                          {p.last_unit_price != null && <span className="text-xs font-bold text-zinc-500 shrink-0">{formatMoney(p.last_unit_price, currency)}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Douane NAIRA */}
          <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
            <h2 className="font-black text-zinc-950 mb-1">Douane (facturée en NAIRA)</h2>
            <p className="text-xs text-zinc-500 mb-4">Laisse à 0 s'il n'y a pas de partie douane (modèle 1 ou 2).</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={lbl}>Montant douane ₦</label><input className={ic} type="number" min="0" step="0.01" value={customsNaira} onChange={(e) => setCustomsNaira(Number(e.target.value))} /></div>
              {customsNaira > 0 && <div><label className={lbl}>Libellé</label><input className={ic} value={customsLabel} onChange={(e) => setCustomsLabel(e.target.value)} /></div>}
            </div>
          </section>

          {/* Termes */}
          <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
            <h2 className="font-black text-zinc-950 mb-4">Conditions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={lbl}>Payment terms</label><input className={ic} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} /></div>
              <div><label className={lbl}>Validity</label><input className={ic} value={validity} onChange={(e) => setValidity(e.target.value)} /></div>
              <div><label className={lbl}>Delivery terms</label><input className={ic} value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} /></div>
              <div><label className={lbl}>Note incoterms</label><input className={ic} placeholder="Air freight option incoterms CIF …" value={incotermsNote} onChange={(e) => setIncotermsNote(e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={lbl}>Notes internes</label><textarea className={`${ic} min-h-[60px]`} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            </div>
          </section>

          {/* Totaux */}
          <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
            <div className="space-y-1.5 text-sm max-w-sm ml-auto">
              <div className="flex justify-between"><span className="text-zinc-500">Sous-total {currency}</span><span className="font-semibold text-zinc-900">{formatMoney(totals.mainSubtotal, currency)}</span></div>
              {applyVat && <div className="flex justify-between"><span className="text-zinc-500">TVA {vatRate}%</span><span className="font-semibold text-zinc-900">{formatMoney(totals.mainVat, currency)}</span></div>}
              <div className="flex justify-between pt-1.5 border-t border-zinc-100"><span className="font-black text-zinc-950">Total {currency}</span><span className="font-black text-sky-600">{formatMoney(totals.mainTotal, currency)}</span></div>
              {totals.hasCustoms && (
                <>
                  <div className="flex justify-between pt-3"><span className="text-zinc-500">Douane ₦</span><span className="font-semibold text-zinc-900">{formatNaira(totals.nairaSubtotal)}</span></div>
                  {applyVat && <div className="flex justify-between"><span className="text-zinc-500">TVA {vatRate}%</span><span className="font-semibold text-zinc-900">{formatNaira(totals.nairaVat)}</span></div>}
                  <div className="flex justify-between pt-1.5 border-t border-zinc-100"><span className="font-black text-zinc-950">Total ₦</span><span className="font-black text-amber-600">{formatNaira(totals.nairaTotal)}</span></div>
                </>
              )}
            </div>
          </section>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">{error}</p>}

          <button onClick={handleSave} disabled={saving} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-black px-8 py-3 rounded-xl transition-colors disabled:opacity-60">
            <Save className="w-4 h-4" /> {saving ? "Enregistrement…" : "Créer l'offre"}
          </button>
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
