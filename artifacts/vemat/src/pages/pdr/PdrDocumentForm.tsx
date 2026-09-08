/**
 * Formulaire partagé création / édition d'un document PDR (offre et suivants).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { History, Plus, Save, Trash2, AlertTriangle, Link2, Unlink } from "lucide-react";
import {
  computeTotals, lineTotal, formatMoney, formatNaira, templateModel, searchParts,
  fetchAgentSuggestions, SOURCE_LABEL,
  type PdrItem, type PdrPart, type Currency, type PdrDocument, type PdrSource,
} from "@/lib/pdrDocuments";
import { supabasePdr } from "@/lib/supabase";
import {
  listClients, CLIENT_STATUS_LABEL, CLIENT_STATUS_COLOR, isClientLocked,
  type Client,
} from "@/lib/clients";
import { listEquipmentsByClient, type ClientEquipment } from "@/lib/equipments";

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
  // Tracking (Hassan's spec)
  source: PdrSource | "";
  assignedAgent: string;
  // Client + equipment link (Hassan spec 11/08)
  clientId: string | null;
  equipmentId: string | null;
  overrideBlock: boolean;   // Override lock when client is bloque/litige (N+1 approval)
}

const AGENT_MEMORY_KEY = "vemat-pdr-last-agent";

export const defaultFormValues = (): PdrFormValues => {
  let rememberedAgent = "";
  try {
    rememberedAgent = localStorage.getItem(AGENT_MEMORY_KEY) ?? "";
  } catch { /* private browsing */ }
  return {
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
    source: "",
    assignedAgent: rememberedAgent,
    clientId: null,
    equipmentId: null,
    overrideBlock: false,
  };
};

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
    source: (doc.source ?? "") as PdrSource | "",
    assignedAgent: doc.assigned_agent ?? "",
    clientId: (doc as unknown as { client_id?: string | null }).client_id ?? null,
    equipmentId: (doc as unknown as { equipment_id?: string | null }).equipment_id ?? null,
    overrideBlock: false,
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
    source: v.source || null,
    assigned_agent: v.assignedAgent.trim() || null,
    client_id: v.clientId,
    equipment_id: v.equipmentId,
  };
}

