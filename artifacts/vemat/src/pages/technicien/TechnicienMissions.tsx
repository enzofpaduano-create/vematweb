import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, MapPin, Phone, AlertTriangle, Clock, CheckCircle2, Wrench, CalendarDays, Radio } from "lucide-react";
import { TechnicienLayout } from "./TechnicienLayout";
import { useTechnicienAuth } from "@/contexts/TechnicienAuthContext";
import { supabaseTech } from "@/lib/supabase";
import type { RepairRequest, Company, Chantier } from "@/lib/database.types";

type Mission = RepairRequest & { company?: Company; chantier?: Chantier };

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MONTHS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  en_attente: { label: "En attente", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  planifiee:  { label: "Planifiée",  color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  en_cours:   { label: "En cours",   color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  terminee:   { label: "Terminée",   color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
  annulee:    { label: "Annulée",    color: "text-zinc-500",   bg: "bg-zinc-800 border-zinc-700" },
};

export default function TechnicienMissions() {
  const { technician } = useTechnicienAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMissionPulse, setNewMissionPulse] = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const missionsRef = useRef<Mission[]>([]);
  missionsRef.current = missions;

  const load = async () => {
    if (!technician) return;
    setLoading(true);
    const { data } = await supabaseTech
      .from("repair_requests")
      .select("*, companies(*), chantiers(*)")
      .eq("technician_id", technician.id)
      .not("status", "in", '("annulee")')
      .order("scheduled_date");
    setMissions(
      (data ?? []).map((r: RepairRequest & { companies?: Company; chantiers?: Chantier }) => ({
        ...r, company: r.companies, chantier: r.chantiers,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, [technician]);

  // Realtime: listen for INSERT and UPDATE on this technician's missions
  useEffect(() => {
    if (!technician) return;
    const channel = supabaseTech
      .channel(`tech-missions-${technician.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "repair_requests",
        filter: `technician_id=eq.${technician.id}`,
      }, async (payload) => {
        const newMission = payload.new as RepairRequest;
        const { data: company } = await supabaseTech.from("companies").select("*").eq("id", newMission.company_id).single();
        const chantierRes = newMission.chantier_id
          ? await supabaseTech.from("chantiers").select("*").eq("id", newMission.chantier_id).single()
          : { data: null };
        setMissions((prev) => [...prev, { ...newMission, company: company ?? undefined, chantier: chantierRes.data ?? undefined }]);
        setNewMissionPulse(true);
        setTimeout(() => setNewMissionPulse(false), 5000);
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "repair_requests",
        filter: `technician_id=eq.${technician.id}`,
      }, (payload) => {
        const updated = payload.new as RepairRequest;
        if (updated.status === "annulee") {
          setMissions((prev) => prev.filter((m) => m.id !== updated.id));
        } else {
          setMissions((prev) => prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m));
        }
      })
      .subscribe();
    return () => { supabaseTech.removeChannel(channel); };
  }, [technician]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const isToday = (d: Date) => toDateStr(d) === toDateStr(today);
  const isPast  = (d: Date) => d < today;
  const missionsForDay = (day: Date) => missions.filter((m) => m.scheduled_date === toDateStr(day));
  const unscheduled = missions.filter((m) => !m.scheduled_date && !["terminee", "annulee"].includes(m.status));

  const weekLabel = () => {
    const a = days[0], b = days[6];
    if (a.getMonth() === b.getMonth())
      return `${a.getDate()} – ${b.getDate()} ${MONTHS_FR[a.getMonth()]} ${a.getFullYear()}`;
    return `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTHS_SHORT[b.getMonth()]} ${b.getFullYear()}`;
  };

  const weekMissions = days.flatMap((d) => missionsForDay(d));
  const todayMissions = missionsForDay(today);

  return (
    <TechnicienLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white">Mes missions</h1>
              {newMissionPulse && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/20 border border-orange-500/30 px-2.5 py-1 rounded-full animate-pulse">
                  <Radio className="w-3 h-3" /> Nouvelle mission assignée
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-sm mt-0.5">
              {technician?.name} · {weekMissions.length} intervention{weekMissions.length !== 1 ? "s" : ""} cette semaine
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="text-xs font-bold border border-zinc-700 text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
              Aujourd'hui
            </button>
            <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden">
              <button onClick={() => setWeekStart((d) => addDays(d, -7))} className="p-2 hover:bg-zinc-800 text-zinc-400 transition-colors border-r border-zinc-700">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-zinc-300 px-4 min-w-52 text-center">{weekLabel()}</span>
              <button onClick={() => setWeekStart((d) => addDays(d, 7))} className="p-2 hover:bg-zinc-800 text-zinc-400 transition-colors border-l border-zinc-700">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 overflow-hidden">
                <div className="px-5 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center gap-4">
                  <div className="h-6 w-10 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="px-5 py-8 text-center text-zinc-700 text-sm">—</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-5 items-start">
            <div className="flex-1 space-y-3">
              {days.map((day, i) => {
                const dayMissions = missionsForDay(day);
                const past = isPast(day);
                const today_ = isToday(day);
                return (
                  <div key={i} className={`rounded-xl border overflow-hidden transition-all ${today_ ? "border-orange-500/40 bg-orange-500/5" : past ? "border-zinc-800 opacity-60" : "border-zinc-800"}`}>
                    <div className={`px-5 py-3 flex items-center justify-between border-b ${today_ ? "border-orange-500/20 bg-orange-500/10" : "border-zinc-800 bg-zinc-900"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`text-center min-w-[36px] ${today_ ? "text-orange-400" : past ? "text-zinc-600" : "text-zinc-300"}`}>
                          <p className="text-[10px] font-black uppercase tracking-widest">{DAYS_FR[i]}</p>
                          <p className="text-xl font-black leading-none mt-0.5">{day.getDate()}</p>
                        </div>
                        {today_ && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">Aujourd'hui</span>
                        )}
                      </div>
                      {dayMissions.length > 0 && (
                        <span className="text-xs font-bold text-zinc-500">{dayMissions.length} mission{dayMissions.length > 1 ? "s" : ""}</span>
                      )}
                    </div>
                    {dayMissions.length === 0 ? (
                      <div className="px-5 py-5 text-center text-zinc-700 text-sm">Aucune intervention</div>
                    ) : (
                      <div className="divide-y divide-zinc-800">
                        {dayMissions.map((m) => {
                          const st = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.en_attente;
                          return (
                            <Link key={m.id} href={`/espace-technicien/mission/${m.id}`}>
                              <div className="px-5 py-4 hover:bg-zinc-800/50 transition-colors cursor-pointer">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-black text-white">{m.reference}</span>
                                      {m.priority === "urgente" && (
                                        <span className="flex items-center gap-1 text-[10px] font-black bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                                          <AlertTriangle className="w-2.5 h-2.5" />URGENT
                                        </span>
                                      )}
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.bg} ${st.color}`}>{st.label}</span>
                                    </div>
                                    <p className="text-sm text-zinc-300 font-semibold">{m.equipment_type}{m.equipment_brand ? ` · ${m.equipment_brand}` : ""}{m.equipment_model ? ` ${m.equipment_model}` : ""}</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">{m.company?.name ?? "—"}</p>
                                    {m.chantier && (
                                      <p className="text-xs text-zinc-600 flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        {[m.chantier.address, m.chantier.city].filter(Boolean).join(", ")}
                                      </p>
                                    )}
                                  </div>
                                  <p className="text-xs text-orange-400 font-bold shrink-0">Voir →</p>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="w-56 shrink-0 space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cette semaine</h3>
                {[
                  { label: "Total", value: weekMissions.length, icon: CalendarDays, color: "text-zinc-300" },
                  { label: "Aujourd'hui", value: todayMissions.length, icon: Clock, color: "text-orange-400" },
                  { label: "En cours", value: weekMissions.filter((m) => m.status === "en_cours").length, icon: Wrench, color: "text-orange-400" },
                  { label: "Terminées", value: weekMissions.filter((m) => m.status === "terminee").length, icon: CheckCircle2, color: "text-emerald-400" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                      <span className="text-xs text-zinc-500">{label}</span>
                    </div>
                    <span className={`text-sm font-black ${color}`}>{value}</span>
                  </div>
                ))}
              </div>

              {unscheduled.length > 0 && (
                <div className="bg-zinc-900 border border-yellow-500/20 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-yellow-500/10 flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Non planifiées</h3>
                    <span className="text-xs font-bold bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">{unscheduled.length}</span>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {unscheduled.map((m) => (
                      <Link key={m.id} href={`/espace-technicien/mission/${m.id}`}>
                        <div className="px-4 py-3 hover:bg-zinc-800/50 transition-colors cursor-pointer">
                          <p className="text-xs font-bold text-white">{m.reference}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{m.equipment_type}</p>
                          {m.priority === "urgente" && (
                            <p className="text-[10px] font-black text-red-400 flex items-center gap-0.5 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />Urgent
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {technician?.phone && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Mon contact</h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5"><Phone className="w-3 h-3" />{technician.phone}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TechnicienLayout>
  );
}
