import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, AlertCircle, Save, Wrench, History, Trash2 } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import { supabasePdr } from "@/lib/supabase";
import {
  getEquipment, updateEquipment, deleteEquipment, getEquipmentHistory,
  EQUIPMENT_STATUS_LABEL, EQUIPMENT_STATUS_COLOR,
  type ClientEquipment, type EquipmentStatus, type EquipmentHistoryEntry,
} from "@/lib/equipments";
import { getClient, type Client } from "@/lib/clients";

const DOC_TYPE_LABEL: Record<string, string> = {
  devis: "Offer", bon_commande: "PO", commande_fournisseur: "Supplier",
  bon_reception: "Receipt", bon_livraison: "DN", facture: "Invoice",
};

const SOURCE_BADGE: Record<string, string> = {
  pdr: "bg-sky-100 text-sky-700",
  sav: "bg-emerald-100 text-emerald-700",
};

export default function PdrEquipmentDetail() {
  const [, params] = useRoute<{ id: string }>("/espace-pdr/equipment/:id");
  const [, navigate] = useLocation();
  const id = params?.id;

  const [equipment, setEquipment] = useState<ClientEquipment | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [history, setHistory] = useState<EquipmentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function reload() {
    if (!id) return;
    try {
      const eq = await getEquipment(supabasePdr, id);
      if (!eq) { setError("Equipment not found."); setLoading(false); return; }
      setEquipment(eq);
      const [cl, hist] = await Promise.all([
        getClient(supabasePdr, eq.client_id),
        getEquipmentHistory(supabasePdr, id),
      ]);
      setClient(cl);
      setHistory(hist);
      setLoading(false);
    } catch (e) { setError((e as Error).message); setLoading(false); }
  }

  useEffect(() => { setLoading(true); reload(); }, [id]);

  async function handleSave() {
    if (!equipment) return;
    setSaving(true);
    setError(null);
    try {
      await updateEquipment(supabasePdr, equipment.id, {
        serial_number: equipment.serial_number,
        brand: equipment.brand,
        model: equipment.model,
        machine_type: equipment.machine_type,
        year_manufacture: equipment.year_manufacture,
        purchase_date: equipment.purchase_date,
        hour_meter: equipment.hour_meter,
        status: equipment.status,
        notes: equipment.notes,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!equipment) return;
    if (history.length > 0) {
      alert(`Cannot delete: ${history.length} document(s) reference this equipment.`);
      return;
    }
    if (!window.confirm(`Delete this equipment? This cannot be undone.`)) return;
    try {
      await deleteEquipment(supabasePdr, equipment.id);
      if (client) navigate(`/espace-pdr/client/${client.id}`);
      else navigate("/espace-pdr/equipments");
    } catch (e) { setError((e as Error).message); }
  }

  const ic = "w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-colors";
  const lbl = "block text-xs font-bold text-zinc-500 mb-1.5";

  return (
    <PdrGuard>
      <PdrLayout>
        <div className="p-6 lg:p-10 max-w-4xl mx-auto">
          <button onClick={() => navigate("/espace-pdr/equipments")} className="text-xs text-zinc-500 hover:text-sky-600 inline-flex items-center gap-1 mb-4 transition-colors">
            <ArrowLeft className="h-3 w-3" /> All equipment
          </button>

          {loading && <p className="text-zinc-400 text-sm py-20 text-center animate-pulse">Loading…</p>}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {equipment && (
            <>
              <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black text-sky-600 mb-1">Equipment</p>
                  <h1 className="text-3xl font-black text-zinc-950">
                    <Wrench className="w-6 h-6 inline mr-2 text-sky-500" />
                    {equipment.brand || "—"} {equipment.model || ""}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded ${EQUIPMENT_STATUS_COLOR[equipment.status]}`}>
                      {EQUIPMENT_STATUS_LABEL[equipment.status]}
                    </span>
                    {equipment.serial_number && <span className="font-mono text-xs text-zinc-500">S/N: {equipment.serial_number}</span>}
                    {client && (
                      <Link href={`/espace-pdr/client/${client.id}`} className="text-sky-600 hover:underline text-xs font-semibold">
                        {client.name} ↗
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {saved && <span className="text-xs text-emerald-600 font-semibold">Saved ✓</span>}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              {/* Specs */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-4">Specifications</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={lbl}>Brand</label><input className={ic} value={equipment.brand ?? ""} onChange={(e) => setEquipment({ ...equipment, brand: e.target.value || null })} /></div>
                  <div><label className={lbl}>Model</label><input className={ic} value={equipment.model ?? ""} onChange={(e) => setEquipment({ ...equipment, model: e.target.value || null })} /></div>
                  <div><label className={lbl}>Serial number</label><input className={ic} value={equipment.serial_number ?? ""} onChange={(e) => setEquipment({ ...equipment, serial_number: e.target.value || null })} /></div>
                  <div><label className={lbl}>Machine type</label><input className={ic} placeholder="Mobile crane, telescopic…" value={equipment.machine_type ?? ""} onChange={(e) => setEquipment({ ...equipment, machine_type: e.target.value || null })} /></div>
                  <div><label className={lbl}>Year of manufacture</label><input className={ic} type="number" value={equipment.year_manufacture ?? ""} onChange={(e) => setEquipment({ ...equipment, year_manufacture: e.target.value ? Number(e.target.value) : null })} /></div>
                  <div><label className={lbl}>Purchase date</label><input className={ic} type="date" value={equipment.purchase_date ?? ""} onChange={(e) => setEquipment({ ...equipment, purchase_date: e.target.value || null })} /></div>
                  <div>
                    <label className={lbl}>Hour meter (current reading)</label>
                    <input className={ic} type="number" step="0.1" value={equipment.hour_meter ?? ""} onChange={(e) => setEquipment({ ...equipment, hour_meter: e.target.value ? Number(e.target.value) : null })} />
                    {equipment.hour_meter_updated_at && <p className="text-[11px] text-zinc-400 mt-1">Updated {new Date(equipment.hour_meter_updated_at).toLocaleDateString("en-GB")}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Status</label>
                    <select className={ic} value={equipment.status} onChange={(e) => setEquipment({ ...equipment, status: e.target.value as EquipmentStatus })}>
                      {(Object.keys(EQUIPMENT_STATUS_LABEL) as EquipmentStatus[]).map((k) => (
                        <option key={k} value={k}>{EQUIPMENT_STATUS_LABEL[k]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2"><label className={lbl}>Notes</label><textarea className={`${ic} min-h-[80px]`} value={equipment.notes ?? ""} onChange={(e) => setEquipment({ ...equipment, notes: e.target.value || null })} /></div>
                </div>
              </section>

              {/* 360° history */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-sky-600" /> 360° history ({history.length})
                </h2>
                <p className="text-xs text-zinc-500 mb-4">All PDR and SAV documents that reference this specific machine.</p>
                {history.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">No history yet. Documents linked to this equipment will appear here.</p>}
                {history.length > 0 && (
                  <div className="space-y-1.5">
                    {history.map((h) => (
                      <Link key={`${h.source}-${h.id}`} href={h.source === "pdr" ? `/espace-pdr/document/${h.id}` : `/espace-sav/document/${h.id}`}>
                        <div className="border-b border-zinc-100 last:border-0 px-2 py-2 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-50 rounded transition-colors">
                          <div className="min-w-0 flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded ${SOURCE_BADGE[h.source]}`}>{h.source}</span>
                            <span className="text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">{DOC_TYPE_LABEL[h.type] ?? h.type}</span>
                            <span className="font-mono text-xs text-zinc-500">{h.reference}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-zinc-900 tabular-nums">{h.total_amount.toLocaleString("en-GB")} {h.currency === "EUR" ? "€" : "$"}</p>
                            <p className="text-[11px] text-zinc-400">{new Date(h.created_at).toLocaleDateString("en-GB")}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex justify-end">
                <button onClick={handleDelete} className="inline-flex items-center gap-2 text-red-500 hover:text-red-700 font-semibold text-sm px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete equipment
                </button>
              </div>
            </>
          )}
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
