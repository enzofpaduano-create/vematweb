import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Search, Users, AlertCircle, ChevronRight } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import { supabasePdr } from "@/lib/supabase";
import {
  listClients, createClient,
  CLIENT_STATUS_LABEL, CLIENT_STATUS_COLOR, PAYMENT_TERMS_LABEL,
  type Client, type ClientStatus,
} from "@/lib/clients";

export default function PdrClients() {
  const [, navigate] = useLocation();
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function reload() {
    try {
      const list = await listClients(supabasePdr);
      setClients(list);
    } catch (e) { setError((e as Error).message); }
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (clients ?? []).filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.code_unique ?? "").toLowerCase().includes(q) ||
        (c.contact_name ?? "").toLowerCase().includes(q) ||
        (c.contact_email ?? "").toLowerCase().includes(q)
      );
    });
  }, [clients, query, statusFilter]);

  const counts = useMemo(() => {
    const c = { total: clients?.length ?? 0, actif: 0, bloque: 0, litige: 0 };
    for (const cl of clients ?? []) c[cl.status] += 1;
    return c;
  }, [clients]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const created = await createClient(supabasePdr, { name });
      setShowNew(false);
      setNewName("");
      navigate(`/espace-pdr/client/${created.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <PdrGuard>
      <PdrLayout>
        <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-sky-600 mb-2">Spare parts</p>
              <h1 className="text-3xl lg:text-4xl font-black text-zinc-950">Clients</h1>
              <p className="text-sm text-zinc-500 mt-1">
                {counts.total} client{counts.total > 1 ? "s" : ""}
                {counts.bloque > 0 && <> · <span className="text-red-600 font-semibold">{counts.bloque} blocked</span></>}
                {counts.litige > 0 && <> · <span className="text-amber-600 font-semibold">{counts.litige} in dispute</span></>}
              </p>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> New client
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {showNew && (
            <div className="bg-white border border-sky-200 rounded-2xl p-4 mb-6">
              <label className="block text-xs font-bold text-zinc-500 mb-2">Company name (you'll fill the rest on the next screen)</label>
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  placeholder="e.g. SGTM"
                  className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2 rounded-xl disabled:opacity-60"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
                <button
                  onClick={() => { setShowNew(false); setNewName(""); }}
                  className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 px-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, code, contact…"
                className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ClientStatus | "all")}
              className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 focus:outline-none focus:border-sky-400"
            >
              <option value="all">All statuses ({counts.total})</option>
              <option value="actif">{CLIENT_STATUS_LABEL.actif} ({counts.actif})</option>
              <option value="bloque">{CLIENT_STATUS_LABEL.bloque} ({counts.bloque})</option>
              <option value="litige">{CLIENT_STATUS_LABEL.litige} ({counts.litige})</option>
            </select>
          </div>

          {clients === null && !error && (
            <p className="text-zinc-400 text-sm py-8 text-center animate-pulse">Loading…</p>
          )}

          {clients !== null && filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center">
              <Users className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                {clients.length === 0 ? "No clients yet — create your first one." : "No client matches your filters."}
              </p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left font-bold px-4 py-3">Code</th>
                      <th className="text-left font-bold px-4 py-3">Company</th>
                      <th className="text-left font-bold px-4 py-3">Contact</th>
                      <th className="text-left font-bold px-4 py-3">Terms</th>
                      <th className="text-right font-bold px-4 py-3">Credit limit</th>
                      <th className="text-left font-bold px-4 py-3">Status</th>
                      <th className="px-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/espace-pdr/client/${c.id}`)}
                        className="hover:bg-zinc-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500">{c.code_unique || "—"}</td>
                        <td className="px-4 py-3 font-bold text-zinc-950">{c.name}</td>
                        <td className="px-4 py-3 text-zinc-700">
                          {c.contact_name || "—"}
                          {c.contact_phone && <span className="block text-xs text-zinc-400">{c.contact_phone}</span>}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 font-semibold">{PAYMENT_TERMS_LABEL[c.payment_terms]}</td>
                        <td className="px-4 py-3 text-right font-semibold text-zinc-900 tabular-nums">
                          {c.credit_limit > 0 ? `${c.credit_limit.toLocaleString("en-GB")} ${c.currency === "EUR" ? "€" : "$"}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded ${CLIENT_STATUS_COLOR[c.status]}`}>
                            {CLIENT_STATUS_LABEL[c.status]}
                          </span>
                        </td>
                        <td className="px-2 text-zinc-300"><ChevronRight className="w-4 h-4" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Link href="/espace-pdr/tableau" className="inline-block text-xs text-zinc-500 hover:text-sky-600 mt-4 transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
