import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { listClients, createClient, type Client } from "@/lib/clients";
import { listEquipmentsByClient, type ClientEquipment } from "@/lib/equipments";
import {
  createRequest, addEvent,
  REQUEST_TYPE_LABEL, PRIORITY_LABEL, RECEIVED_VIA_LABEL, WAITING_ON_LABEL,
  type RequestType, type RequestPriority, type ReceivedVia, type WaitingOn,
} from "@/lib/quotationRegister";
import { INPUT_CLS, type RegisterPortal } from "./registerContext";

interface Props {
  ctx: RegisterPortal;
  onClose: () => void;
  onCreated: (id: string, requestNo: string) => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NewRequestDialog({ ctx, onClose, onCreated }: Props) {
  const { sb, accent, userEmail } = ctx;
  const [clients, setClients] = useState<Client[]>([]);
  const [equipments, setEquipments] = useState<ClientEquipment[]>([]);
  const [clientId, setClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [addingClient, setAddingClient] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>("spare_parts");
  const [priority, setPriority] = useState<RequestPriority>("medium");
  const [receivedAt, setReceivedAt] = useState(today());
  const [via, setVia] = useState<ReceivedVia | "">("");
  const [site, setSite] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [details, setDetails] = useState("");
  const [missing, setMissing] = useState("");
  const [waitingOn, setWaitingOn] = useState<WaitingOn | "">("");
  const [costingOwner, setCostingOwner] = useState("");
  const [loggedBy, setLoggedBy] = useState(userEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listClients(sb).then(setClients).catch((e) => setError((e as Error).message));
  }, [sb]);

  useEffect(() => {
    if (!clientId) { setEquipments([]); setEquipmentId(""); return; }
    listEquipmentsByClient(sb, clientId).then(setEquipments).catch(() => setEquipments([]));
    const c = clients.find((x) => x.id === clientId);
    if (c) {
      setContactName((v) => v || c.contact_name || "");
      setContactEmail((v) => v || c.contact_email || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, sb]);

  async function handleAddClient() {
    const name = newClientName.trim();
    if (!name) return;
    try {
      const c = await createClient(sb, { name, currency: "USD", country: "Nigeria" });
      setClients((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)));
      setClientId(c.id);
      setNewClientName("");
      setAddingClient(false);
    } catch (e) { setError((e as Error).message); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) { setError("Choose a client (or add one)."); return; }
    setSaving(true); setError(null);
    try {
      const { id, request_no } = await createRequest(sb, {
        client_id: clientId,
        request_type: requestType,
        priority,
        received_at: receivedAt || undefined,
        received_via: via || null,
        logged_by: loggedBy.trim() || null,
        costing_owner: costingOwner.trim() || null,
        contact_name: contactName.trim() || null,
        contact_email: contactEmail.trim() || null,
        site: site.trim() || null,
        equipment_id: equipmentId || null,
        request_details: details.trim() || null,
        missing_info: missing.trim() || null,
        waiting_on: waitingOn || (missing.trim() ? "client" : null),
      });
      await addEvent(sb, id, "status", "Request logged", userEmail).catch(() => {});
      onCreated(id, request_no);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  const label = "block text-xs font-bold text-zinc-500 mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="New quotation request">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2 className="font-black text-zinc-950">New quotation request</h2>
            <p className="text-xs text-zinc-500">The request number (VW-year-number) is assigned automatically.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={label}>Client *</label>
            <div className="flex gap-2">
              <select className={`${INPUT_CLS} ${accent.ring}`} value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                <option value="">— choose —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={() => setAddingClient((v) => !v)} className="shrink-0 inline-flex items-center gap-1 text-xs font-bold border border-zinc-200 rounded-lg px-3 hover:bg-zinc-50">
                <Plus className="w-3.5 h-3.5" /> New client
              </button>
            </div>
            {addingClient && (
              <div className="flex gap-2 mt-2">
                <input className={`${INPUT_CLS} ${accent.ring}`} placeholder="Client company name" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                <button type="button" onClick={handleAddClient} className={`shrink-0 text-xs font-bold rounded-lg px-3 ${accent.solid}`}>Add</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={label}>Request type *</label>
              <select className={`${INPUT_CLS} ${accent.ring}`} value={requestType} onChange={(e) => setRequestType(e.target.value as RequestType)}>
                {(Object.keys(REQUEST_TYPE_LABEL) as RequestType[]).map((t) => <option key={t} value={t}>{REQUEST_TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Priority</label>
              <select className={`${INPUT_CLS} ${accent.ring}`} value={priority} onChange={(e) => setPriority(e.target.value as RequestPriority)}>
                {(Object.keys(PRIORITY_LABEL) as RequestPriority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Date received</label>
              <input type="date" className={`${INPUT_CLS} ${accent.ring}`} value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Location / site</label>
              <input className={`${INPUT_CLS} ${accent.ring}`} value={site} onChange={(e) => setSite(e.target.value)} placeholder="e.g. Port Harcourt yard" />
            </div>
            <div>
              <label className={label}>Machine (from the client's equipment park)</label>
              <select className={`${INPUT_CLS} ${accent.ring}`} value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} disabled={!clientId}>
                <option value="">{equipments.length === 0 && clientId ? "No machine registered" : "— none —"}</option>
                {equipments.map((q) => (
                  <option key={q.id} value={q.id}>{[q.brand, q.model].filter(Boolean).join(" ")}{q.serial_number ? ` · s/n ${q.serial_number}` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Contact name</label>
              <input className={`${INPUT_CLS} ${accent.ring}`} value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div>
              <label className={label}>Contact e-mail</label>
              <input type="email" className={`${INPUT_CLS} ${accent.ring}`} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={label}>What the client asks for</label>
            <textarea className={`${INPUT_CLS} ${accent.ring} min-h-[80px]`} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Part numbers, symptoms, scope of work, number of trainees…" />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
            <div>
              <label className={label}>Information still missing to quote (leave empty if nothing)</label>
              <input className={`${INPUT_CLS} ${accent.ring}`} value={missing} onChange={(e) => setMissing(e.target.value)} placeholder="e.g. serial number, photo of the data plate" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={label}>Waiting on</label>
                <select className={`${INPUT_CLS} ${accent.ring}`} value={waitingOn} onChange={(e) => setWaitingOn(e.target.value as WaitingOn | "")}>
                  <option value="">—</option>
                  {(Object.keys(WAITING_ON_LABEL) as WaitingOn[]).map((w) => <option key={w} value={w}>{WAITING_ON_LABEL[w]}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Received via</label>
                <select className={`${INPUT_CLS} ${accent.ring}`} value={via} onChange={(e) => setVia(e.target.value as ReceivedVia | "")}>
                  <option value="">—</option>
                  {(Object.keys(RECEIVED_VIA_LABEL) as ReceivedVia[]).map((v) => <option key={v} value={v}>{RECEIVED_VIA_LABEL[v]}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Logged by</label>
                <input className={`${INPUT_CLS} ${accent.ring}`} value={loggedBy} onChange={(e) => setLoggedBy(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={label}>Person in charge of the costing</label>
              <input className={`${INPUT_CLS} ${accent.ring}`} value={costingOwner} onChange={(e) => setCostingOwner(e.target.value)} placeholder="Name of the person who prepares the quote" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 px-3 py-2">Cancel</button>
          <button type="submit" disabled={saving} className={`inline-flex items-center gap-2 text-sm font-bold rounded-xl px-4 py-2.5 disabled:opacity-60 ${accent.solid}`}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Log request
          </button>
        </div>
      </form>
    </div>
  );
}
