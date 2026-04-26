import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, User, AlertTriangle, CheckCircle2, FileText, ImageIcon, History } from "lucide-react";
import { PortalLayout } from "@/components/espace-client/PortalLayout";
import { RepairStatusBadge } from "@/components/espace-client/StatusBadge";
import { RepairTimeline } from "@/components/espace-client/StatusTimeline";
import { supabase } from "@/lib/supabase";
import type { RepairRequest, Chantier, Technician, StatusHistory } from "@/lib/database.types";

const STATUS_LABELS: Record<string, string> = {
  en_attente: "En attente",
  planifiee: "Planifiée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

export default function EspaceClientReparationDetail() {
  const { id } = useParams<{ id: string }>();
  const [repair, setRepair] = useState<RepairRequest | null>(null);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("repair_requests").select("*").eq("id", id!).single(),
      supabase.from("status_history").select("*").eq("entity_id", id!).order("created_at", { ascending: true }),
    ]).then(([{ data: r }, { data: h }]) => {
      setRepair(r);
      setHistory(h ?? []);
      setLoading(false);
      if (r?.chantier_id) supabase.from("chantiers").select("*").eq("id", r.chantier_id).single().then(({ data: c }) => setChantier(c));
      if (r?.technician_id) supabase.from("technicians").select("*").eq("id", r.technician_id).single().then(({ data: t }) => setTechnician(t));
    });
  }, [id]);

  if (loading) {
    return (
      <PortalLayout>
        <div className="p-8 max-w-4xl space-y-5">
          <div className="h-5 w-32 bg-zinc-100 rounded animate-pulse" />
          <div className="h-8 w-48 bg-zinc-100 rounded animate-pulse" />
          <div className="bg-white rounded-xl border border-zinc-100 p-6 space-y-4">
            <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse" />
            <div className="h-12 bg-zinc-100 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-2">
              <div className="h-3 w-20 bg-zinc-100 rounded animate-pulse" />
              <div className="h-5 w-32 bg-zinc-100 rounded animate-pulse" />
            </div>
            <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-2">
              <div className="h-3 w-28 bg-zinc-100 rounded animate-pulse" />
              <div className="h-5 w-24 bg-zinc-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }
  if (!repair) return <PortalLayout><div className="p-8 text-zinc-400">Réparation introuvable.</div></PortalLayout>;

  return (
    <PortalLayout>
      <div className="p-8 max-w-4xl">
        <Link href="/espace-client/reparations" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux réparations
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-zinc-900">{repair.reference}</h1>
              {repair.priority === "urgente" && (
                <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wider bg-red-100 text-red-600 px-2.5 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> Urgente
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-sm mt-1">Créée le {new Date(repair.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <RepairStatusBadge status={repair.status} />
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-zinc-100 p-6 mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-5">Avancement</h2>
          <RepairTimeline status={repair.status} />
          {repair.scheduled_date && (
            <div className="mt-5 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-900">Intervention planifiée</p>
                <p className="text-xs text-blue-600">
                  {new Date(repair.scheduled_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  {technician && ` · ${technician.name}`}
                </p>
              </div>
            </div>
          )}
          {repair.status === "terminee" && repair.completed_date && (
            <div className="mt-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-900">Réparation terminée</p>
                <p className="text-xs text-emerald-600">Complétée le {new Date(repair.completed_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div className="bg-white rounded-xl border border-zinc-100 p-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">Équipement</h2>
            <p className="font-bold text-zinc-900 text-sm">{repair.equipment_type}</p>
            {repair.equipment_brand && <p className="text-sm text-zinc-600 mt-1">{repair.equipment_brand} {repair.equipment_model}</p>}
            {repair.equipment_serial && <p className="text-xs text-zinc-400 mt-1 font-mono">S/N: {repair.equipment_serial}</p>}
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">Technicien assigné</h2>
            {technician ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: technician.color }}>
                  {technician.name.split(" ").map((w) => w[0]).join("")}
                </div>
                <div>
                  <p className="font-bold text-zinc-900 text-sm">{technician.name}</p>
                  {technician.phone && <p className="text-xs text-zinc-500">{technician.phone}</p>}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-zinc-400">
                <User className="w-4 h-4" />
                <p className="text-sm">En attente d'assignation</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-100 p-5 mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">Description du problème</h2>
          <p className="text-sm text-zinc-700 whitespace-pre-line">{repair.description}</p>
        </div>

        {chantier && (
          <div className="bg-white rounded-xl border border-zinc-100 p-5 mb-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">Chantier</h2>
            <p className="font-bold text-zinc-900">{chantier.name}</p>
            {chantier.address && <p className="text-sm text-zinc-500 mt-1">{chantier.address}, {chantier.city}</p>}
            {chantier.contact_name && <p className="text-sm text-zinc-500 mt-1">Contact : {chantier.contact_name}{chantier.contact_phone ? ` · ${chantier.contact_phone}` : ""}</p>}
          </div>
        )}

        {repair.technician_notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-700 mb-3">Notes du technicien</h2>
            <p className="text-sm text-amber-900 whitespace-pre-line">{repair.technician_notes}</p>
          </div>
        )}

        {/* Status history */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-100 p-6 mb-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> Historique
            </h2>
            <div className="space-y-3">
              {history.map((entry, i) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${i === history.length - 1 ? "bg-accent" : "bg-zinc-300"}`} />
                    {i < history.length - 1 && <div className="w-px bg-zinc-100 mt-1 min-h-[16px]" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-sm font-semibold text-zinc-900">{STATUS_LABELS[entry.new_status] ?? entry.new_status}</p>
                    {entry.old_status && (
                      <p className="text-xs text-zinc-400">depuis : {STATUS_LABELS[entry.old_status] ?? entry.old_status}</p>
                    )}
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {new Date(entry.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Client attachments */}
        {(() => {
          const atts = (repair.attachments as unknown as { name: string; url: string; type: string }[] | null) ?? [];
          if (!atts.length) return null;
          return (
            <div className="bg-white rounded-xl border border-zinc-100 p-5">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-4">Vos documents joints ({atts.length})</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {atts.map((a, i) => (
                  a.type.startsWith("image/") ? (
                    <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                      className="aspect-square rounded-xl overflow-hidden border border-zinc-100 hover:border-accent/40 transition-colors">
                      <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                    </a>
                  ) : (
                    <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                      className="aspect-square rounded-xl border border-zinc-100 hover:border-accent/40 flex flex-col items-center justify-center gap-1 p-2 transition-colors bg-zinc-50">
                      <FileText className="w-6 h-6 text-zinc-400" />
                      <p className="text-[9px] text-zinc-500 font-medium truncate w-full text-center px-1">{a.name}</p>
                    </a>
                  )
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </PortalLayout>
  );
}
