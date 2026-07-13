/**
 * Conversion step: Deliver (stock) / Order from factory / receipt / invoice…
 * Collects logistics fields then creates the next document in the chain.
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { AlertCircle, ArrowLeft, ArrowRight, Package, Truck, Factory, Warehouse } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import {
  getDocument, convertDocument, DOC_LABEL, formatMoney,
  type PdrDocument, type PdrDocType, type PdrLogistics,
} from "@/lib/pdrDocuments";

const VALID_TYPES: PdrDocType[] = [
  "devis", "bon_commande", "commande_fournisseur",
  "bon_reception", "bon_livraison", "facture",
];

type FormState = {
  warehouse: string;
  supplier_name: string;
  factory_ref: string;
  eta: string;
  delivery_date: string;
  carrier: string;
  received_date: string;
  notes: string;
};

const emptyForm = (): FormState => ({
  warehouse: "Port Harcourt warehouse",
  supplier_name: "",
  factory_ref: "",
  eta: "",
  delivery_date: new Date().toISOString().slice(0, 10),
  carrier: "",
  received_date: new Date().toISOString().slice(0, 10),
  notes: "",
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function PdrConvert() {
  const [, params] = useRoute<{ id: string; toType: string }>("/espace-pdr/document/:id/convert/:toType");
  const [, navigate] = useLocation();
  const id = params?.id;
  const toType = (params?.toType ?? "") as PdrDocType;

  const [parent, setParent] = useState<PdrDocument | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = useMemo(() => VALID_TYPES.includes(toType), [toType]);

  useEffect(() => {
    if (!id || !valid) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const d = await getDocument(id);
        if (!d) { if (!cancelled) setError("Document not found."); setLoading(false); return; }
        if (!cancelled) {
          setParent(d);
          setForm({
            ...emptyForm(),
            warehouse: d.logistics?.warehouse || "Port Harcourt warehouse",
            supplier_name: d.logistics?.supplier_name || "",
            factory_ref: d.logistics?.factory_ref || "",
            eta: d.logistics?.eta || "",
            delivery_date: d.logistics?.delivery_date || todayISO(),
            carrier: d.logistics?.carrier || "",
            received_date: d.logistics?.received_date || todayISO(),
            notes: "",
          });
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) { setError((e as Error).message); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [id, valid]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parent) return;
    setSaving(true);
    setError(null);
    try {
      const logistics: PdrLogistics = { ...(parent.logistics ?? {}) };

      if (toType === "bon_livraison") {
        logistics.branch = logistics.branch ?? "stock";
        logistics.warehouse = form.warehouse.trim() || undefined;
        logistics.delivery_date = form.delivery_date || undefined;
        logistics.carrier = form.carrier.trim() || undefined;
      }
      if (toType === "commande_fournisseur") {
        logistics.branch = "factory";
        logistics.supplier_name = form.supplier_name.trim() || undefined;
        logistics.factory_ref = form.factory_ref.trim() || undefined;
        logistics.eta = form.eta || undefined;
        if (!logistics.supplier_name) throw new Error("Supplier name is required.");
      }
      if (toType === "bon_reception") {
        logistics.received_date = form.received_date || undefined;
        logistics.warehouse = form.warehouse.trim() || logistics.warehouse;
      }
      if (toType === "bon_livraison" && parent.type === "bon_reception") {
        logistics.branch = "factory";
      }

      const child = await convertDocument(parent, toType, {
        logistics,
        notes: form.notes.trim() || parent.notes,
        markParentStatus: "en_cours",
      });
      navigate(`/espace-pdr/document/${child.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  const ic = "w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
  const lbl = "block text-xs font-bold text-zinc-500 mb-1.5";

  const title = valid ? DOC_LABEL[toType] : "Unknown";
  const isStockDn = toType === "bon_livraison" && parent?.type === "bon_commande";
  const isFactory = toType === "commande_fournisseur";
  const isReceipt = toType === "bon_reception";
  const isFactoryDn = toType === "bon_livraison" && parent?.type === "bon_reception";

  return (
    <PdrGuard>
      <PdrLayout>
        <div className="p-6 lg:p-10 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(id ? `/espace-pdr/document/${id}` : "/espace-pdr/documents")}
            className="text-xs text-zinc-500 hover:text-sky-600 inline-flex items-center gap-1 mb-4 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Back to document
          </button>

          {loading && <p className="text-zinc-400 text-sm py-20 text-center animate-pulse">Loading…</p>}
          {error && !parent && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {parent && valid && (
            <form onSubmit={handleSubmit}>
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-sky-600 mb-2">Next step</p>
              <h1 className="text-3xl font-black text-zinc-950 mb-2">{title}</h1>
              <p className="text-sm text-zinc-500 mb-6">
                From <span className="font-mono font-semibold text-zinc-800">{parent.reference}</span>
                {" · "}{parent.client_company || parent.client_name || "Client"}
                {" · "}{formatMoney(parent.total_amount, parent.currency)}
              </p>

              {/* Branch explainer */}
              {parent.type === "bon_commande" && (isStockDn || isFactory) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div className={`rounded-2xl border p-4 ${isStockDn ? "border-sky-400 bg-sky-50" : "border-zinc-200 bg-white opacity-60"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Warehouse className="w-4 h-4 text-sky-600" />
                      <p className="font-black text-sm text-zinc-950">Deliver (stock)</p>
                    </div>
                    <p className="text-xs text-zinc-600">Parts available locally → Delivery Note → Invoice</p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${isFactory ? "border-amber-400 bg-amber-50" : "border-zinc-200 bg-white opacity-60"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Factory className="w-4 h-4 text-amber-600" />
                      <p className="font-black text-sm text-zinc-950">Order from factory</p>
                    </div>
                    <p className="text-xs text-zinc-600">Supplier Order → Receipt → Delivery Note → Invoice</p>
                  </div>
                </div>
              )}

              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5 space-y-4">
                {(isStockDn || isFactoryDn) && (
                  <>
                    <div className="flex items-center gap-2 text-sky-700 font-bold text-sm mb-1">
                      <Truck className="w-4 h-4" /> Delivery details
                    </div>
                    <div>
                      <label className={lbl}>Warehouse / origin</label>
                      <input className={ic} value={form.warehouse} onChange={(e) => set("warehouse", e.target.value)} placeholder="Port Harcourt warehouse" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Delivery date</label>
                        <input className={ic} type="date" value={form.delivery_date} onChange={(e) => set("delivery_date", e.target.value)} />
                      </div>
                      <div>
                        <label className={lbl}>Carrier (optional)</label>
                        <input className={ic} value={form.carrier} onChange={(e) => set("carrier", e.target.value)} placeholder="Own truck / DHL…" />
                      </div>
                    </div>
                  </>
                )}

                {isFactory && (
                  <>
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-1">
                      <Factory className="w-4 h-4" /> Factory order details
                    </div>
                    <div>
                      <label className={lbl}>Supplier name *</label>
                      <input className={ic} required value={form.supplier_name} onChange={(e) => set("supplier_name", e.target.value)} placeholder="Terex / JLG / …" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Factory / supplier ref</label>
                        <input className={ic} value={form.factory_ref} onChange={(e) => set("factory_ref", e.target.value)} placeholder="PO-SUP-…" />
                      </div>
                      <div>
                        <label className={lbl}>ETA</label>
                        <input className={ic} type="date" value={form.eta} onChange={(e) => set("eta", e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {isReceipt && (
                  <>
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-1">
                      <Package className="w-4 h-4" /> Goods receipt
                    </div>
                    {parent.logistics?.supplier_name && (
                      <p className="text-sm text-zinc-600">Supplier: <span className="font-semibold text-zinc-900">{parent.logistics.supplier_name}</span></p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Received date</label>
                        <input className={ic} type="date" value={form.received_date} onChange={(e) => set("received_date", e.target.value)} />
                      </div>
                      <div>
                        <label className={lbl}>Warehouse</label>
                        <input className={ic} value={form.warehouse} onChange={(e) => set("warehouse", e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {!isStockDn && !isFactory && !isReceipt && !isFactoryDn && (
                  <p className="text-sm text-zinc-600">
                    This will create a <strong>{title}</strong> by copying client, lines and amounts from the parent document.
                  </p>
                )}

                <div>
                  <label className={lbl}>Notes (optional)</label>
                  <textarea className={`${ic} min-h-[72px]`} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Internal note for this step…" />
                </div>
              </section>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">{error}</p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black px-8 py-3 rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? "Creating…" : <>Create {title} <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
