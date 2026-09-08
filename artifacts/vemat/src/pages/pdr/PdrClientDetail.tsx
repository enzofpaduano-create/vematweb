import { useEffect, useMemo, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, AlertCircle, Save, Trash2, Plus, Wrench, FileText, AlertTriangle } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import { supabasePdr } from "@/lib/supabase";
import {
  getClient, updateClient, deleteClient,
  CLIENT_STATUS_LABEL, CLIENT_STATUS_COLOR, PAYMENT_TERMS_LABEL, isClientLocked,
  type Client, type ClientStatus, type PaymentTerms, type Currency,
} from "@/lib/clients";
import {
  listEquipmentsByClient, createEquipment,
  EQUIPMENT_STATUS_LABEL, EQUIPMENT_STATUS_COLOR,
  type ClientEquipment,
} from "@/lib/equipments";
import { listDocuments, DOC_LABEL_SHORT, formatMoney, type PdrDocument } from "@/lib/pdrDocuments";

export default function PdrClientDetail() {
  const [, params] = useRoute<{ id: string }>("/espace-pdr/client/:id");
  const [, navigate] = useLocation();
  const id = params?.id;

  const [client, setClient] = useState<Client | null>(null);
  const [equipments, setEquipments] = useState<ClientEquipment[]>([]);
  const [docs, setDocs] = useState<PdrDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNewEquip, setShowNewEquip] = useState(false);
  const [newEquip, setNewEquip] = useState({ brand: "", model: "", serial_number: "", machine_type: "" });

  async function reload() {
    if (!id) return;
    try {
      const c = await getClient(supabasePdr, id);
      if (!c) { setError("Client not found."); setLoading(false); return; }
      setClient(c);
      const [eqs, allDocs] = await Promise.all([
        listEquipmentsByClient(supabasePdr, id),
        listDocuments(),
      ]);
      setEquipments(eqs);
      setDocs(allDocs.filter((d) => d.client_id === id));
      setLoading(false);
    } catch (e) { setError((e as Error).message); setLoading(false); }
  }

  useEffect(() => { setLoading(true); reload(); }, [id]);

  const clientDocs = useMemo(() => docs.slice().sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ), [docs]);

  async function handleSave() {
    if (!client) return;
    setSaving(true);
    setError(null);
    try {
      await updateClient(supabasePdr, client.id, {
        name: client.name,
        code_unique: client.code_unique,
        contact_name: client.contact_name,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone,
        address: client.address,
        city: client.city,
        country: client.country,
        payment_terms: client.payment_terms,
        credit_limit: client.credit_limit,
        currency: client.currency,
        status: client.status,
        status_reason: client.status_reason,
        notes: client.notes,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!client) return;
    if (clientDocs.length > 0) {
      alert(`Cannot delete: ${clientDocs.length} document(s) still linked to this client.`);
      return;
    }
    if (!window.confirm(`Delete client "${client.name}"? This cannot be undone.`)) return;
    try {
      await deleteClient(supabasePdr, client.id);
      navigate("/espace-pdr/clients");
    } catch (e) { setError((e as Error).message); }
  }

  async function handleCreateEquipment() {
    if (!client) return;
    if (!newEquip.brand && !newEquip.model && !newEquip.serial_number) return;
    try {
      const created = await createEquipment(supabasePdr, {
        client_id: client.id,
        brand: newEquip.brand || null,
        model: newEquip.model || null,
        serial_number: newEquip.serial_number || null,
        machine_type: newEquip.machine_type || null,
      });
      setEquipments((prev) => [...prev, created]);
      setShowNewEquip(false);
      setNewEquip({ brand: "", model: "", serial_number: "", machine_type: "" });
    } catch (e) { setError((e as Error).message); }
  }

  const ic = "w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-colors";
  const lbl = "block text-xs font-bold text-zinc-500 mb-1.5";

  return (
    <PdrGuard>
      <PdrLayout>
        <div className="p-6 lg:p-10 max-w-4xl mx-auto">
          <Link href="/espace-pdr/clients" className="text-xs text-zinc-500 hover:text-sky-600 inline-flex items-center gap-1 mb-4 transition-colors">
            <ArrowLeft className="h-3 w-3" /> All clients
          </Link>

          {loading && <p className="text-zinc-400 text-sm py-20 text-center animate-pulse">Loading…</p>}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {client && (
            <>
              <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black text-sky-600 mb-1">Client</p>
                  <h1 className="text-3xl font-black text-zinc-950">{client.name}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded ${CLIENT_STATUS_COLOR[client.status]}`}>
                      {CLIENT_STATUS_LABEL[client.status]}
                    </span>
                    {client.code_unique && <span className="font-mono text-xs text-zinc-500">{client.code_unique}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {saved && <span className="text-xs text-emerald-600 font-semibold">Saved ✓</span>}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>

              {isClientLocked(client) && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 mb-6">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-red-800">Client {CLIENT_STATUS_LABEL[client.status].toLowerCase()}</p>
                    <p className="text-sm text-red-700">
                      New billable quotes for this client will be blocked. Override requires N+1 approval.
                      {client.status_reason && <> Reason: <span className="italic">{client.status_reason}</span></>}
                    </p>
                  </div>
                </div>
              )}

              {/* Identity */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-4">Identity & contact</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={lbl}>Company name</label><input className={ic} value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} /></div>
                  <div><label className={lbl}>Unique code</label><input className={ic} placeholder="CLI-0001" value={client.code_unique ?? ""} onChange={(e) => setClient({ ...client, code_unique: e.target.value || null })} /></div>
                  <div><label className={lbl}>Contact name</label><input className={ic} value={client.contact_name ?? ""} onChange={(e) => setClient({ ...client, contact_name: e.target.value || null })} /></div>
                  <div><label className={lbl}>Email</label><input className={ic} type="email" value={client.contact_email ?? ""} onChange={(e) => setClient({ ...client, contact_email: e.target.value || null })} /></div>
                  <div><label className={lbl}>Phone</label><input className={ic} value={client.contact_phone ?? ""} onChange={(e) => setClient({ ...client, contact_phone: e.target.value || null })} /></div>
                  <div><label className={lbl}>City</label><input className={ic} value={client.city ?? ""} onChange={(e) => setClient({ ...client, city: e.target.value || null })} /></div>
                  <div className="sm:col-span-2"><label className={lbl}>Address</label><textarea className={`${ic} min-h-[60px]`} value={client.address ?? ""} onChange={(e) => setClient({ ...client, address: e.target.value || null })} /></div>
                  <div><label className={lbl}>Country</label><input className={ic} value={client.country ?? ""} onChange={(e) => setClient({ ...client, country: e.target.value || null })} /></div>
                </div>
              </section>

              {/* Commercial terms */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-4">Commercial terms</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={lbl}>Payment terms</label>
                    <select className={ic} value={client.payment_terms} onChange={(e) => setClient({ ...client, payment_terms: e.target.value as PaymentTerms })}>
                      {(Object.keys(PAYMENT_TERMS_LABEL) as PaymentTerms[]).map((k) => (
                        <option key={k} value={k}>{PAYMENT_TERMS_LABEL[k]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Credit limit</label>
                    <input className={ic} type="number" min="0" step="100" value={client.credit_limit} onChange={(e) => setClient({ ...client, credit_limit: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className={lbl}>Currency</label>
                    <select className={ic} value={client.currency} onChange={(e) => setClient({ ...client, currency: e.target.value as Currency })}>
                      <option value="EUR">€ EUR</option>
                      <option value="USD">$ USD</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Status */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-4">Status</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Commercial status</label>
                    <select className={ic} value={client.status} onChange={(e) => setClient({ ...client, status: e.target.value as ClientStatus })}>
                      {(Object.keys(CLIENT_STATUS_LABEL) as ClientStatus[]).map((k) => (
                        <option key={k} value={k}>{CLIENT_STATUS_LABEL[k]}</option>
                      ))}
                    </select>
                    {client.status_changed_at && <p className="text-[11px] text-zinc-400 mt-1">Changed {new Date(client.status_changed_at).toLocaleDateString("en-GB")}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Reason (if blocked/dispute)</label>
                    <input className={ic} value={client.status_reason ?? ""} onChange={(e) => setClient({ ...client, status_reason: e.target.value || null })} />
                  </div>
                </div>
                <div className="mt-4">
                  <label className={lbl}>Internal notes</label>
                  <textarea className={`${ic} min-h-[60px]`} value={client.notes ?? ""} onChange={(e) => setClient({ ...client, notes: e.target.value || null })} />
                </div>
              </section>

              {/* Equipment park */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-zinc-950 flex items-center gap-2"><Wrench className="w-4 h-4 text-sky-600" /> Equipment park ({equipments.length})</h2>
                  <button onClick={() => setShowNewEquip(true)} className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 hover:text-sky-500"><Plus className="w-4 h-4" /> Add equipment</button>
                </div>
                {showNewEquip && (
                  <div className="border border-sky-200 rounded-xl p-3 mb-3 bg-sky-50/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                      <input className={ic} placeholder="Brand (Terex…)" value={newEquip.brand} onChange={(e) => setNewEquip({ ...newEquip, brand: e.target.value })} />
                      <input className={ic} placeholder="Model (RT555…)" value={newEquip.model} onChange={(e) => setNewEquip({ ...newEquip, model: e.target.value })} />
                      <input className={ic} placeholder="Serial number" value={newEquip.serial_number} onChange={(e) => setNewEquip({ ...newEquip, serial_number: e.target.value })} />
                      <input className={ic} placeholder="Type (Mobile crane…)" value={newEquip.machine_type} onChange={(e) => setNewEquip({ ...newEquip, machine_type: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCreateEquipment} className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg">Add</button>
                      <button onClick={() => setShowNewEquip(false)} className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 px-2">Cancel</button>
                    </div>
                  </div>
                )}
                {equipments.length === 0 && !showNewEquip && (
                  <p className="text-sm text-zinc-500 text-center py-4">No equipment yet for this client.</p>
                )}
                {equipments.length > 0 && (
                  <div className="space-y-2">
                    {equipments.map((eq) => (
                      <Link key={eq.id} href={`/espace-pdr/equipment/${eq.id}`}>
                        <div className="border border-zinc-200 hover:border-sky-300 rounded-xl px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors">
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-950 text-sm">
                              {eq.brand || "—"} {eq.model || ""}
                              {eq.machine_type && <span className="text-zinc-400 font-normal"> · {eq.machine_type}</span>}
                            </p>
                            <p className="font-mono text-xs text-zinc-500 mt-0.5">
                              S/N: {eq.serial_number || "—"}
                              {eq.hour_meter != null && <span className="text-zinc-400"> · {eq.hour_meter} h</span>}
                            </p>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded shrink-0 ${EQUIPMENT_STATUS_COLOR[eq.status]}`}>
                            {EQUIPMENT_STATUS_LABEL[eq.status]}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* Documents linked */}
              <section className="bg-white rounded-2xl border border-zinc-200 p-6 mb-5">
                <h2 className="font-black text-zinc-950 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-sky-600" /> Documents ({clientDocs.length})</h2>
                {clientDocs.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">No PDR documents linked to this client yet.</p>}
                {clientDocs.length > 0 && (
                  <div className="space-y-1.5">
                    {clientDocs.slice(0, 20).map((d) => (
                      <Link key={d.id} href={`/espace-pdr/document/${d.id}`}>
                        <div className="border-b border-zinc-100 last:border-0 px-2 py-2 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-50 rounded transition-colors">
                          <div className="min-w-0 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">{DOC_LABEL_SHORT[d.type]}</span>
                            <span className="font-mono text-xs text-zinc-500">{d.reference}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-zinc-900">{formatMoney(d.total_amount, d.currency)}</p>
                            <p className="text-[11px] text-zinc-400">{new Date(d.created_at).toLocaleDateString("en-GB")}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {clientDocs.length > 20 && <p className="text-xs text-zinc-400 text-center pt-2">+ {clientDocs.length - 20} more…</p>}
                  </div>
                )}
              </section>

              <div className="flex justify-end">
                <button onClick={handleDelete} className="inline-flex items-center gap-2 text-red-500 hover:text-red-700 font-semibold text-sm px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete client
                </button>
              </div>
            </>
          )}
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
