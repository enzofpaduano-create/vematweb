import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, AlertTriangle, Link2, Unlink } from "lucide-react";
import {
  computeSavTotals, labourTotal, travelTotal, partsTotal, partLineTotal,
  formatMoney, formatNaira, getSavSettings, type SavDocument,
  type SavPart, type Currency, type LabourMode, type PaymentMode, type SavSettings,
} from "@/lib/savDocuments";
import { supabaseSav } from "@/lib/supabase";
import {
  listClients, CLIENT_STATUS_LABEL, CLIENT_STATUS_COLOR, isClientLocked,
  type Client,
} from "@/lib/clients";
import { listEquipmentsByClient, type ClientEquipment } from "@/lib/equipments";

export const emptyPart = (): SavPart => ({ reference: "", designation: "", quantity: 1, unit_price: 0, discount_pct: 0 });

export interface SavFormValues {
  company: string; name: string; email: string; phone: string; address: string;
  attention: string; machine: string; clientCode: string; location: string;
  interventionDescription: string; interventionDate: string;
  labourMode: LabourMode; labourDays: number; labourDailyRate: number; labourFixed: number; labourDescription: string;
  travelKm: number; travelKmRate: number; travelHours: number; travelHourRate: number;
  travelMeals: number; travelHotel: number; travelOther: number;
  parts: SavPart[];
  currency: Currency; applyVat: boolean; vatRate: number; customsNaira: number; customsLabel: string;
  paymentMode: PaymentMode;
  paymentTerms: string; validity: string; deliveryTerms: string; incotermsNote: string; notes: string;
  // Client + equipment link (Hassan spec 11/08)
  clientId: string | null;
  equipmentId: string | null;
  overrideBlock: boolean;
}

export function valuesFromSavDocument(doc: SavDocument): Partial<SavFormValues> {
  return {
    clientId: doc.client_id ?? null,
    equipmentId: doc.equipment_id ?? null,
    overrideBlock: false,
  };
}

export const defaultFormValues = (): SavFormValues => ({
  company: "", name: "", email: "", phone: "", address: "",
  attention: "", machine: "", clientCode: "", location: "",
  interventionDescription: "", interventionDate: "",
  labourMode: "daily", labourDays: 0, labourDailyRate: 0, labourFixed: 0, labourDescription: "",
  travelKm: 0, travelKmRate: 0, travelHours: 0, travelHourRate: 0,
  travelMeals: 0, travelHotel: 0, travelOther: 0,
  parts: [],
  currency: "EUR", applyVat: false, vatRate: 7.5, customsNaira: 0, customsLabel: "CUSTOMS CLEARING and DELIVERY",
  paymentMode: "advance",
  paymentTerms: "Advance payment", validity: "30 Days", deliveryTerms: "", incotermsNote: "", notes: "",
  clientId: null, equipmentId: null, overrideBlock: false,
});

export function formToPayload(v: SavFormValues) {
  return {
    client_company: v.company || null, client_name: v.name || null, client_email: v.email || null,
    client_phone: v.phone || null, client_address: v.address || null, attention: v.attention || null,
    machine: v.machine || null, client_code: v.clientCode || null, location: v.location || null,
    intervention_description: v.interventionDescription || null,
    intervention_date: v.interventionDate || null,
    labour_mode: v.labourMode, labour_days: v.labourDays, labour_daily_rate: v.labourDailyRate,
    labour_fixed_amount: v.labourFixed, labour_description: v.labourDescription || null,
    travel_km: v.travelKm, travel_km_rate: v.travelKmRate, travel_hours: v.travelHours, travel_hour_rate: v.travelHourRate,
    travel_meals: v.travelMeals, travel_hotel: v.travelHotel, travel_other: v.travelOther,
    parts: v.parts.filter((p) => p.designation.trim() !== "" || p.reference.trim() !== ""),
    currency: v.currency, apply_vat: v.applyVat, vat_rate: v.vatRate,
    customs_naira: v.customsNaira, customs_label: v.customsNaira > 0 ? v.customsLabel : null,
    payment_mode: v.paymentMode,
    payment_terms: v.paymentTerms || null, validity: v.validity || null,
    delivery_terms: v.deliveryTerms || null, incoterms_note: v.incotermsNote || null,
    notes: v.notes || null,
    client_id: v.clientId,
    equipment_id: v.equipmentId,
  };
}

