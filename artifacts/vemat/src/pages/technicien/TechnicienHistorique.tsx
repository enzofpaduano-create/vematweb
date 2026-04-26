import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, XCircle, Calendar } from "lucide-react";
import { TechnicienLayout } from "./TechnicienLayout";
import { useTechnicienAuth } from "@/contexts/TechnicienAuthContext";
import { supabaseTech } from "@/lib/supabase";
import type { RepairRequest, Company } from "@/lib/database.types";

type Mission = RepairRequest & { company?: Company };

export default function TechnicienHistorique() {
  const { technician } = useTechnicienAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!technician) return;
    supabaseTech
      .from("repair_requests")
      .select("*, companies(*)")
      .eq("technician_id", technician.id)
      .in("status", ["terminee", "annulee"])
      .order("completed_date", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setMissions((data ?? []).map((r: RepairRequest & { companies?: Company }) => ({ ...r, company: r.companies })));
        setLoading(false);
      });
  }, [technician]);

  return (
    <TechnicienLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Historique</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Interventions terminées et annulées</p>
        </div>

        {loading ? (
          <div className="text-center py-24 text-zinc-600">Chargement...</div>
        ) : missions.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-20 text-center">
            <CheckCircle2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Aucune intervention terminée pour l'instant</p>
          </div>
        ) : (
          <div className="space-y-2">
            {missions.map((m) => (
              <Link key={m.id} href={`/espace-technicien/mission/${m.id}`}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center gap-4 hover:bg-zinc-800/60 transition-colors cursor-pointer">
                  {m.status === "terminee" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-zinc-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-200">{m.reference}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.status === "terminee" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                      }`}>
                        {m.status === "terminee" ? "Terminée" : "Annulée"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {m.company?.name ?? "—"} · {m.equipment_type}
                    </p>
                  </div>
                  {m.completed_date && (
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(m.completed_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </TechnicienLayout>
  );
}
