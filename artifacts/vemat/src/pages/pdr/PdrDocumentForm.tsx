/**
 * Formulaire partagé création / édition d'un document PDR (offre et suivants).
 */

import { useEffect, useRef, useState } from "react";
import { History, Plus, Save, Trash2 } from "lucide-react";
import {
  computeTotals, lineTotal, formatMoney, formatNaira, templateModel, searchParts,
  type PdrItem, type PdrPart, type Currency, type PdrDocument,
} from "@/lib/pdrDocuments";

export const emptyItem = (): PdrItem => ({
  reference: "", designation: "", quantity: 1, avail: "Imm", unit_price: 0, discount_pct: 0,
});

export interface PdrFormValues {
  company: string;
  address: string;
  attention: string;
  machine: string;
  clientCode: string;
  name: string;
  email: string;
  phone: string;
  currency: Currency;
  applyVat: boolean;
  vatRate: number;
  items: PdrItem[];
  customsNaira: number;
  customsLabel: string;
  paymentTerms: string;
  validity: string;
  deliveryTerms: string;
  incotermsNote: string;
  notes: string;
}

export const defaultFormValues = (): PdrFormValues => ({
  company: "",
  address: "",
  attention: "",
  machine: "",
  clientCode: "",
  name: "",
  email: "",
  phone: "",
  currency: "EUR",
  applyVat: false,
  vatRate: 7.5,
  items: [emptyItem()],
  customsNaira: 0,
  customsLabel: "CUSTOMS CLEARING and DELIVERY",
  paymentTerms: "Advance payment",
  validity: "30 Days",
  deliveryTerms: "CIF, Port Harcourt",
  incotermsNote: "",
  notes: "",
});

export function valuesFromDocument(doc: PdrDocument): PdrFormValues {
  return {
    company: doc.client_company ?? "",
    address: doc.client_address ?? "",
    attention: doc.attention ?? "",
    machine: doc.machine ?? "",
    clientCode: doc.client_code ?? "",
    name: doc.client_name ?? "",
    email: doc.client_email ?? "",
    phone: doc.client_phone ?? "",
    currency: doc.currency,
    applyVat: doc.apply_vat,
    vatRate: doc.vat_rate,
    items: doc.items.length > 0 ? doc.items.map((it) => ({ ...it })) : [emptyItem()],
    customsNaira: doc.customs_naira,
    customsLabel: doc.customs_label || "CUSTOMS CLEARING and DELIVERY",
    paymentTerms: doc.payment_terms ?? "Advance payment",
    validity: doc.validity ?? "30 Days",
    deliveryTerms: doc.delivery_terms ?? "CIF, Port Harcourt",
    incotermsNote: doc.incoterms_note ?? "",
    notes: doc.notes ?? "",
  };
}

/** Payload métier à partir du formulaire (sans type / parent / source). */
export function formToPayload(v: PdrFormValues) {
  const clean = v.items.filter((it) => it.designation.trim() !== "" || it.reference.trim() !== "");
  if (clean.length === 0) throw new Error("Add at least one line.");
  return {
    client_company: v.company || null,
    client_name: v.name || null,
    client_email: v.email || null,
    client_phone: v.phone || null,
    client_address: v.address || null,
    attention: v.attention || null,
    machine: v.machine || null,
    client_code: v.clientCode || null,
    currency: v.currency,
    items: clean,
    apply_vat: v.applyVat,
    vat_rate: v.vatRate,
    customs_naira: v.customsNaira,
    customs_label: v.customsNaira > 0 ? v.customsLabel : null,
    payment_terms: v.paymentTerms || null,
    validity: v.validity || null,
    delivery_terms: v.deliveryTerms || null,
    incoterms_note: v.incotermsNote || null,
    notes: v.notes || null,
  };
}

interface PdrDocumentFormProps {
  initial: PdrFormValues;
  /** Remplace le state quand la source change (ex. préremplissage async). */
  syncKey?: string;
  title: string;
  subtitle?: string;
  submitLabel: string;
  saving: boolean;
  error: string | null;
  onSubmit: (values: PdrFormValues) => void;
}