/** Should we block save because the linked client is locked and no override? */
export function shouldBlockSave(v: PdrFormValues, client: Client | null): boolean {
  if (!client) return false;
  if (!isClientLocked(client)) return false;
  return !v.overrideBlock;
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
  const [agentSuggestions, setAgentSuggestions] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [equipments, setEquipments] = useState<ClientEquipment[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedClient = useMemo(
    () => (v.clientId ? clients.find((c) => c.id === v.clientId) ?? null : null),
    [v.clientId, clients],
  );

  useEffect(() => {
    setV(initial);
  }, [syncKey]); // eslint-disable-line react-hooks/exhaustive-deps -- sync when source id / doc id changes

  // Fetch previously used agent names for the autocomplete datalist.
  useEffect(() => {
    let cancelled = false;
    fetchAgentSuggestions().then((names) => { if (!cancelled) setAgentSuggestions(names); });
    return () => { cancelled = true; };
  }, []);

  // Remember last used agent locally so it prefills on next document.
  useEffect(() => {
    if (v.assignedAgent.trim()) {
      try { localStorage.setItem(AGENT_MEMORY_KEY, v.assignedAgent.trim()); } catch { /* ignore */ }
    }
  }, [v.assignedAgent]);

  // Load all clients once for the selector.
  useEffect(() => {
    let cancelled = false;
    listClients(supabasePdr).then((list) => { if (!cancelled) setClients(list); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Load equipments when a client is picked.
  useEffect(() => {
    let cancelled = false;
    if (v.clientId) {
      listEquipmentsByClient(supabasePdr, v.clientId).then((list) => { if (!cancelled) setEquipments(list); }).catch(() => {});
    } else {
      setEquipments([]);
    }
    return () => { cancelled = true; };
  }, [v.clientId]);

  // When user picks a client, prefill the client fields on the doc (they can still edit).
  function pickClient(id: string) {
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    setV((prev) => ({
      ...prev,
      clientId: c.id,
      equipmentId: null,
      overrideBlock: false,
      company: c.name || prev.company,
      address: c.address || prev.address,
      name: c.contact_name || prev.name,
      email: c.contact_email || prev.email,
      phone: c.contact_phone || prev.phone,
      clientCode: c.code_unique || prev.clientCode,
    }));
  }

  function pickEquipment(id: string) {
    const eq = equipments.find((x) => x.id === id);
    if (!eq) { setV((prev) => ({ ...prev, equipmentId: null })); return; }
    const machineText = [eq.brand, eq.model, eq.serial_number ? `s/n ${eq.serial_number}` : ""]
      .filter(Boolean).join(" ");
    setV((prev) => ({
      ...prev,
      equipmentId: eq.id,
      machine: machineText || prev.machine,
    }));
  }

  const clientLocked = isClientLocked(selectedClient);

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
        <h2 className="font-black text-zinc-950 mb-1">Request tracking</h2>
        <p className="text-xs text-zinc-500 mb-4">Where the demand came from and who is handling it.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Source / channel</label>
            <select
              className={ic}
              value={v.source}
              onChange={(e) => set("source", (e.target.value || "") as PdrSource | "")}
            >
              <option value="">— Select source —</option>
              {(Object.keys(SOURCE_LABEL) as PdrSource[]).map((s) => (
                <option key={s} value={s}>{SOURCE_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Assigned agent</label>
            <input
              className={ic}
              list="pdr-agent-suggestions"
              placeholder="Your name (e.g. Hassan)"
              value={v.assignedAgent}
              onChange={(e) => set("assignedAgent", e.target.value)}
            />
            <datalist id="pdr-agent-suggestions">
              {agentSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="w-4 h-4 text-sky-600" />
          <h2 className="font-black text-zinc-950">Link to existing client / equipment</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-4">Pick an existing client to prefill contact info and enforce commercial rules (blocking, credit).</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Client</label>
            <div className="flex gap-2">
              <select
                className={ic}
                value={v.clientId ?? ""}
                onChange={(e) => e.target.value ? pickClient(e.target.value) : setV((prev) => ({ ...prev, clientId: null, equipmentId: null, overrideBlock: false }))}
              >
                <option value="">— No client linked —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.code_unique ? ` (${c.code_unique})` : ""}{c.status !== "actif" ? ` — ${CLIENT_STATUS_LABEL[c.status]}` : ""}
                  </option>
                ))}
              </select>
              {v.clientId && (
                <button
                  type="button"
                  onClick={() => setV((prev) => ({ ...prev, clientId: null, equipmentId: null, overrideBlock: false }))}
                  className="text-xs text-zinc-500 hover:text-red-500 px-2"
                  title="Unlink client"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              )}
            </div>
            {selectedClient && (
              <span className={`inline-block mt-2 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded ${CLIENT_STATUS_COLOR[selectedClient.status]}`}>
                {CLIENT_STATUS_LABEL[selectedClient.status]}
              </span>
            )}
          </div>
          <div>
            <label className={lbl}>Equipment (from client's park)</label>
            <select
              className={ic}
              value={v.equipmentId ?? ""}
              onChange={(e) => pickEquipment(e.target.value)}
              disabled={!v.clientId}
            >
              <option value="">{v.clientId ? "— No equipment linked —" : "— Pick a client first —"}</option>
              {equipments.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {[eq.brand, eq.model].filter(Boolean).join(" ")}{eq.serial_number ? ` — S/N ${eq.serial_number}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {clientLocked && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-800">
                  Client is {CLIENT_STATUS_LABEL[selectedClient!.status].toLowerCase()} — save blocked
                </p>
                <p className="text-sm text-red-700">
                  Billable quotes for this client require N+1 approval before creation.
                  {selectedClient!.status_reason && <> Reason: <span className="italic">{selectedClient!.status_reason}</span></>}
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-red-800 mt-2">
              <input
                type="checkbox"
                checked={v.overrideBlock}
                onChange={(e) => set("overrideBlock", e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
              I have N+1 approval — allow creating this document anyway
            </label>
          </div>
        )}
      </section>

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

      {clientLocked && !v.overrideBlock && (
        <p className="text-sm text-red-600 mb-3 font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Cannot save: client is locked. Check the N+1 override box above or pick a different client.
        </p>
      )}

      <button
        type="button"
        onClick={() => onSubmit(v)}
        disabled={saving || (clientLocked && !v.overrideBlock)}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-black px-8 py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" /> {saving ? "Saving…" : submitLabel}
      </button>
    </>
  );
}
