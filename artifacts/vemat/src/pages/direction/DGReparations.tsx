import { useEffect, useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { DGLayout } from "./DGLayout";
import { DGGuard } from "./DGGuard";
import { RepairStatusBadge } from "@/components/espace-client/StatusBadge";
import { supabaseDG } from "@/lib/supabase";
import type { RepairRequest, Company, Technician } from "@/lib/database.types";

type RepairWithCompany = RepairRequest & { company?: Company };

export default function DGReparations() {
  const [repairs, setRepairs] = useState<RepairWithCompany[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    Promise.all([
      supabaseDG.from("repair_requests").select("*, companies(*)").order("created_at", { ascending: false }),
      supabaseDG.from("technicians").select("*").order("name"),
    ]).then(([r, t]) => {
      setRepairs(
        (r.data ?? []).map((rep: RepairRequest & { companies?: Company }) => ({
          ...rep,
          company: rep.companies,
        }))
      );
      setTechnicians(t.data ?? []);
      setLoading(false);
    });
  }, []);

  const techById = (id: string | null) => (id ? technicians.find((t) => t.id === id) ?? null : null);

  const filtered = repairs.filter((r) => {
    const matchSearch =
      !search ||
      r.reference.toLowerCase().includes(search.toLowerCase()) ||
      r.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.equipment_type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DGGuard>
      <DGLayout>
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-zinc-900">Toutes les réparations</h1>
            <p className="text-sm text-zinc-500 mt-1">{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="planifiee">Planifiée</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
            {loading ? (
              <div className="px-5 py-16 text-center text-sm text-zinc-400">Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-16 text-center text-sm text-zinc-400">Aucune réparation trouvée</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Réf.</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Client</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Équipement</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Technicien</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Statut</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Rapport</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filtered.map((r) => {
                    const tech = techById(r.technician_id ?? null);
                    return (
                      <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900">{r.reference}</span>
                            {r.priority === "urgente" && (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-zinc-600">{r.company?.name ?? "—"}</td>
                        <td className="px-5 py-3 text-zinc-600">{r.equipment_type}</td>
                        <td className="px-5 py-3">
                          {tech ? (
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                                style={{ backgroundColor: tech.color }}>
                                {tech.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                              </span>
                              <span className="text-zinc-700 text-xs">{tech.name}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-zinc-500 text-xs">
                          {r.scheduled_date
                            ? new Date(r.scheduled_date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <RepairStatusBadge status={r.status} />
                        </td>
                        <td className="px-5 py-3">
                          {r.report_locked ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Validé</span>
                          ) : r.report_submitted_at ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">À valider</span>
                          ) : (
                            <span className="text-[10px] text-zinc-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </DGLayout>
    </DGGuard>
  );
}
