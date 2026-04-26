import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Plus, Search, Calendar, Wrench } from "lucide-react";
import { PortalLayout } from "@/components/espace-client/PortalLayout";
import { RepairStatusBadge } from "@/components/espace-client/StatusBadge";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/lib/supabase";
import type { RepairRequest, RepairStatus } from "@/lib/database.types";
import { REPAIR_STATUSES } from "@/lib/database.types";

export default function EspaceClientReparations() {
  const { company, loading: authLoading } = useClientAuth();
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RepairStatus | "all">("all");

  useEffect(() => {
    if (authLoading) return;
    if (!company) { setLoading(false); return; }
    supabase.from("repair_requests").select("*").eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setRepairs(data ?? []); setLoading(false); });
  }, [company, authLoading]);

  const filtered = repairs.filter((r) => {
    const matchSearch = r.reference.toLowerCase().includes(search.toLowerCase()) ||
      r.equipment_type.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-zinc-900">Mes réparations</h1>
            <p className="text-sm text-zinc-500 mt-1">Demandes d'intervention et suivi technicien</p>
          </div>
          <Link href="/espace-client/reparations/nouvelle"
            className="flex items-center gap-2 bg-zinc-900 text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle demande
          </Link>
        </div>

        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
              className="w-full pl-9 pr-3.5 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-accent" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter("all")} className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${filter === "all" ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}>Toutes</button>
            {REPAIR_STATUSES.map((s) => (
              <button key={s.value} onClick={() => setFilter(s.value as RepairStatus)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${filter === s.value ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-zinc-100 py-16 text-center text-zinc-400 text-sm">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-zinc-100 py-16 text-center">
              <Wrench className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm mb-4">Aucune demande de réparation</p>
              <Link href="/espace-client/reparations/nouvelle" className="text-accent font-semibold text-sm hover:underline">
                Créer une demande d'intervention →
              </Link>
            </div>
          ) : filtered.map((r) => (
            <Link key={r.id} href={`/espace-client/reparations/${r.id}`}
              className="bg-white rounded-xl border border-zinc-100 p-5 flex items-center gap-5 hover:border-zinc-200 hover:shadow-sm transition-all block">
              <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-zinc-900 text-sm">{r.reference}</span>
                  {r.priority === "urgente" && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Urgente</span>
                  )}
                  <RepairStatusBadge status={r.status} />
                </div>
                <p className="text-sm text-zinc-600 mt-0.5">{r.equipment_type} {r.equipment_brand ? `· ${r.equipment_brand}` : ""} {r.equipment_model ? r.equipment_model : ""}</p>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{r.description}</p>
              </div>
              <div className="text-right shrink-0">
                {r.scheduled_date ? (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(r.scheduled_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                )}
                <p className="text-xs text-accent font-bold mt-1">Voir →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
