import { useEffect, useState, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, AlertTriangle, CalendarDays } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { AdminGuard } from "./AdminGuard";
import { supabaseAdmin } from "@/lib/supabase";
import type { RepairRequest, Technician, Company } from "@/lib/database.types";
import { useLang } from "@/i18n/I18nProvider";

type RepairWithCompany = RepairRequest & { company?: Company };

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const MONTHS_SHORT_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, n: number) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function toDateStr(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

export default function AdminCalendrier() {
  const { lang, t } = useLang();
  const DAYS = lang === "fr" ? DAYS_FR : DAYS_EN;
  const MONTHS = lang === "fr" ? MONTHS_FR : MONTHS_EN;
  const MONTHS_SHORT = lang === "fr" ? MONTHS_SHORT_FR : MONTHS_SHORT_EN;
  const [, navigate] = useLocation();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [repairs, setRepairs] = useState<RepairWithCompany[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    Promise.all([
      supabaseAdmin.from("technicians").select("*").order("name"),
      supabaseAdmin.from("repair_requests").select("*, companies(*)").not("status", "in", '("terminee","annulee")').order("created_at", { ascending: false }),
    ]).then(([t, r]) => {
      setTechnicians(t.data ?? []);
      setRepairs((r.data ?? []).map((rep: RepairRequest & { companies?: Company }) => ({ ...rep, company: rep.companies })));
      setLoading(false);
    });
  }, []);

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const isToday = (d: Date) => toDateStr(d) === toDateStr(today);
  const isPast = (d: Date) => d.getTime() < today.getTime();
  const techById = (id: string | null) => id ? technicians.find((t) => t.id === id) ?? null : null;
  const repairsForCell = (day: Date, techId: string | null) => {
    const ds = toDateStr(day);
    return repairs.filter((r) => r.scheduled_date === ds && (techId === null ? !r.technician_id : r.technician_id === techId));
  };
  const unscheduled = repairs.filter((r) => !r.scheduled_date);
  const todayAll = repairs.filter((r) => r.scheduled_date === toDateStr(today));

  const handleDrop = async (e: React.DragEvent, dateStr: string, techId: string | null) => {
    e.preventDefault();
    const repairId = e.dataTransfer.getData("repairId");
    if (!repairId) return;
    setDragOverCell(null);
    setDraggingId(null);
    const repair = repairs.find((r) => r.id === repairId);
    if (!repair) return;
    const newStatus = repair.status === "en_attente" ? "planifiee" : repair.status;
    setRepairs((prev) => prev.map((r) => r.id === repairId ? { ...r, scheduled_date: dateStr, technician_id: techId, status: newStatus } : r));
    await supabaseAdmin.from("repair_requests").update({ scheduled_date: dateStr, technician_id: techId, status: newStatus }).eq("id", repairId);
  };

  // DnD helpers
  const dragHandlers = (repairId: string) => ({
    draggable: true as const,
    onDragStart: (e: React.DragEvent) => {
      isDraggingRef.current = true;
      e.dataTransfer.setData("repairId", repairId);
      e.dataTransfer.effectAllowed = "move";
      setDraggingId(repairId);
    },
    onDragEnd: () => { setDraggingId(null); setTimeout(() => { isDraggingRef.current = false; }, 100); },
  });

  const dropHandlers = (dateStr: string, techId: string | null) => {
    const cellKey = `${techId ?? "null"}-${dateStr}`;
    return {
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverCell(cellKey); },
      onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCell(null); },
      onDrop: (e: React.DragEvent) => handleDrop(e, dateStr, techId),
      "data-over": dragOverCell === cellKey && draggingId ? "true" : "false",
    };
  };

  const weekLabel = () => {
    const a = days[0]; const b = days[6];
    if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${b.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
    return `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTHS_SHORT[b.getMonth()]} ${b.getFullYear()}`;
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-zinc-900">{t("portal.calendar.title")}</h1>
              <p className="text-sm text-zinc-500 mt-0.5">{t("portal.calendar.subtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekStart(startOfWeek(new Date()))}
                className="text-xs font-bold border border-zinc-200 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors">
                {t("portal.calendar.today")}
              </button>
              <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden">
                <button onClick={() => setWeekStart((d) => addDays(d, -7))} className="p-2 hover:bg-zinc-50 border-r border-zinc-200 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-zinc-700 px-4 min-w-56 text-center">{weekLabel()}</span>
                <button onClick={() => setWeekStart((d) => addDays(d, 7))} className="p-2 hover:bg-zinc-50 border-l border-zinc-200 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-zinc-100 py-32 text-center text-zinc-400">{t("portal.common.loading")}</div>
          ) : (
            <div className="flex gap-5 items-start">
              {/* Main grid */}
              <div className="flex-1 bg-white rounded-xl border border-zinc-100 overflow-hidden min-w-0">
                {/* Day headers */}
                <div className="grid border-b border-zinc-100" style={{ gridTemplateColumns: "148px repeat(7, minmax(0, 1fr))" }}>
                  <div className="px-4 py-3 border-r border-zinc-100" />
                  {days.map((day, i) => (
                    <div key={i} className={`px-3 py-3 text-center border-r border-zinc-100 last:border-r-0 ${isToday(day) ? "bg-accent/8" : ""}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isToday(day) ? "text-accent" : "text-zinc-400"}`}>{DAYS[i]}</p>
                      <div className={`text-lg font-black mt-0.5 inline-flex w-8 h-8 items-center justify-center rounded-full mx-auto ${
                        isToday(day) ? "bg-accent text-accent-foreground" : isPast(day) ? "text-zinc-300" : "text-zinc-900"
                      }`}>{day.getDate()}</div>
                    </div>
                  ))}
                </div>

                {technicians.length === 0 ? (
                  <div className="py-16 text-center text-zinc-400 text-sm">{t("portal.calendar.noTechnician")}</div>
                ) : (
                  <>
                    {technicians.map((tech, ti) => (
                      <div key={tech.id}
                        className={`grid border-b border-zinc-50 ${ti === technicians.length - 1 ? "border-b-0" : ""}`}
                        style={{ gridTemplateColumns: "148px repeat(7, minmax(0, 1fr))" }}>
                        <div className="px-3 py-3 border-r border-zinc-100 flex items-center gap-2.5 min-h-[72px]">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
                            style={{ backgroundColor: tech.color }}>
                            {tech.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-800 truncate">{tech.name.split(" ")[0]}</p>
                            {!tech.available && <p className="text-[9px] text-zinc-400 font-semibold uppercase">{t("portal.calendar.indispo")}</p>}
                          </div>
                        </div>
                        {days.map((day, di) => {
                          const dateStr = toDateStr(day);
                          const cellKey = `${tech.id}-${dateStr}`;
                          const isOver = dragOverCell === cellKey && !!draggingId;
                          return (
                            <div key={di}
                              {...dropHandlers(dateStr, tech.id)}
                              className={`px-1.5 py-2 border-r border-zinc-100 last:border-r-0 min-h-[72px] space-y-1 transition-colors ${
                                isOver ? "bg-accent/10 ring-1 ring-inset ring-accent/30" : isToday(day) ? "bg-accent/5" : isPast(day) ? "bg-zinc-50/50" : ""
                              }`}>
                              {repairsForCell(day, tech.id).map((r) => (
                                <div key={r.id}
                                  {...dragHandlers(r.id)}
                                  onClick={() => { if (!isDraggingRef.current) navigate(`/espace-manager/reparations/${r.id}`); }}
                                  className={`rounded-md px-2 py-1.5 cursor-grab active:cursor-grabbing select-none transition-all ${
                                    draggingId === r.id ? "opacity-40 scale-95" : "hover:brightness-95"
                                  } ${r.priority === "urgente" ? "ring-1 ring-red-400" : ""}`}
                                  style={{ backgroundColor: tech.color + "22", borderLeft: `3px solid ${tech.color}` }}>
                                  <p className="text-[10px] font-black text-zinc-800 truncate leading-tight">{r.reference}</p>
                                  {r.company && <p className="text-[9px] text-zinc-500 truncate leading-tight mt-0.5">{r.company.name}</p>}
                                  {r.priority === "urgente" && (
                                    <p className="text-[8px] font-black text-red-600 uppercase flex items-center gap-0.5 mt-0.5">
                                      <AlertTriangle className="w-2.5 h-2.5" /> {t("portal.common.urgent")}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ))}

                    {/* Non-assigné row */}
                    <div className="grid border-t-2 border-zinc-100" style={{ gridTemplateColumns: "148px repeat(7, minmax(0, 1fr))" }}>
                      <div className="px-3 py-3 border-r border-zinc-100 flex items-center gap-2.5 min-h-[60px]">
                        <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-zinc-400 font-black">?</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-400">{t("portal.calendar.unassignedRow")}</p>
                      </div>
                      {days.map((day, di) => {
                        const dateStr = toDateStr(day);
                        const cellKey = `null-${dateStr}`;
                        const isOver = dragOverCell === cellKey && !!draggingId;
                        return (
                          <div key={di}
                            {...dropHandlers(dateStr, null)}
                            className={`px-1.5 py-2 border-r border-zinc-100 last:border-r-0 min-h-[60px] space-y-1 transition-colors ${
                              isOver ? "bg-accent/10 ring-1 ring-inset ring-accent/30" : isToday(day) ? "bg-accent/5" : ""
                            }`}>
                            {repairsForCell(day, null).map((r) => (
                              <div key={r.id}
                                {...dragHandlers(r.id)}
                                onClick={() => { if (!isDraggingRef.current) navigate(`/espace-manager/reparations/${r.id}`); }}
                                className={`rounded-md px-2 py-1.5 cursor-grab active:cursor-grabbing select-none transition-all bg-zinc-100 hover:bg-zinc-200 ${draggingId === r.id ? "opacity-40 scale-95" : ""}`}
                                style={{ borderLeft: "3px solid #a1a1aa" }}>
                                <p className="text-[10px] font-black text-zinc-700 truncate">{r.reference}</p>
                                {r.company && <p className="text-[9px] text-zinc-400 truncate">{r.company.name}</p>}
                                {r.priority === "urgente" && <p className="text-[8px] font-black text-red-600 uppercase">{t("portal.common.urgent")}</p>}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Sidebar */}
              <div className="w-60 shrink-0 space-y-4">
                {todayAll.length > 0 && (
                  <div className="bg-accent/5 border border-accent/20 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-accent/10 flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-accent" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-accent">{t("portal.calendar.today")} · {todayAll.length}</h3>
                    </div>
                    <div className="divide-y divide-accent/10 max-h-64 overflow-y-auto">
                      {todayAll.map((r) => {
                        const tech = techById(r.technician_id ?? null);
                        return (
                          <div key={r.id} onClick={() => navigate(`/espace-manager/reparations/${r.id}`)}
                            className="px-4 py-3 hover:bg-accent/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-bold text-zinc-900">{r.reference}</span>
                              {r.priority === "urgente" && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">{r.company?.name ?? "—"}</p>
                            {tech && (
                              <div className="flex items-center gap-1 mt-1">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tech.color }} />
                                <span className="text-[10px] text-zinc-500">{tech.name}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* À planifier — aussi draggable */}
                <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">{t("portal.calendar.unscheduled")}</h3>
                    {unscheduled.length > 0 && (
                      <span className="text-xs font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full">{unscheduled.length}</span>
                    )}
                  </div>
                  <div className="divide-y divide-zinc-50 max-h-72 overflow-y-auto">
                    {unscheduled.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-zinc-400">{t("portal.calendar.allPlanned")}</div>
                    ) : unscheduled.map((r) => {
                      const tech = techById(r.technician_id ?? null);
                      return (
                        <div key={r.id}
                          {...dragHandlers(r.id)}
                          onClick={() => { if (!isDraggingRef.current) navigate(`/espace-manager/reparations/${r.id}`); }}
                          className={`px-4 py-3 hover:bg-zinc-50 transition-all cursor-grab active:cursor-grabbing select-none ${draggingId === r.id ? "opacity-40" : ""}`}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-bold text-zinc-900">{r.reference}</span>
                            {r.priority === "urgente" && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate">{r.company?.name ?? "—"}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{r.equipment_type}</p>
                          {tech ? (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tech.color }} />
                              <span className="text-[10px] text-zinc-400">{tech.name}</span>
                            </div>
                          ) : <p className="text-[10px] text-zinc-300 mt-1">{t("portal.calendar.noTechnician")}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Légende */}
                <div className="bg-white rounded-xl border border-zinc-100 p-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">{t("portal.calendar.technicianLegend")}</h3>
                  <div className="space-y-2">
                    {technicians.map((tech) => (
                      <div key={tech.id} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tech.color }} />
                        <span className="text-xs text-zinc-700 font-semibold truncate">{tech.name}</span>
                        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${tech.available ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}>
                          {tech.available ? t("portal.calendar.dispo") : t("portal.calendar.indispo")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
