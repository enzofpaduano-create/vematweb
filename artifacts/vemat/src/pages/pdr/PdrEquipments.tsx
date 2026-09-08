import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Wrench, ChevronRight } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import { supabasePdr } from "@/lib/supabase";
import { listAllEquipments, EQUIPMENT_STATUS_LABEL, EQUIPMENT_STATUS_COLOR, type ClientEquipment } from "@/lib/equipments";
import { listClients, type Client } from "@/lib/clients";

export default function PdrEquipments() {
  const [, navigate] = useLocation();
  const [equipments, setEquipments] = useState<ClientEquipment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [eqs, cls] = await Promise.all([listAllEquipments(supabasePdr), listClients(supabasePdr)]);
        if (!cancelled) { setEquipments(eqs); setClients(cls); setLoading(false); }
      } catch (e) { if (!cancelled) { setError((e as Error).message); setLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, []);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return equipments;
    return equipments.filter((eq) => {
      const client = clientById.get(eq.client_id);
      return (
        (eq.brand ?? "").toLowerCase().includes(q) ||
        (eq.model ?? "").toLowerCase().includes(q) ||
        (eq.serial_number ?? "").toLowerCase().includes(q) ||
        (eq.machine_type ?? "").toLowerCase().includes(q) ||
        (client?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [equipments, query, clientById]);

  return (
    <PdrGuard>
      <PdrLayout>
        <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-sky-600 mb-2">Spare parts</p>
            <h1 className="text-3xl lg:text-4xl font-black text-zinc-950">Equipment park</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {equipments.length} machine{equipments.length > 1 ? "s" : ""} across {clients.length} client{clients.length > 1 ? "s" : ""}
            </p>
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brand, model, serial, client…"
              className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {loading && <p className="text-zinc-400 text-sm py-8 text-center animate-pulse">Loading…</p>}
          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center">
              <Wrench className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                {equipments.length === 0 ? "No equipment registered. Add machines from a client's detail page." : "No equipment matches your search."}
              </p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left font-bold px-4 py-3">Brand / Model</th>
                      <th className="text-left font-bold px-4 py-3">S/N</th>
                      <th className="text-left font-bold px-4 py-3">Type</th>
                      <th className="text-left font-bold px-4 py-3">Client</th>
                      <th className="text-right font-bold px-4 py-3">Hour meter</th>
                      <th className="text-left font-bold px-4 py-3">Status</th>
                      <th className="px-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filtered.map((eq) => {
                      const client = clientById.get(eq.client_id);
                      return (
                        <tr
                          key={eq.id}
                          onClick={() => navigate(`/espace-pdr/equipment/${eq.id}`)}
                          className="hover:bg-zinc-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 font-bold text-zinc-950">{eq.brand || "—"} {eq.model || ""}</td>
                          <td className="px-4 py-3 font-mono text-xs text-zinc-500">{eq.serial_number || "—"}</td>
                          <td className="px-4 py-3 text-zinc-600">{eq.machine_type || "—"}</td>
                          <td className="px-4 py-3">
                            {client ? (
                              <Link href={`/espace-pdr/client/${client.id}`} onClick={(e) => e.stopPropagation()}>
                                <span className="text-sky-600 hover:underline font-semibold">{client.name}</span>
                              </Link>
                            ) : <span className="text-zinc-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-zinc-900 tabular-nums">{eq.hour_meter != null ? `${eq.hour_meter} h` : "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded ${EQUIPMENT_STATUS_COLOR[eq.status]}`}>
                              {EQUIPMENT_STATUS_LABEL[eq.status]}
                            </span>
                          </td>
                          <td className="px-2 text-zinc-300"><ChevronRight className="w-4 h-4" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