export function PdrDocumentForm({
  initial, syncKey, title, subtitle, submitLabel, saving, error, onSubmit,
}: PdrDocumentFormProps) {
  const [v, setV] = useState<PdrFormValues>(initial);
  const [suggestRow, setSuggestRow] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<PdrPart[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setV(initial);
  }, [syncKey]); // eslint-disable-line react-hooks/exhaustive-deps -- sync when source id / doc id changes

  const set = <K extends keyof PdrFormValues>(key: K, value: PdrFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const updateItem = (i: number, patch: Partial<PdrItem>) =>
    setV((prev) => ({
      ...prev,
      items: prev.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    }));

  const runSearch = (row: number, q: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const res = await searchParts(q);
      setSuggestRow(row);
      setSuggestions(res);
    }, 180);
  };

  const applySuggestion = (i: number, p: PdrPart) => {
    updateItem(i, {
      reference: p.reference,
      designation: p.designation ?? "",
      unit_price: p.last_unit_price ?? 0,
    });
    setSuggestRow(null);
    setSuggestions([]);
  };

  const totals = computeTotals({
    items: v.items,
    apply_vat: v.applyVat,
    vat_rate: v.vatRate,
    customs_naira: v.customsNaira,
  });
  const model = templateModel(v.currency, v.customsNaira > 0);

  const ic = "w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-colors";
  const lbl = "block text-xs font-bold text-zinc-500 mb-1.5";

  return (
    <>
      <h1 className="text-3xl font-black text-zinc-950 mb-1">{title}</h1>
      <p className="text-zinc-500 text-sm mb-8">
        {subtitle ?? `Word template ${model} · ${v.currency}${v.customsNaira > 0 ? " + NAIRA customs" : ""}${v.applyVat ? ` · VAT ${v.vatRate}%` : ""}`}
      </p>

      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
        <h2 className="font-black text-zinc-950 mb-4">Client</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Company</label><input className={ic} value={v.company} onChange={(e) => set("company", e.target.value)} /></div>
          <div><label className={lbl}>Attention</label><input className={ic} placeholder="Mr. …" value={v.attention} onChange={(e) => set("attention", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Address</label><textarea className={`${ic} min-h-[60px]`} value={v.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div><label className={lbl}>Machine (+ serial no.)</label><input className={ic} placeholder="RT555 s/n 161606" value={v.machine} onChange={(e) => set("machine", e.target.value)} /></div>
          <div><label className={lbl}>Client code</label><input className={ic} value={v.clientCode} onChange={(e) => set("clientCode", e.target.value)} /></div>
          <div><label className={lbl}>Contact</label><input className={ic} value={v.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div><label className={lbl}>Email</label><input className={ic} value={v.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div><label className={lbl}>Phone</label><input className={ic} value={v.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
        <h2 className="font-black text-zinc-950 mb-4">Options</h2>
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className={lbl}>Currency (parts)</label>
            <div className="inline-flex rounded-xl border border-zinc-200 overflow-hidden">
              {(["EUR", "USD"] as Currency[]).map((c) => (
                <button key={c} type="button" onClick={() => set("currency", c)}
                  className={`px-4 py-2 text-sm font-bold transition-colors ${v.currency === c ? "bg-sky-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>
                  {c === "EUR" ? "€ EUR" : "$ USD"}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pb-2">
            <input type="checkbox" checked={v.applyVat} onChange={(e) => set("applyVat", e.target.checked)} className="w-4 h-4 accent-sky-600" />
            <span className="text-sm font-semibold text-zinc-700">Apply VAT</span>
          </label>
          {v.applyVat && (
            <div><label className={lbl}>VAT rate %</label><input className={`${ic} w-24`} type="number" step="0.5" value={v.vatRate} onChange={(e) => set("vatRate", Number(e.target.value))} /></div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-zinc-950">Parts &amp; freight</h2>
          <button type="button" onClick={() => set("items", [...v.items, emptyItem()])} className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 hover:text-sky-500">
            <Plus className="w-4 h-4" /> Add line
          </button>
        </div>
        <div className="hidden sm:grid grid-cols-12 gap-2 px-1 pb-1 text-[10px] font-black uppercase tracking-wide text-zinc-400">
          <span className="col-span-2">Reference</span><span className="col-span-3">Description</span><span className="col-span-1">Qty</span><span className="col-span-2">Avail</span><span className="col-span-1">Unit</span><span className="col-span-1">Disc.%</span><span className="col-span-1 text-right">Total</span><span className="col-span-1" />
        </div>
        <div className="space-y-2">
          {v.items.map((it, i) => (
            <div key={i} className="relative grid grid-cols-12 gap-2 items-center">
              <input className={`${ic} col-span-2`} placeholder="Ref." value={it.reference}
                onChange={(e) => { updateItem(i, { reference: e.target.value }); runSearch(i, e.target.value); }}
                onFocus={() => { if (it.reference.length >= 2) runSearch(i, it.reference); }}
                onBlur={() => setTimeout(() => setSuggestRow((r) => (r === i ? null : r)), 150)} />
              <input className={`${ic} col-span-3`} placeholder="Description" value={it.designation}
                onChange={(e) => { updateItem(i, { designation: e.target.value }); runSearch(i, e.target.value); }}
                onFocus={() => { if (it.designation.length >= 2) runSearch(i, it.designation); }}
                onBlur={() => setTimeout(() => setSuggestRow((r) => (r === i ? null : r)), 150)} />
              <input className={`${ic} col-span-1`} type="number" min="1" value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} />
              <input className={`${ic} col-span-2`} placeholder="Imm" value={it.avail} onChange={(e) => updateItem(i, { avail: e.target.value })} />
              <input className={`${ic} col-span-1`} type="number" min="0" step="0.01" value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })} />
              <input className={`${ic} col-span-1`} type="number" min="0" max="100" value={it.discount_pct} onChange={(e) => updateItem(i, { discount_pct: Number(e.target.value) })} />
              <span className="col-span-1 text-right text-sm font-bold text-zinc-900 tabular-nums">{lineTotal(it).toLocaleString("en-GB", { maximumFractionDigits: 0 })}</span>
              <button type="button" onClick={() => set("items", v.items.filter((_, idx) => idx !== i))} className="col-span-1 text-zinc-400 hover:text-red-500 flex justify-center" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>

              {suggestRow === i && suggestions.length > 0 && (
                <div className="absolute z-20 top-full left-0 mt-1 w-full sm:w-2/3 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-zinc-400 px-3 pt-2 pb-1"><History className="w-3 h-3" /> Previously used parts</p>
                  {suggestions.map((p) => (
                    <button key={p.reference} type="button" onMouseDown={(e) => { e.preventDefault(); applySuggestion(i, p); }}
                      className="w-full text-left px-3 py-2 hover:bg-sky-50 transition-colors flex items-center justify-between gap-3">
                      <span className="min-w-0"><span className="font-mono text-xs text-sky-600">{p.reference}</span>{p.designation && <span className="block text-sm text-zinc-700 truncate">{p.designation}</span>}</span>
                      {p.last_unit_price != null && <span className="text-xs font-bold text-zinc-500 shrink-0">{formatMoney(p.last_unit_price, v.currency)}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
        <h2 className="font-black text-zinc-950 mb-1">Customs (billed in NAIRA)</h2>
        <p className="text-xs text-zinc-500 mb-4">Leave at 0 if there is no customs portion (template 1 or 2).</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Customs amount ₦</label><input className={ic} type="number" min="0" step="0.01" value={v.customsNaira} onChange={(e) => set("customsNaira", Number(e.target.value))} /></div>
          {v.customsNaira > 0 && <div><label className={lbl}>Label</label><input className={ic} value={v.customsLabel} onChange={(e) => set("customsLabel", e.target.value)} /></div>}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
        <h2 className="font-black text-zinc-950 mb-4">Terms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Payment terms</label><input className={ic} value={v.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} /></div>
          <div><label className={lbl}>Validity</label><input className={ic} value={v.validity} onChange={(e) => set("validity", e.target.value)} /></div>
          <div><label className={lbl}>Delivery terms</label><input className={ic} value={v.deliveryTerms} onChange={(e) => set("deliveryTerms", e.target.value)} /></div>
          <div><label className={lbl}>Incoterms note</label><input className={ic} placeholder="Air freight option incoterms CIF …" value={v.incotermsNote} onChange={(e) => set("incotermsNote", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Internal notes</label><textarea className={`${ic} min-h-[60px]`} value={v.notes} onChange={(e) => set("notes", e.target.value)} /></div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
        <div className="space-y-1.5 text-sm max-w-sm ml-auto">
          <div className="flex justify-between"><span className="text-zinc-500">Subtotal {v.currency}</span><span className="font-semibold text-zinc-900">{formatMoney(totals.mainSubtotal, v.currency)}</span></div>
          {v.applyVat && <div className="flex justify-between"><span className="text-zinc-500">VAT {v.vatRate}%</span><span className="font-semibold text-zinc-900">{formatMoney(totals.mainVat, v.currency)}</span></div>}
          <div className="flex justify-between pt-1.5 border-t border-zinc-100"><span className="font-black text-zinc-950">Total {v.currency}</span><span className="font-black text-sky-600">{formatMoney(totals.mainTotal, v.currency)}</span></div>
          {totals.hasCustoms && (
            <>
              <div className="flex justify-between pt-3"><span className="text-zinc-500">Customs ₦</span><span className="font-semibold text-zinc-900">{formatNaira(totals.nairaSubtotal)}</span></div>
              {v.applyVat && <div className="flex justify-between"><span className="text-zinc-500">VAT {v.vatRate}%</span><span className="font-semibold text-zinc-900">{formatNaira(totals.nairaVat)}</span></div>}
              <div className="flex justify-between pt-1.5 border-t border-zinc-100"><span className="font-black text-zinc-950">Total ₦</span><span className="font-black text-amber-600">{formatNaira(totals.nairaTotal)}</span></div>
            </>
          )}
        </div>
      </section>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">{error}</p>}

      <button type="button" onClick={() => onSubmit(v)} disabled={saving} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-black px-8 py-3 rounded-xl transition-colors disabled:opacity-60">
        <Save className="w-4 h-4" /> {saving ? "Saving…" : submitLabel}
      </button>
    </>
  );
}