export function shouldBlockSavSave(v: SavFormValues, client: Client | null): boolean {
  if (!client) return false;
  if (!isClientLocked(client)) return false;
  return !v.overrideBlock;
}

interface Props {
  initial: SavFormValues;
  syncKey: string;
  title: string;
  submitLabel: string;
  saving: boolean;
  error: string | null;
  onSubmit: (v: SavFormValues) => void;
  applySettingsRates?: boolean;   // pré-remplir les taux depuis Settings (nouvelle offre)
}

export function SavDocumentForm({ initial, syncKey, title, submitLabel, saving, error, onSubmit, applySettingsRates }: Props) {
  const [v, setV] = useState<SavFormValues>(initial);
  const set = <K extends keyof SavFormValues>(k: K, val: SavFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  useEffect(() => { setV(initial); }, [syncKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const [clients, setClients] = useState<Client[]>([]);
  const [equipments, setEquipments] = useState<ClientEquipment[]>([]);

  const selectedClient = useMemo(
    () => (v.clientId ? clients.find((c) => c.id === v.clientId) ?? null : null),
    [v.clientId, clients],
  );

  useEffect(() => {
    let cancelled = false;
    listClients(supabaseSav).then((list) => { if (!cancelled) setClients(list); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (v.clientId) {
      listEquipmentsByClient(supabaseSav, v.clientId).then((list) => { if (!cancelled) setEquipments(list); }).catch(() => {});
    } else {
      setEquipments([]);
    }
    return () => { cancelled = true; };
  }, [v.clientId]);

  function pickClient(id: string) {
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    setV((prev) => ({
      ...prev,
      clientId: c.id, equipmentId: null, overrideBlock: false,
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
    const machineText = [eq.brand, eq.model, eq.serial_number ? `s/n ${eq.serial_number}` : ""].filter(Boolean).join(" ");
    setV((prev) => ({ ...prev, equipmentId: eq.id, machine: machineText || prev.machine }));
  }

  const clientLocked = isClientLocked(selectedClient);

  // Applique les taux globaux (Settings) sur une nouvelle offre si non déjà saisis
  useEffect(() => {
    if (!applySettingsRates) return;
    let cancelled = false;
    getSavSettings().then((s: SavSettings) => {
      if (cancelled) return;
      setV((p) => ({
        ...p,
        currency: p.currency === "EUR" && s.default_currency ? s.default_currency : p.currency,
        vatRate: p.vatRate || s.default_vat_rate,
        labourDailyRate: p.labourDailyRate || s.labour_daily_rate,
        travelKmRate: p.travelKmRate || s.travel_km_rate,
        travelHourRate: p.travelHourRate || s.travel_hour_rate,
        travelMeals: p.travelMeals || s.meal_rate,
        travelHotel: p.travelHotel || s.hotel_rate,
      }));
    });
    return () => { cancelled = true; };
  }, [syncKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = computeSavTotals({
    labour_mode: v.labourMode, labour_days: v.labourDays, labour_daily_rate: v.labourDailyRate, labour_fixed_amount: v.labourFixed,
    travel_km: v.travelKm, travel_km_rate: v.travelKmRate, travel_hours: v.travelHours, travel_hour_rate: v.travelHourRate,
    travel_meals: v.travelMeals, travel_hotel: v.travelHotel, travel_other: v.travelOther,
    parts: v.parts, apply_vat: v.applyVat, vat_rate: v.vatRate, customs_naira: v.customsNaira,
  });

  const updatePart = (i: number, patch: Partial<SavPart>) => setV((p) => ({ ...p, parts: p.parts.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }));

  const ic = "w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors";
  const lbl = "block text-xs font-bold text-zinc-500 mb-1.5";
  const numField = (val: number, on: (n: number) => void, extra = "") => (
    <input className={`${ic} ${extra}`} type="number" step="0.01" value={val} onChange={(e) => on(Number(e.target.value))} />
  );

  return (
    <>
      <h1 className="text-3xl font-black text-zinc-950 mb-1">{title}</h1>
      <p className="text-zinc-500 text-sm mb-8">{v.currency}{v.applyVat ? ` · VAT ${v.vatRate}%` : ""}{v.customsNaira > 0 ? " · customs NGN" : ""} · {v.paymentMode === "advance" ? "advance payment" : "payment after delivery"}</p>

      {/* Link to existing client / equipment */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="w-4 h-4 text-emerald-600" />
          <h2 className="font-black text-zinc-950">Link to existing client / equipment</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-4">Pick an existing client to prefill contact info and enforce commercial rules.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Client</label>
            <div className="flex gap-2">
              <select className={ic} value={v.clientId ?? ""} onChange={(e) => e.target.value ? pickClient(e.target.value) : setV((prev) => ({ ...prev, clientId: null, equipmentId: null, overrideBlock: false }))}>
                <option value="">— No client linked —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.code_unique ? ` (${c.code_unique})` : ""}{c.status !== "actif" ? ` — ${CLIENT_STATUS_LABEL[c.status]}` : ""}</option>
                ))}
              </select>
              {v.clientId && (
                <button type="button" onClick={() => setV((prev) => ({ ...prev, clientId: null, equipmentId: null, overrideBlock: false }))} className="text-xs text-zinc-500 hover:text-red-500 px-2" title="Unlink"><Unlink className="w-4 h-4" /></button>
              )}
            </div>
            {selectedClient && (
              <span className={`inline-block mt-2 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded ${CLIENT_STATUS_COLOR[selectedClient.status]}`}>{CLIENT_STATUS_LABEL[selectedClient.status]}</span>
            )}
          </div>
          <div>
            <label className={lbl}>Equipment (from client's park)</label>
            <select className={ic} value={v.equipmentId ?? ""} onChange={(e) => pickEquipment(e.target.value)} disabled={!v.clientId}>
              <option value="">{v.clientId ? "— No equipment linked —" : "— Pick a client first —"}</option>
              {equipments.map((eq) => (
                <option key={eq.id} value={eq.id}>{[eq.brand, eq.model].filter(Boolean).join(" ")}{eq.serial_number ? ` — S/N ${eq.serial_number}` : ""}</option>
              ))}
            </select>
          </div>
        </div>

        {clientLocked && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-800">Client is {CLIENT_STATUS_LABEL[selectedClient!.status].toLowerCase()} — save blocked</p>
                <p className="text-sm text-red-700">Billable service offers for this client require N+1 approval.{selectedClient!.status_reason && <> Reason: <span className="italic">{selectedClient!.status_reason}</span></>}</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-red-800 mt-2">
              <input type="checkbox" checked={v.overrideBlock} onChange={(e) => set("overrideBlock", e.target.checked)} className="w-4 h-4 accent-red-600" />
              I have N+1 approval — allow creating this document anyway
            </label>
          </div>
        )}
      </section>

      {/* Client & machine */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
        <h2 className="font-black text-zinc-950 mb-4">Client &amp; machine</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Company</label><input className={ic} value={v.company} onChange={(e) => set("company", e.target.value)} /></div>
          <div><label className={lbl}>Attention</label><input className={ic} placeholder="Mr. …" value={v.attention} onChange={(e) => set("attention", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Address</label><textarea className={`${ic} min-h-[60px]`} value={v.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div><label className={lbl}>Machine (+ serial)</label><input className={ic} placeholder="RT555 s/n 161606" value={v.machine} onChange={(e) => set("machine", e.target.value)} /></div>
          <div><label className={lbl}>Client code</label><input className={ic} value={v.clientCode} onChange={(e) => set("clientCode", e.target.value)} /></div>
          <div><label className={lbl}>Contact</label><input className={ic} value={v.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div><label className={lbl}>Email</label><input className={ic} value={v.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div><label className={lbl}>Phone</label><input className={ic} value={v.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          <div><label className={lbl}>Site / location</label><input className={ic} value={v.location} onChange={(e) => set("location", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Intervention description</label><textarea className={`${ic} min-h-[60px]`} value={v.interventionDescription} onChange={(e) => set("interventionDescription", e.target.value)} /></div>
          <div><label className={lbl}>Intervention date</label><input className={ic} type="date" value={v.interventionDate} onChange={(e) => set("interventionDate", e.target.value)} /></div>
        </div>
      </section>

      {/* Labour */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-zinc-950">Labour</h2>
          <span className="text-sm font-bold text-emerald-700">{formatMoney(labourTotal({ labour_mode: v.labourMode, labour_days: v.labourDays, labour_daily_rate: v.labourDailyRate, labour_fixed_amount: v.labourFixed }), v.currency)}</span>
        </div>
        <div className="inline-flex rounded-xl border border-zinc-200 overflow-hidden mb-4">
          {(["daily", "fixed"] as LabourMode[]).map((m) => (
            <button key={m} type="button" onClick={() => set("labourMode", m)}
              className={`px-4 py-2 text-sm font-bold transition-colors ${v.labourMode === m ? "bg-emerald-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>
              {m === "daily" ? "Daily rate" : "Fixed price"}
            </button>
          ))}
        </div>
        {v.labourMode === "daily" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Days</label>{numField(v.labourDays, (n) => set("labourDays", n))}</div>
            <div><label className={lbl}>Daily rate</label>{numField(v.labourDailyRate, (n) => set("labourDailyRate", n))}</div>
          </div>
        ) : (
          <div><label className={lbl}>Fixed amount</label>{numField(v.labourFixed, (n) => set("labourFixed", n))}</div>
        )}
        <div className="mt-4"><label className={lbl}>Labour description (optional)</label><input className={ic} value={v.labourDescription} onChange={(e) => set("labourDescription", e.target.value)} /></div>
      </section>

      {/* Travel */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-zinc-950">Travel</h2>
          <span className="text-sm font-bold text-emerald-700">{formatMoney(travelTotal({ travel_km: v.travelKm, travel_km_rate: v.travelKmRate, travel_hours: v.travelHours, travel_hour_rate: v.travelHourRate, travel_meals: v.travelMeals, travel_hotel: v.travelHotel, travel_other: v.travelOther }), v.currency)}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><label className={lbl}>Km</label>{numField(v.travelKm, (n) => set("travelKm", n))}</div>
          <div><label className={lbl}>Rate / km</label>{numField(v.travelKmRate, (n) => set("travelKmRate", n))}</div>
          <div><label className={lbl}>Travel hours</label>{numField(v.travelHours, (n) => set("travelHours", n))}</div>
          <div><label className={lbl}>Rate / hour</label>{numField(v.travelHourRate, (n) => set("travelHourRate", n))}</div>
          <div><label className={lbl}>Meals</label>{numField(v.travelMeals, (n) => set("travelMeals", n))}</div>
          <div><label className={lbl}>Hotel</label>{numField(v.travelHotel, (n) => set("travelHotel", n))}</div>
          <div><label className={lbl}>Other</label>{numField(v.travelOther, (n) => set("travelOther", n))}</div>
        </div>
      </section>

      {/* Parts */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-zinc-950">Spare parts</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-emerald-700">{formatMoney(partsTotal(v.parts), v.currency)}</span>
            <button type="button" onClick={() => set("parts", [...v.parts, emptyPart()])} className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-500">
              <Plus className="w-4 h-4" /> Add part
            </button>
          </div>
        </div>
        {v.parts.length === 0 ? (
          <p className="text-sm text-zinc-400">No parts. Add a line if the intervention needs parts — you'll be able to send a request to the PDR desk from the document page.</p>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-12 gap-2 px-1 pb-1 text-[10px] font-black uppercase tracking-wide text-zinc-400">
              <span className="col-span-3">Reference</span><span className="col-span-4">Designation</span><span className="col-span-1">Qty</span><span className="col-span-1">Unit</span><span className="col-span-1">Disc.%</span><span className="col-span-1 text-right">Total</span><span className="col-span-1" />
            </div>
            <div className="space-y-2">
              {v.parts.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input className={`${ic} col-span-3`} placeholder="Ref." value={it.reference} onChange={(e) => updatePart(i, { reference: e.target.value })} />
                  <input className={`${ic} col-span-4`} placeholder="Designation" value={it.designation} onChange={(e) => updatePart(i, { designation: e.target.value })} />
                  <input className={`${ic} col-span-1`} type="number" min="1" value={it.quantity} onChange={(e) => updatePart(i, { quantity: Number(e.target.value) })} />
                  <input className={`${ic} col-span-1`} type="number" min="0" step="0.01" value={it.unit_price} onChange={(e) => updatePart(i, { unit_price: Number(e.target.value) })} />
                  <input className={`${ic} col-span-1`} type="number" min="0" max="100" value={it.discount_pct} onChange={(e) => updatePart(i, { discount_pct: Number(e.target.value) })} />
                  <span className="col-span-1 text-right text-sm font-bold text-zinc-900 tabular-nums">{partLineTotal(it).toLocaleString("en-GB", { maximumFractionDigits: 0 })}</span>
                  <button type="button" onClick={() => set("parts", v.parts.filter((_, idx) => idx !== i))} className="col-span-1 text-zinc-400 hover:text-red-500 flex justify-center" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Options: currency, VAT, payment mode, customs */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
        <h2 className="font-black text-zinc-950 mb-4">Options</h2>
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className={lbl}>Currency</label>
            <div className="inline-flex rounded-xl border border-zinc-200 overflow-hidden">
              {(["EUR", "USD"] as Currency[]).map((c) => (
                <button key={c} type="button" onClick={() => set("currency", c)}
                  className={`px-4 py-2 text-sm font-bold transition-colors ${v.currency === c ? "bg-emerald-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>
                  {c === "EUR" ? "€ EUR" : "$ USD"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>Payment</label>
            <div className="inline-flex rounded-xl border border-zinc-200 overflow-hidden">
              {(["advance", "after"] as PaymentMode[]).map((m) => (
                <button key={m} type="button" onClick={() => set("paymentMode", m)}
                  className={`px-4 py-2 text-sm font-bold transition-colors ${v.paymentMode === m ? "bg-emerald-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>
                  {m === "advance" ? "Advance" : "After delivery"}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pb-2">
            <input type="checkbox" checked={v.applyVat} onChange={(e) => set("applyVat", e.target.checked)} className="w-4 h-4 accent-emerald-600" />
            <span className="text-sm font-semibold text-zinc-700">Apply VAT</span>
          </label>
          {v.applyVat && <div><label className={lbl}>VAT %</label><input className={`${ic} w-24`} type="number" step="0.5" value={v.vatRate} onChange={(e) => set("vatRate", Number(e.target.value))} /></div>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-100">
          <div><label className={lbl}>Customs amount ₦ (0 if none)</label>{numField(v.customsNaira, (n) => set("customsNaira", n))}</div>
          {v.customsNaira > 0 && <div><label className={lbl}>Customs label</label><input className={ic} value={v.customsLabel} onChange={(e) => set("customsLabel", e.target.value)} /></div>}
        </div>
      </section>

      {/* Terms */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
        <h2 className="font-black text-zinc-950 mb-4">Terms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Payment terms</label><input className={ic} value={v.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} /></div>
          <div><label className={lbl}>Validity</label><input className={ic} value={v.validity} onChange={(e) => set("validity", e.target.value)} /></div>
          <div><label className={lbl}>Delivery terms</label><input className={ic} value={v.deliveryTerms} onChange={(e) => set("deliveryTerms", e.target.value)} /></div>
          <div><label className={lbl}>Incoterms note</label><input className={ic} value={v.incotermsNote} onChange={(e) => set("incotermsNote", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Internal notes</label><textarea className={`${ic} min-h-[60px]`} value={v.notes} onChange={(e) => set("notes", e.target.value)} /></div>
        </div>
      </section>

      {/* Totals */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
        <div className="space-y-1.5 text-sm max-w-sm ml-auto">
          <div className="flex justify-between"><span className="text-zinc-500">Labour</span><span className="font-semibold text-zinc-900">{formatMoney(totals.labour, v.currency)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Travel</span><span className="font-semibold text-zinc-900">{formatMoney(totals.travel, v.currency)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Parts</span><span className="font-semibold text-zinc-900">{formatMoney(totals.parts, v.currency)}</span></div>
          <div className="flex justify-between pt-1.5 border-t border-zinc-100"><span className="text-zinc-500">Subtotal</span><span className="font-semibold text-zinc-900">{formatMoney(totals.subtotal, v.currency)}</span></div>
          {v.applyVat && <div className="flex justify-between"><span className="text-zinc-500">VAT {v.vatRate}%</span><span className="font-semibold text-zinc-900">{formatMoney(totals.vat, v.currency)}</span></div>}
          <div className="flex justify-between pt-1.5 border-t border-zinc-100 text-base"><span className="font-black text-zinc-950">Total {v.currency}</span><span className="font-black text-emerald-600">{formatMoney(totals.total, v.currency)}</span></div>
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

      <button onClick={() => onSubmit(v)} disabled={saving || (clientLocked && !v.overrideBlock)} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
        <Save className="w-4 h-4" /> {saving ? "Saving…" : submitLabel}
      </button>
    </>
  );
}
